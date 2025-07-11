"""
FastAPI application factory for Home Assistant Config Optimizer.
"""
import os
from pathlib import Path
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.api import scan, suggestions, settings, ha_integration, logs, debug
from app.api.websocket import websocket_scan_endpoint
from app.models.init_db import create_tables, init_default_data
from app.utils.migrate_encryption import migrate_api_keys_to_encrypted


def is_addon_environment() -> bool:
    """Check if running in Home Assistant addon environment."""
    return os.path.exists("/data/options.json") and (os.path.exists("/homeassistant") or os.path.exists("/config"))


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    # Initialize database on startup
    create_tables()
    init_default_data()
    
    # Migrate existing API keys to encrypted format
    try:
        migrate_api_keys_to_encrypted()
    except Exception as e:
        print(f"Warning: API key migration failed: {e}")
    
    # Configure app for addon environment
    is_addon = is_addon_environment()
    
    app = FastAPI(
        title="Home Assistant Config Optimizer",
        description="LLM-powered analysis and optimization of Home Assistant configurations",
        version="0.1.0",
        docs_url="/api/docs" if not is_addon else None,  # Disable docs in addon
        redoc_url="/api/redoc" if not is_addon else None,  # Disable redoc in addon
    )

    # Configure CORS based on environment
    if is_addon:
        # In addon environment, only allow Home Assistant Ingress
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://172.30.32.2", "https://172.30.32.2"],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PATCH", "DELETE"],
            allow_headers=["*"],
        )
    else:
        # Development environment - allow all origins
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Include API routers
    app.include_router(scan.router, prefix="/api/scan", tags=["scan"])
    app.include_router(suggestions.router, prefix="/api/suggestions", tags=["suggestions"])
    app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
    app.include_router(ha_integration.router, prefix="/api/ha", tags=["homeassistant"])
    app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
    app.include_router(debug.router, prefix="/api/debug", tags=["debug"])

    # WebSocket endpoints
    @app.websocket("/ws/scan/{scan_id}")
    async def websocket_scan(websocket: WebSocket, scan_id: int):
        await websocket_scan_endpoint(websocket, scan_id)

    return app


# Create the application instance
app = create_app()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/addon/info")
async def addon_info():
    """Addon-specific information endpoint."""
    if not is_addon_environment():
        return {"addon": False, "environment": "development"}
    
    # Read addon options if available
    options = {}
    if os.path.exists("/data/options.json"):
        import json
        try:
            with open("/data/options.json", "r") as f:
                options = json.load(f)
        except Exception:
            pass
    
    return {
        "addon": True,
        "environment": "home_assistant",
        "config_path": "/config",
        "data_path": "/data",
        "options": options,
        "supervisor_token": bool(os.getenv("SUPERVISOR_TOKEN")),
    }


# Mount static files LAST to avoid catching API routes
# This must be done after all route definitions
if is_addon_environment():
    static_dir = "/app/static"
else:
    static_dir = "ui/build"

# Only mount static files if directory exists
if Path(static_dir).exists():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")