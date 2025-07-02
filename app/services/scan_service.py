"""
Service for executing configuration scans and managing scan lifecycle.
"""
import asyncio
from typing import List, Optional
from datetime import datetime
import logging

from sqlalchemy.orm import Session
from app.models.database import SessionLocal
from app.models.schemas import Scan, ScanStatus, Suggestion, LLMProfile, Settings
from app.services.suggestion_engine import SuggestionEngine
from app.services.yaml_ingest import YAMLIngestService
from app.services.llm_factory import LLMProviderFactory

logger = logging.getLogger(__name__)


class ScanService:
    """Service for managing configuration scans."""
    
    def __init__(self):
        self.yaml_service = YAMLIngestService()
    
    async def execute_scan(
        self, 
        scan_id: int, 
        file_paths: Optional[List[str]] = None,
        analysis_types: Optional[List[str]] = None
    ) -> bool:
        """
        Execute a complete scan workflow.
        
        Args:
            scan_id: Database scan ID
            file_paths: Specific files to scan (None for auto-discovery)
            analysis_types: Types of analysis to perform (optimization, automation)
            
        Returns:
            True if scan completed successfully, False otherwise
        """
        db = SessionLocal()
        
        try:
            # Get scan record
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if not scan:
                logger.error(f"Scan {scan_id} not found")
                return False
            
            # Update scan status
            scan.status = ScanStatus.RUNNING
            db.commit()
            
            logger.info(f"Starting scan execution for scan {scan_id}")
            
            # Get LLM profile
            llm_profile = None
            if scan.llm_profile_id:
                llm_profile = db.query(LLMProfile).filter(
                    LLMProfile.id == scan.llm_profile_id
                ).first()
            
            if not llm_profile:
                # Get default active profile
                llm_profile = db.query(LLMProfile).filter(
                    LLMProfile.is_active == 1
                ).first()
            
            if not llm_profile:
                logger.error("No LLM profile available for scan")
                scan.status = ScanStatus.FAILED
                scan.ended_at = datetime.utcnow()
                db.commit()
                return False
            
            # Create LLM provider
            llm_provider = LLMProviderFactory.create_provider(llm_profile)
            if not llm_provider:
                logger.error(f"Failed to create LLM provider for profile {llm_profile.id}")
                scan.status = ScanStatus.FAILED
                scan.ended_at = datetime.utcnow()
                db.commit()
                return False
            
            # Test LLM connection
            connection_ok, error_msg = await llm_provider.test_connection()
            if not connection_ok:
                logger.error(f"LLM provider connection failed: {error_msg}")
                scan.status = ScanStatus.FAILED
                scan.ended_at = datetime.utcnow()
                db.commit()
                return False
            
            # Determine files to scan
            if file_paths is None:
                file_paths = await self._get_files_to_scan(db)
            
            if not file_paths:
                logger.warning("No files found to scan")
                scan.status = ScanStatus.COMPLETED
                scan.ended_at = datetime.utcnow()
                scan.file_count = 0
                db.commit()
                return True
            
            # Update file count
            scan.file_count = len(file_paths)
            db.commit()
            
            # Create suggestion engine
            suggestion_engine = SuggestionEngine(llm_provider, self.yaml_service)
            
            # Determine analysis types
            if analysis_types is None:
                analysis_types = ["optimization"]  # Default to optimization only
            
            all_suggestions = []
            
            # Execute each analysis type
            for analysis_type in analysis_types:
                logger.info(f"Running {analysis_type} analysis")
                
                try:
                    suggestions = await suggestion_engine.analyze_configuration(
                        file_paths, scan_id, analysis_type
                    )
                    all_suggestions.extend(suggestions)
                    
                except Exception as e:
                    logger.error(f"Error in {analysis_type} analysis: {e}")
                    continue
            
            # Store suggestions in database
            suggestion_count = 0
            for suggestion_data in all_suggestions:
                try:
                    # Store metadata in separate JSON field
                    metadata = suggestion_data.pop("metadata", {})
                    suggestion_data["metadata_json"] = metadata
                    
                    suggestion = Suggestion(**suggestion_data)
                    db.add(suggestion)
                    suggestion_count += 1
                    
                except Exception as e:
                    logger.error(f"Error storing suggestion: {e}")
                    continue
            
            # Complete scan
            scan.status = ScanStatus.COMPLETED
            scan.ended_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Scan {scan_id} completed successfully with {suggestion_count} suggestions")
            return True
            
        except Exception as e:
            logger.error(f"Scan {scan_id} failed with error: {e}")
            
            # Mark scan as failed
            try:
                scan = db.query(Scan).filter(Scan.id == scan_id).first()
                if scan:
                    scan.status = ScanStatus.FAILED
                    scan.ended_at = datetime.utcnow()
                    db.commit()
            except Exception as commit_error:
                logger.error(f"Failed to update scan status: {commit_error}")
            
            return False
            
        finally:
            db.close()
    
    async def _get_files_to_scan(self, db: Session) -> List[str]:
        """Get list of files to scan based on settings."""
        settings = db.query(Settings).first()
        
        if not settings:
            # Default file patterns
            includes = ["*.yaml", "*.yml"]
            excludes = ["secrets.yaml", "known_devices.yaml"]
        else:
            includes = settings.yaml_includes or ["*.yaml", "*.yml"]
            excludes = settings.yaml_excludes or ["secrets.yaml", "known_devices.yaml"]
        
        try:
            file_paths = self.yaml_service.filter_files(includes, excludes)
            logger.info(f"Found {len(file_paths)} files to scan")
            return file_paths
            
        except Exception as e:
            logger.error(f"Error getting files to scan: {e}")
            return []
    
    def create_scan(
        self, 
        db: Session, 
        llm_profile_id: Optional[int] = None,
        scan_type: str = "manual"
    ) -> Scan:
        """Create a new scan record."""
        scan = Scan(
            status=ScanStatus.PENDING,
            llm_profile_id=llm_profile_id,
            started_at=datetime.utcnow()
        )
        
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        logger.info(f"Created new scan {scan.id}")
        return scan
    
    async def start_background_scan(
        self, 
        scan_id: int, 
        file_paths: Optional[List[str]] = None,
        analysis_types: Optional[List[str]] = None
    ):
        """Start a scan in the background."""
        logger.info(f"Starting background scan {scan_id}")
        
        # Start scan in background task
        asyncio.create_task(self.execute_scan(scan_id, file_paths, analysis_types))
    
    def get_scan_status(self, db: Session, scan_id: int) -> Optional[Scan]:
        """Get current status of a scan."""
        return db.query(Scan).filter(Scan.id == scan_id).first()
    
    def get_recent_scans(self, db: Session, limit: int = 50) -> List[Scan]:
        """Get recent scans ordered by start time."""
        return db.query(Scan).order_by(Scan.started_at.desc()).limit(limit).all()
    
    def cancel_scan(self, db: Session, scan_id: int) -> bool:
        """Cancel a running scan."""
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        
        if not scan:
            return False
        
        if scan.status == ScanStatus.RUNNING:
            scan.status = ScanStatus.FAILED
            scan.ended_at = datetime.utcnow()
            db.commit()
            logger.info(f"Cancelled scan {scan_id}")
            return True
        
        return False