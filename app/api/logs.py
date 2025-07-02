"""
Logs API endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from datetime import datetime

from ..models.database import get_db
from ..models.schemas import Log as LogModel

router = APIRouter()


@router.get("/")
async def get_logs(
    scan_id: Optional[int] = Query(None, description="Filter by scan ID"),
    level: Optional[str] = Query(None, description="Filter by log level"),
    component: Optional[str] = Query(None, description="Filter by component"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of logs to return"),
    offset: int = Query(0, ge=0, description="Number of logs to skip"),
    db: Session = Depends(get_db)
):
    """Get logs with optional filtering."""
    query = db.query(LogModel)
    
    # Apply filters
    filters = []
    if scan_id is not None:
        filters.append(LogModel.scan_id == scan_id)
    if level:
        filters.append(LogModel.level == level.upper())
    if component:
        filters.append(LogModel.component == component)
    
    if filters:
        query = query.filter(and_(*filters))
    
    # Order by timestamp descending (newest first)
    query = query.order_by(LogModel.timestamp.desc())
    
    # Apply pagination
    total = query.count()
    logs = query.offset(offset).limit(limit).all()
    
    # Convert to response format
    response = {
        "total": total,
        "logs": [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat(),
                "level": log.level.lower(),
                "message": log.message,
                "component": log.component,
                "scan_id": log.scan_id,
                "details": log.details
            }
            for log in logs
        ]
    }
    
    return response


@router.post("/")
async def create_log(
    level: str,
    message: str,
    component: Optional[str] = None,
    scan_id: Optional[int] = None,
    details: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Create a new log entry."""
    log = LogModel(
        level=level.upper(),
        message=message,
        component=component,
        scan_id=scan_id,
        details=details,
        timestamp=datetime.utcnow()
    )
    
    db.add(log)
    db.commit()
    db.refresh(log)
    
    return {
        "id": log.id,
        "timestamp": log.timestamp.isoformat(),
        "level": log.level.lower(),
        "message": log.message,
        "component": log.component,
        "scan_id": log.scan_id,
        "details": log.details
    }


@router.delete("/")
async def clear_logs(
    scan_id: Optional[int] = Query(None, description="Clear logs for specific scan only"),
    db: Session = Depends(get_db)
):
    """Clear logs, optionally filtered by scan ID."""
    query = db.query(LogModel)
    
    if scan_id is not None:
        query = query.filter(LogModel.scan_id == scan_id)
    
    count = query.count()
    query.delete()
    db.commit()
    
    return {"deleted": count}