"""
Settings and configuration API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.schemas import Settings, LLMProfile
from app.models.pydantic_models import SettingsResponse, SettingsUpdate, LLMProfileResponse, LLMProfileCreate

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
    db_profile = LLMProfile(**profile.model_dump())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.delete("/llm-profiles/{profile_id}")
async def delete_llm_profile(profile_id: int, db: Session = Depends(get_db)):
    """Delete an LLM profile."""
    profile = db.query(LLMProfile).filter(LLMProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    db.delete(profile)
    db.commit()
    return {"message": "Profile deleted"}