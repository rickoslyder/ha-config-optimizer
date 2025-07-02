"""
Scan management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.schemas import Scan, ScanStatus
from app.models.pydantic_models import ScanCreate, ScanResponse
from app.services.yaml_ingest import YAMLIngestService
from app.services.scan_service import ScanService

router = APIRouter()


@router.get("/", response_model=List[ScanResponse])
async def get_scans(db: Session = Depends(get_db)):
    """Get list of all scans."""
    scans = db.query(Scan).order_by(Scan.started_at.desc()).limit(50).all()
    return scans


@router.post("/", response_model=ScanResponse)
async def create_scan(scan_request: ScanCreate, db: Session = Depends(get_db)):
    """Create a new scan and start execution."""
    scan_service = ScanService()
    
    # Create scan record
    scan = scan_service.create_scan(
        db, 
        llm_profile_id=scan_request.llm_profile_id,
        scan_type=scan_request.scan_type
    )
    
    # Start background scan execution
    file_paths = scan_request.files if scan_request.files else None
    await scan_service.start_background_scan(
        scan.id, 
        file_paths=file_paths,
        analysis_types=["optimization"]  # Default to optimization
    )
    
    return scan


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: int, db: Session = Depends(get_db)):
    """Get details of a specific scan."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.post("/{scan_id}/cancel")
async def cancel_scan(scan_id: int, db: Session = Depends(get_db)):
    """Cancel a running scan."""
    scan_service = ScanService()
    success = scan_service.cancel_scan(db, scan_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Scan not found or not cancellable")
    
    return {"message": "Scan cancelled"}


@router.get("/files/tree")
async def get_file_tree():
    """Get available YAML files in config directory."""
    yaml_service = YAMLIngestService()
    return yaml_service.get_file_tree()


@router.get("/providers/supported")
async def get_supported_providers():
    """Get information about supported LLM providers."""
    from app.services.llm_factory import LLMProviderFactory
    return LLMProviderFactory.get_supported_providers()