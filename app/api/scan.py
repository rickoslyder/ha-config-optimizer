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

router = APIRouter()


@router.get("/", response_model=List[ScanResponse])
async def get_scans(db: Session = Depends(get_db)):
    """Get list of all scans."""
    scans = db.query(Scan).order_by(Scan.started_at.desc()).limit(50).all()
    return scans


@router.post("/", response_model=ScanResponse)
async def create_scan(scan_request: ScanCreate, db: Session = Depends(get_db)):
    """Create a new scan."""
    # Create scan record
    scan = Scan(
        status=ScanStatus.PENDING,
        llm_profile_id=scan_request.llm_profile_id
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    
    # TODO: Start background scan task
    # For now, just return the created scan
    return scan


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: int, db: Session = Depends(get_db)):
    """Get details of a specific scan."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/files/tree")
async def get_file_tree():
    """Get available YAML files in config directory."""
    yaml_service = YAMLIngestService()
    return yaml_service.get_file_tree()