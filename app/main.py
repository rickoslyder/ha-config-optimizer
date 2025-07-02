"""
FastAPI application factory for Home Assistant Config Optimizer.
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.api import scan, suggestions, settings
from app.models.init_db import create_tables, init_default_data


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    # Initialize database on startup
    create_tables()
    init_default_data()
    
    app = FastAPI(
        title="Home Assistant Config Optimizer",
        description="LLM-powered analysis and optimization of Home Assistant configurations",
        version="0.1.0",
    )

    # Add CORS middleware for development
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

    # Serve static frontend files
    app.mount("/", StaticFiles(directory="ui/build", html=True), name="static")

    return app


# Create the application instance
app = create_app()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}