"""
Settings and configuration API endpoints.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.schemas import Settings, LLMProfile
from app.models.pydantic_models import SettingsResponse, SettingsUpdate, LLMProfileResponse, LLMProfileCreate, LLMProfileUpdate
from app.utils.crypto import encrypt_api_key, decrypt_api_key, is_api_key_encrypted
from app.services.llm_factory import LLMProviderFactory

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=SettingsResponse)
async def get_settings(db: Session = Depends(get_db)):
    """Get current application settings."""
    settings = db.query(Settings).first()
    if not settings:
        # Create default settings if none exist
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.patch("/", response_model=SettingsResponse)
async def update_settings(update: SettingsUpdate, db: Session = Depends(get_db)):
    """Update application settings."""
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings()
        db.add(settings)
    
    # Update fields that were provided
    if update.yaml_includes is not None:
        settings.yaml_includes = update.yaml_includes
    if update.yaml_excludes is not None:
        settings.yaml_excludes = update.yaml_excludes
    if update.cron_expr is not None:
        settings.cron_expr = update.cron_expr
    if update.db_dsn is not None:
        settings.db_dsn = update.db_dsn
    if update.db_type is not None:
        settings.db_type = update.db_type
    
    db.commit()
    db.refresh(settings)
    return settings


@router.get("/llm-profiles", response_model=List[LLMProfileResponse])
async def get_llm_profiles(db: Session = Depends(get_db)):
    """Get all LLM profiles."""
    profiles = db.query(LLMProfile).filter(LLMProfile.is_active == 1).all()
    return profiles


@router.post("/llm-profiles", response_model=LLMProfileResponse)
async def create_llm_profile(profile: LLMProfileCreate, db: Session = Depends(get_db)):
    """Create a new LLM profile."""
    profile_data = profile.model_dump()
    
    # Encrypt API key if provided
    if profile_data.get('api_key'):
        profile_data['api_key'] = encrypt_api_key(profile_data['api_key'])
    
    db_profile = LLMProfile(**profile_data)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.patch("/llm-profiles/{profile_id}", response_model=LLMProfileResponse)
async def update_llm_profile(profile_id: int, update: LLMProfileUpdate, db: Session = Depends(get_db)):
    """Update an LLM profile."""
    profile = db.query(LLMProfile).filter(LLMProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update fields that were provided
    update_dict = update.model_dump(exclude_unset=True)
    
    # Encrypt API key if being updated
    if 'api_key' in update_dict and update_dict['api_key']:
        update_dict['api_key'] = encrypt_api_key(update_dict['api_key'])
    
    for key, value in update_dict.items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/llm-profiles/{profile_id}")
async def delete_llm_profile(profile_id: int, db: Session = Depends(get_db)):
    """Delete an LLM profile."""
    profile = db.query(LLMProfile).filter(LLMProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    db.delete(profile)
    db.commit()
    return {"message": "Profile deleted"}


@router.get("/llm-profiles/{profile_id}/models")
async def get_available_models(profile_id: int, db: Session = Depends(get_db)):
    """Get available models for a specific LLM profile."""
    profile = db.query(LLMProfile).filter(LLMProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Create provider config with properly handled API key
    api_key = ""
    if profile.api_key:
        try:
            if is_api_key_encrypted(profile.api_key):
                api_key = decrypt_api_key(profile.api_key)
            else:
                api_key = profile.api_key
        except Exception:
            api_key = profile.api_key
    
    config = {
        "api_key": api_key,
        "endpoint": profile.endpoint,
        "context_tokens": profile.context_tokens,
        "model_name": profile.model_name
    }
    
    # Create a temporary profile for provider creation
    temp_profile = LLMProfile(
        name="temp_models",
        provider=profile.provider,
        endpoint=profile.endpoint,
        model_name=profile.model_name,
        context_tokens=profile.context_tokens,
        api_key=api_key,
        role="optimize",
        is_active=True
    )
    
    # Get provider instance using factory
    provider = LLMProviderFactory.create_provider(temp_profile)
    if not provider:
        raise HTTPException(status_code=400, detail=f"Failed to create provider for {profile.provider}")
    
    try:
        # Get available models
        if hasattr(provider, 'list_models'):
            models = await provider.list_models()
        else:
            # Fallback for providers without dynamic model listing
            models = []
        
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch models: {str(e)}")


@router.post("/llm-profiles/test-connection")
async def test_llm_connection(profile: LLMProfileCreate):
    """Test connection to an LLM provider."""
    logger.info(f"Testing connection for provider: {profile.provider}")
    
    # Handle API key - it might be encrypted or plaintext from the frontend
    api_key = ""
    if profile.api_key:
        try:
            # Try to decrypt - if it fails, assume it's plaintext from frontend
            if is_api_key_encrypted(profile.api_key):
                api_key = decrypt_api_key(profile.api_key)
            else:
                api_key = profile.api_key
        except Exception as e:
            logger.error(f"Error handling API key: {e}")
            # If decryption fails, treat as plaintext
            api_key = profile.api_key
    
    config = {
        "api_key": api_key,
        "endpoint": profile.endpoint,
        "context_tokens": profile.context_tokens,
        "model_name": profile.model_name,
        "provider": profile.provider
    }
    
    # Validate required fields based on provider
    if profile.provider != 'ollama' and not api_key:
        logger.warning(f"API key missing for provider: {profile.provider}")
        raise HTTPException(status_code=400, detail="API key is required for this provider")
    
    if not profile.endpoint or not profile.model_name:
        logger.warning(f"Missing endpoint or model for provider: {profile.provider}")
        raise HTTPException(status_code=400, detail="Endpoint and model name are required")
    
    # Get provider instance
    try:
        # Create a temporary profile for provider creation
        temp_profile = LLMProfile(
            name="temp_test",
            provider=profile.provider,
            endpoint=profile.endpoint,
            model_name=profile.model_name,
            context_tokens=profile.context_tokens,
            api_key=api_key,
            role=profile.role or "optimize",
            is_active=True
        )
        
        # Get provider instance using factory
        provider = LLMProviderFactory.create_provider(temp_profile)
        if not provider:
            logger.error(f"Failed to create provider instance for: {profile.provider}")
            raise HTTPException(status_code=400, detail=f"Failed to create provider for {profile.provider}")
        
        logger.info(f"Created provider instance: {type(provider).__name__}")
        
        # Use the provider's built-in test_connection method
        success, message = await provider.test_connection()
        
        if success:
            logger.info(f"Connection test successful for {profile.provider}: {message}")
            return {"status": "success", "message": message or "Connection test successful"}
        else:
            logger.warning(f"Connection test failed for {profile.provider}: {message}")
            # Categorize the error based on the message
            error_msg = message.lower() if message else ""
            if 'api key' in error_msg or 'unauthorized' in error_msg or 'invalid' in error_msg:
                raise HTTPException(status_code=401, detail=message or "Invalid API key or unauthorized access")
            elif 'quota' in error_msg or 'rate limit' in error_msg:
                raise HTTPException(status_code=429, detail=message or "API quota exceeded or rate limited")
            elif 'timeout' in error_msg or 'connection' in error_msg:
                raise HTTPException(status_code=503, detail=message or "Network connection failed")
            else:
                raise HTTPException(status_code=500, detail=message or "Connection test failed")
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error during connection test: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")


@router.get("/system-status")
async def get_system_status(db: Session = Depends(get_db)):
    """Get system readiness status for the application."""
    status = {
        "ready": False,
        "issues": [],
        "profiles": {
            "total": 0,
            "valid": 0,
            "missing_api_keys": 0
        }
    }
    
    try:
        # Get all profiles
        profiles = db.query(LLMProfile).filter(LLMProfile.is_active == 1).all()
        status["profiles"]["total"] = len(profiles)
        
        if not profiles:
            status["issues"].append("No LLM profiles configured")
            return status
        
        # Check each profile for validity
        supported_providers = LLMProviderFactory.get_supported_providers()
        valid_profiles = 0
        missing_keys = 0
        
        for profile in profiles:
            profile_valid = True
            
            # Check basic requirements
            if not profile.name or not profile.provider or not profile.endpoint:
                profile_valid = False
                continue
            
            # Check API key requirement
            provider_info = supported_providers.get(profile.provider.lower())
            if provider_info and provider_info.get('requires_api_key', True):
                if not profile.api_key:
                    missing_keys += 1
                    profile_valid = False
            
            if profile_valid:
                valid_profiles += 1
        
        status["profiles"]["valid"] = valid_profiles
        status["profiles"]["missing_api_keys"] = missing_keys
        
        # Determine overall status
        if valid_profiles == 0:
            if missing_keys > 0:
                status["issues"].append(f"{missing_keys} profile(s) missing API keys")
            else:
                status["issues"].append("No valid LLM profiles found")
        else:
            status["ready"] = True
            
        if missing_keys > 0 and valid_profiles > 0:
            status["issues"].append(f"{missing_keys} profile(s) have missing API keys but {valid_profiles} are ready")
        
        return status
        
    except Exception as e:
        status["issues"].append(f"Error checking system status: {str(e)}")
        return status