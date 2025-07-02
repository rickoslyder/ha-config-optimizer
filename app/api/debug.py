"""
Debug API endpoints for troubleshooting file access issues.
"""
import os
from pathlib import Path
from fastapi import APIRouter
from typing import Dict, Any, List

from app.services.yaml_ingest import YAMLIngestService, get_config_path

router = APIRouter()


@router.get("/paths")
async def debug_paths() -> Dict[str, Any]:
    """Get debug information about file paths and directory access."""
    
    debug_info = {
        "environment": {},
        "paths": {},
        "directories": {},
        "config_service": {},
        "system": {}
    }
    
    # Environment detection
    debug_info["environment"] = {
        "addon_env_detected": os.path.exists("/data/options.json"),
        "options_json_exists": os.path.exists("/data/options.json"),
        "current_working_dir": os.getcwd(),
        "python_path": os.environ.get("PYTHONPATH", "Not set"),
        "user": os.environ.get("USER", "Unknown"),
        "home": os.environ.get("HOME", "Unknown")
    }
    
    # Check all possible paths
    possible_paths = [
        "/config",
        "/homeassistant/config", 
        "/homeassistant_config",
        "/homeassistant",
        "/data",
        "/backup",
        "/addon_configs",
        ".",
        str(Path(__file__).parent.parent.parent / "test-config")
    ]
    
    for path in possible_paths:
        path_obj = Path(path)
        info = {
            "exists": path_obj.exists(),
            "is_dir": path_obj.is_dir() if path_obj.exists() else False,
            "is_file": path_obj.is_file() if path_obj.exists() else False,
            "absolute_path": str(path_obj.resolve()) if path_obj.exists() else None,
            "contents": [],
            "error": None
        }
        
        if info["exists"] and info["is_dir"]:
            try:
                contents = list(path_obj.iterdir())
                info["contents"] = [
                    {
                        "name": item.name,
                        "type": "dir" if item.is_dir() else "file",
                        "size": item.stat().st_size if item.is_file() else None
                    }
                    for item in contents[:20]  # Limit to first 20 items
                ]
            except Exception as e:
                info["error"] = str(e)
        
        debug_info["paths"][path] = info
    
    # Get config path detection result
    try:
        selected_path = get_config_path()
        debug_info["config_service"]["selected_path"] = selected_path
        debug_info["config_service"]["selection_error"] = None
    except Exception as e:
        debug_info["config_service"]["selected_path"] = None
        debug_info["config_service"]["selection_error"] = str(e)
    
    # Test YAMLIngestService
    try:
        service = YAMLIngestService()
        debug_info["config_service"]["service_init"] = "SUCCESS"
        debug_info["config_service"]["service_config_path"] = str(service.config_path)
        debug_info["config_service"]["service_path_exists"] = service.config_path.exists()
        
        # Try to get file tree
        try:
            tree = service.get_file_tree()
            debug_info["config_service"]["file_tree_files"] = len(tree.get("files", []))
            debug_info["config_service"]["file_tree_error"] = None
        except Exception as e:
            debug_info["config_service"]["file_tree_files"] = 0
            debug_info["config_service"]["file_tree_error"] = str(e)
            
    except Exception as e:
        debug_info["config_service"]["service_init"] = f"ERROR: {e}"
    
    # System information
    debug_info["system"]["platform"] = os.name
    debug_info["system"]["env_vars"] = {
        key: value for key, value in os.environ.items() 
        if not key.lower().endswith(('password', 'token', 'key', 'secret'))
    }
    
    return debug_info


@router.get("/file-tree-raw")
async def debug_file_tree_raw() -> Dict[str, Any]:
    """Get raw file tree with all debug information."""
    try:
        service = YAMLIngestService()
        return {
            "status": "success",
            "config_path": str(service.config_path),
            "tree": service.get_file_tree(),
            "error": None
        }
    except Exception as e:
        return {
            "status": "error", 
            "config_path": None,
            "tree": {"files": []},
            "error": str(e)
        }