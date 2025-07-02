"""
Suggestions management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
import logging

from app.models.database import get_db
from app.models.schemas import Suggestion, SuggestionStatus, Diff
from app.models.pydantic_models import SuggestionResponse, SuggestionUpdate
from app.services.yaml_ingest import YAMLIngestService

router = APIRouter()
logger = logging.getLogger(__name__)


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


@router.post("/{suggestion_id}/apply", response_model=SuggestionResponse)
async def apply_suggestion(suggestion_id: int, db: Session = Depends(get_db)):
    """Apply a suggestion's configuration changes to the actual files."""
    suggestion = db.query(Suggestion).filter(Suggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    if suggestion.status == SuggestionStatus.APPLIED:
        raise HTTPException(status_code=400, detail="Suggestion already applied")
    
    if suggestion.status != SuggestionStatus.ACCEPTED:
        raise HTTPException(status_code=400, detail="Suggestion must be accepted before applying")
    
    try:
        # Get the metadata containing the before/after YAML
        metadata = json.loads(suggestion.metadata_json) if suggestion.metadata_json else {}
        
        file_path = metadata.get("file_path")
        after_content = metadata.get("after")
        
        if not file_path or not after_content:
            raise HTTPException(
                status_code=400, 
                detail="Suggestion missing required file path or content data"
            )
        
        # Initialize YAML service
        yaml_service = YAMLIngestService()
        
        # Parse the after content as YAML to ensure it's valid
        try:
            import yaml
            parsed_content = yaml.safe_load(after_content)
        except yaml.YAMLError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid YAML content in suggestion: {str(e)}"
            )
        
        # Write the new content to the file (with automatic backup)
        success = yaml_service.write_yaml_file(file_path, parsed_content)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to write configuration file"
            )
        
        # Create a diff record
        diff_record = Diff(
            suggestion_id=suggestion_id,
            file_path=file_path,
            patch=f"Applied suggestion: {suggestion.title}",
            original_sha="auto_generated"  # Could implement proper SHA tracking
        )
        db.add(diff_record)
        
        # Update suggestion status to APPLIED
        suggestion.status = SuggestionStatus.APPLIED
        db.commit()
        db.refresh(suggestion)
        
        logger.info(f"Successfully applied suggestion {suggestion_id} to {file_path}")
        
        return suggestion
        
    except Exception as e:
        logger.error(f"Error applying suggestion {suggestion_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to apply suggestion: {str(e)}"
        )


@router.post("/{suggestion_id}/preview")
async def preview_suggestion_changes(suggestion_id: int, db: Session = Depends(get_db)):
    """Preview the changes that would be made by applying a suggestion."""
    suggestion = db.query(Suggestion).filter(Suggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    try:
        # Get the metadata containing the before/after YAML
        metadata = json.loads(suggestion.metadata_json) if suggestion.metadata_json else {}
        
        file_path = metadata.get("file_path")
        before_content = metadata.get("before", "")
        after_content = metadata.get("after", "")
        
        if not file_path:
            raise HTTPException(
                status_code=400, 
                detail="Suggestion missing file path information"
            )
        
        # Validate YAML content
        try:
            import yaml
            if after_content:
                yaml.safe_load(after_content)
        except yaml.YAMLError as e:
            return {
                "file_path": file_path,
                "before": before_content,
                "after": after_content,
                "valid": False,
                "error": f"Invalid YAML: {str(e)}"
            }
        
        return {
            "file_path": file_path,
            "before": before_content,
            "after": after_content,
            "valid": True,
            "error": None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to preview suggestion: {str(e)}"
        )