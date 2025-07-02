"""
Database initialization script.
"""
import os
from sqlalchemy import create_engine
from .database import Base, engine
from .schemas import Settings, LLMProfile


def create_tables():
    """Create all database tables."""
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")


def init_default_data():
    """Initialize default settings. LLM profiles must be configured by users."""
    from .database import SessionLocal
    
    db = SessionLocal()
    try:
        # Create default settings if not exists
        settings = db.query(Settings).first()
        if not settings:
            default_settings = Settings(
                yaml_includes=["*.yaml", "*.yml"],
                yaml_excludes=["secrets.yaml", "known_devices.yaml"],
                db_type="sqlite"
            )
            db.add(default_settings)
            print("Default settings created.")
        
        # Don't create a default LLM profile without API key
        # This prevents broken profiles that cause scan failures
        # Users must set up their first profile through the UI
        profile_count = db.query(LLMProfile).count()
        if profile_count == 0:
            print("No LLM profiles found - users will be guided to set up their first profile.")
        
        db.commit()
        
    except Exception as e:
        print(f"Error initializing default data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_tables()
    init_default_data()