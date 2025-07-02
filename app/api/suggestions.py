"""
Suggestions management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.schemas import Suggestion
from app.models.pydantic_models import SuggestionResponse, SuggestionUpdate

router = APIRouter()


@router.get("/", response_model=List[SuggestionResponse])
async def get_suggestions(scan_id: int = None, db: Session = Depends(get_db)):
    """Get list of suggestions, optionally filtered by scan."""
    query = db.query(Suggestion)
    
    if scan_id:
        query = query.filter(Suggestion.scan_id == scan_id)
    
    suggestions = query.order_by(Suggestion.created_at.desc()).limit(100).all()
    return suggestions


@router.patch("/{suggestion_id}", response_model=SuggestionResponse)
async def update_suggestion(
    suggestion_id: int, 
    update: SuggestionUpdate, 
    db: Session = Depends(get_db)
):
    """Update suggestion status (accept/reject)."""
    suggestion = db.query(Suggestion).filter(Suggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion.status = update.status
    db.commit()
    db.refresh(suggestion)
    
    return suggestion


@router.delete("/{suggestion_id}")
async def delete_suggestion(suggestion_id: int, db: Session = Depends(get_db)):
    """Delete a suggestion."""
    suggestion = db.query(Suggestion).filter(Suggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    db.delete(suggestion)
    db.commit()
    
    return {"message": "Suggestion deleted"}