"""
Settings and configuration API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.schemas import Settings, LLMProfile
from app.models.pydantic_models import SettingsResponse, SettingsUpdate, LLMProfileResponse, LLMProfileCreate, LLMProfileUpdate
from app.llm_providers import get_llm_provider
from app.utils.crypto import encrypt_api_key, decrypt_api_key, is_api_key_encrypted

router = APIRouter()


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
    
    # Create provider config with decrypted API key
    api_key = ""
    if profile.api_key:
        api_key = decrypt_api_key(profile.api_key)
    
    config = {
        "api_key": api_key,
        "endpoint": profile.endpoint,
        "context_tokens": profile.context_tokens,
        "model_name": profile.model_name
    }
    
    # Get provider instance
    provider = get_llm_provider(profile.provider, config)
    if not provider:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {profile.provider}")
    
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
    # Create provider config with decrypted API key
    api_key = ""
    if profile.api_key:
        api_key = decrypt_api_key(profile.api_key)
    
    config = {
        "api_key": api_key,
        "endpoint": profile.endpoint,
        "context_tokens": profile.context_tokens,
        "model_name": profile.model_name
    }
    
    # Get provider instance
    provider = get_llm_provider(profile.provider, config)
    if not provider:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {profile.provider}")
    
    try:
        # Test connection with a simple message
        test_messages = [
            {"role": "user", "content": "Hello, this is a connection test. Please respond with 'Connection successful!'"}
        ]
        
        response = await provider.generate_completion(test_messages)
        
        if response and "successful" in response.lower():
            return {"status": "success", "message": "Connection test successful"}
        else:
            return {"status": "success", "message": "Connection works but unexpected response"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")