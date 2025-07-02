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
            
            # Use both logger and print for debugging
            logger.info(f"=== SCAN {scan_id} EXECUTION START ===")
            logger.info(f"Scan details: status={scan.status}, llm_profile_id={scan.llm_profile_id}")
            
            print(f"=== SCAN {scan_id} EXECUTION START ===")
            print(f"Scan details: status={scan.status}, llm_profile_id={scan.llm_profile_id}")
            print(f"File paths parameter: {file_paths}")
            print(f"Analysis types parameter: {analysis_types}")
            
            # Get LLM profile
            logger.info(f"[SCAN {scan_id}] Step 1: Looking up LLM profile")
            llm_profile = None
            if scan.llm_profile_id:
                logger.info(f"[SCAN {scan_id}] Searching for specific LLM profile ID: {scan.llm_profile_id}")
                llm_profile = db.query(LLMProfile).filter(
                    LLMProfile.id == scan.llm_profile_id
                ).first()
                if llm_profile:
                    logger.info(f"[SCAN {scan_id}] Found specific LLM profile: {llm_profile.name} (provider: {llm_profile.provider})")
                else:
                    logger.warning(f"[SCAN {scan_id}] Specific LLM profile {scan.llm_profile_id} not found")
            
            if not llm_profile:
                logger.info(f"[SCAN {scan_id}] Looking for default active LLM profile")
                # Get default active profile
                llm_profile = db.query(LLMProfile).filter(
                    LLMProfile.is_active == 1
                ).first()
                if llm_profile:
                    logger.info(f"[SCAN {scan_id}] Found default active LLM profile: {llm_profile.name} (provider: {llm_profile.provider})")
                else:
                    logger.error(f"[SCAN {scan_id}] No active LLM profiles found in database")
            
            if not llm_profile:
                logger.error(f"[SCAN {scan_id}] FAILURE: No valid LLM profiles configured")
                print(f"[SCAN {scan_id}] FAILURE: No valid LLM profiles configured")
                print(f"[SCAN {scan_id}] Please configure an LLM profile with a valid API key in Settings")
                scan.status = ScanStatus.FAILED
                scan.ended_at = datetime.utcnow()
                db.commit()
                return False
            
            # Create LLM provider
            logger.info(f"[SCAN {scan_id}] Step 2: Creating LLM provider")
            logger.info(f"[SCAN {scan_id}] Profile details: name={llm_profile.name}, provider={llm_profile.provider}, model={getattr(llm_profile, 'model_name', 'unknown')}")
            
            try:
                llm_provider = LLMProviderFactory.create_provider(llm_profile)
                if llm_provider:
                    logger.info(f"[SCAN {scan_id}] LLM provider created successfully: {type(llm_provider).__name__}")
                else:
                    logger.error(f"[SCAN {scan_id}] LLM provider creation returned None")
            except Exception as e:
                logger.error(f"[SCAN {scan_id}] Exception during LLM provider creation: {e}")
                llm_provider = None
                
            if not llm_provider:
                logger.error(f"[SCAN {scan_id}] FAILURE: Failed to create LLM provider for profile {llm_profile.id}")
                print(f"[SCAN {scan_id}] FAILURE: Failed to create LLM provider for profile {llm_profile.id}")
                print(f"[SCAN {scan_id}] Profile '{llm_profile.name}' may be missing API key or have invalid configuration")
                print(f"[SCAN {scan_id}] Please check your LLM profile settings and test the connection")
                scan.status = ScanStatus.FAILED
                scan.ended_at = datetime.utcnow()
                db.commit()
                return False
            
            # Test LLM connection
            logger.info(f"[SCAN {scan_id}] Step 3: Testing LLM connection")
            try:
                connection_ok, error_msg = await llm_provider.test_connection()
                logger.info(f"[SCAN {scan_id}] LLM connection test result: success={connection_ok}, message='{error_msg}'")
            except Exception as e:
                logger.error(f"[SCAN {scan_id}] Exception during LLM connection test: {e}")
                connection_ok, error_msg = False, f"Connection test exception: {e}"
                
            if not connection_ok:
                logger.error(f"[SCAN {scan_id}] FAILURE: LLM provider connection failed: {error_msg}")
                print(f"[SCAN {scan_id}] FAILURE: LLM provider connection failed: {error_msg}")
                if 'api key' in error_msg.lower() or 'unauthorized' in error_msg.lower():
                    print(f"[SCAN {scan_id}] This appears to be an API key issue - please check your API key in Settings")
                elif 'quota' in error_msg.lower() or 'rate limit' in error_msg.lower():
                    print(f"[SCAN {scan_id}] API quota exceeded - please check your usage limits or try again later")
                else:
                    print(f"[SCAN {scan_id}] Please verify your LLM provider settings and network connection")
                scan.status = ScanStatus.FAILED
                scan.ended_at = datetime.utcnow()
                db.commit()
                return False
            
            # Determine files to scan
            logger.info(f"[SCAN {scan_id}] Step 4: Determining files to scan")
            logger.info(f"[SCAN {scan_id}] Input file_paths: {file_paths}")
            
            if file_paths is None:
                logger.info(f"[SCAN {scan_id}] No specific files provided, using auto-discovery")
                try:
                    file_paths = await self._get_files_to_scan(db)
                    logger.info(f"[SCAN {scan_id}] Auto-discovery returned {len(file_paths) if file_paths else 0} files: {file_paths}")
                except Exception as e:
                    logger.error(f"[SCAN {scan_id}] Exception during file discovery: {e}")
                    file_paths = []
            else:
                logger.info(f"[SCAN {scan_id}] Using provided file paths: {file_paths}")
            
            if not file_paths:
                logger.warning(f"[SCAN {scan_id}] COMPLETED WITH NO FILES: No files found to scan")
                print(f"[SCAN {scan_id}] COMPLETED WITH NO FILES: No files found to scan")
                scan.status = ScanStatus.COMPLETED
                scan.ended_at = datetime.utcnow()
                scan.file_count = 0
                db.commit()
                return True
            
            # Update file count
            logger.info(f"[SCAN {scan_id}] Step 5: Found {len(file_paths)} files to scan")
            scan.file_count = len(file_paths)
            db.commit()
            logger.info(f"[SCAN {scan_id}] Updated scan record with file_count={scan.file_count}")
            
            # Create suggestion engine
            logger.info(f"[SCAN {scan_id}] Step 6: Creating suggestion engine")
            try:
                suggestion_engine = SuggestionEngine(llm_provider, self.yaml_service)
                logger.info(f"[SCAN {scan_id}] Suggestion engine created successfully")
            except Exception as e:
                logger.error(f"[SCAN {scan_id}] FAILURE: Exception creating suggestion engine: {e}")
                scan.status = ScanStatus.FAILED
                scan.ended_at = datetime.utcnow()
                db.commit()
                return False
            
            # Determine analysis types
            if analysis_types is None:
                analysis_types = ["optimization"]  # Default to optimization only
            
            logger.info(f"[SCAN {scan_id}] Step 7: Starting analysis with types: {analysis_types}")
            all_suggestions = []
            
            # Execute each analysis type
            for analysis_type in analysis_types:
                logger.info(f"[SCAN {scan_id}] Running {analysis_type} analysis on {len(file_paths)} files")
                
                try:
                    suggestions = await suggestion_engine.analyze_configuration(
                        file_paths, scan_id, analysis_type
                    )
                    logger.info(f"[SCAN {scan_id}] {analysis_type} analysis completed: {len(suggestions)} suggestions generated")
                    all_suggestions.extend(suggestions)
                    
                except Exception as e:
                    logger.error(f"[SCAN {scan_id}] Error in {analysis_type} analysis: {e}")
                    # Don't fail the entire scan for one analysis type
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
        logger.info("[FILE_DISCOVERY] Starting file discovery process")
        
        settings = db.query(Settings).first()
        logger.info(f"[FILE_DISCOVERY] Settings query result: {settings}")
        
        if not settings:
            # Default file patterns
            includes = ["*.yaml", "*.yml"]
            excludes = ["secrets.yaml", "known_devices.yaml"]
            logger.info(f"[FILE_DISCOVERY] No settings found, using defaults: includes={includes}, excludes={excludes}")
        else:
            includes = settings.yaml_includes or ["*.yaml", "*.yml"]
            excludes = settings.yaml_excludes or ["secrets.yaml", "known_devices.yaml"]
            logger.info(f"[FILE_DISCOVERY] Using settings: includes={includes}, excludes={excludes}")
        
        try:
            logger.info(f"[FILE_DISCOVERY] Calling yaml_service.filter_files with includes={includes}, excludes={excludes}")
            file_paths = self.yaml_service.filter_files(includes, excludes)
            logger.info(f"[FILE_DISCOVERY] filter_files returned {len(file_paths)} files: {file_paths}")
            return file_paths
            
        except Exception as e:
            logger.error(f"[FILE_DISCOVERY] Exception during file filtering: {e}")
            import traceback
            logger.error(f"[FILE_DISCOVERY] Traceback: {traceback.format_exc()}")
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