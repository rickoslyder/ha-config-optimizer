"""
WebSocket endpoints for real-time updates.
"""
import json
import asyncio
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.schemas import Scan, ScanStatus

class ScanConnectionManager:
    """Manages WebSocket connections for scan progress updates."""
    
    def __init__(self):
        # Dictionary mapping scan_id to set of WebSocket connections
        self.scan_connections: Dict[int, Set[WebSocket]] = {}
        # Dictionary mapping WebSocket to scan_id for cleanup
        self.connection_scans: Dict[WebSocket, int] = {}
    
    async def connect(self, websocket: WebSocket, scan_id: int):
        """Connect a WebSocket to a scan."""
        await websocket.accept()
        
        if scan_id not in self.scan_connections:
            self.scan_connections[scan_id] = set()
        
        self.scan_connections[scan_id].add(websocket)
        self.connection_scans[websocket] = scan_id
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket from its scan."""
        if websocket in self.connection_scans:
            scan_id = self.connection_scans[websocket]
            self.scan_connections[scan_id].discard(websocket)
            del self.connection_scans[websocket]
            
            # Clean up empty scan connection sets
            if not self.scan_connections[scan_id]:
                del self.scan_connections[scan_id]
    
    async def send_to_scan(self, scan_id: int, message: dict):
        """Send a message to all connections for a specific scan."""
        if scan_id in self.scan_connections:
            message_str = json.dumps(message)
            disconnected = []
            
            for websocket in self.scan_connections[scan_id]:
                try:
                    await websocket.send_text(message_str)
                except:
                    disconnected.append(websocket)
            
            # Clean up disconnected WebSockets
            for websocket in disconnected:
                self.disconnect(websocket)

# Global connection manager instance
scan_manager = ScanConnectionManager()


async def websocket_scan_endpoint(websocket: WebSocket, scan_id: int):
    """WebSocket endpoint for scan progress updates."""
    await scan_manager.connect(websocket, scan_id)
    
    try:
        # Send initial scan status
        db = next(get_db())
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            await websocket.send_text(json.dumps({
                "type": "status",
                "scan_id": scan_id,
                "status": scan.status.value,
                "progress": get_scan_progress(scan),
                "message": f"Scan #{scan_id} {scan.status.value}"
            }))
        
        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()
            # Handle any client messages if needed
            # For now, just echo back
            await websocket.send_text(f"Echo: {data}")
            
    except WebSocketDisconnect:
        scan_manager.disconnect(websocket)
    except Exception as e:
        scan_manager.disconnect(websocket)
        print(f"WebSocket error: {e}")


def get_scan_progress(scan: Scan) -> dict:
    """Calculate scan progress based on status and metadata."""
    if scan.status == ScanStatus.PENDING:
        return {"percentage": 0, "current_file": None, "total_files": scan.file_count}
    elif scan.status == ScanStatus.RUNNING:
        # TODO: Implement more detailed progress tracking
        return {"percentage": 50, "current_file": "analyzing...", "total_files": scan.file_count}
    elif scan.status == ScanStatus.COMPLETED:
        return {"percentage": 100, "current_file": None, "total_files": scan.file_count}
    elif scan.status == ScanStatus.FAILED:
        return {"percentage": 0, "current_file": None, "total_files": scan.file_count}
    
    return {"percentage": 0, "current_file": None, "total_files": 0}


async def broadcast_scan_update(scan_id: int, status: str, message: str = None, progress: dict = None):
    """Broadcast scan update to all connected clients."""
    update = {
        "type": "update",
        "scan_id": scan_id,
        "status": status,
        "message": message or f"Scan #{scan_id} {status}",
        "timestamp": asyncio.get_event_loop().time()
    }
    
    if progress:
        update["progress"] = progress
    
    await scan_manager.send_to_scan(scan_id, update)


async def broadcast_scan_progress(scan_id: int, current_file: str, completed_files: int, total_files: int):
    """Broadcast detailed scan progress."""
    percentage = int((completed_files / total_files) * 100) if total_files > 0 else 0
    
    update = {
        "type": "progress",
        "scan_id": scan_id,
        "progress": {
            "percentage": percentage,
            "current_file": current_file,
            "completed_files": completed_files,
            "total_files": total_files
        },
        "message": f"Analyzing {current_file} ({completed_files}/{total_files})",
        "timestamp": asyncio.get_event_loop().time()
    }
    
    await scan_manager.send_to_scan(scan_id, update)