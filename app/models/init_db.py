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
    """Initialize default settings and LLM profiles."""
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
        
        # Create default LLM profile if not exists
        profile = db.query(LLMProfile).first()
        if not profile:
            default_profile = LLMProfile(
                name="Default OpenAI",
                provider="openai",
                endpoint="https://api.openai.com/v1",
                context_tokens=4000,
                role="optimize",
                model_name="gpt-3.5-turbo",
                is_active=1
            )
            db.add(default_profile)
            print("Default LLM profile created.")
        
        db.commit()
        
    except Exception as e:
        print(f"Error initializing default data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_tables()
    init_default_data()