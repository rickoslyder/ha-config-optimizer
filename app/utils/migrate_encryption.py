"""
Migration utility to encrypt existing API keys in the database.
"""
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.schemas import LLMProfile
from app.utils.crypto import encrypt_api_key, is_api_key_encrypted


def migrate_api_keys_to_encrypted():
    """
    One-time migration to encrypt all existing plaintext API keys.
    This should be called during application startup.
    """
    db = next(get_db())
    try:
        # Get all LLM profiles
        profiles = db.query(LLMProfile).all()
        
        migrated_count = 0
        for profile in profiles:
            if profile.api_key and not is_api_key_encrypted(profile.api_key):
                # Encrypt the plaintext API key
                profile.api_key = encrypt_api_key(profile.api_key)
                migrated_count += 1
        
        if migrated_count > 0:
            db.commit()
            print(f"Migrated {migrated_count} API keys to encrypted format")
        else:
            print("No API keys needed migration")
            
    except Exception as e:
        db.rollback()
        print(f"Error during API key migration: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    # Can be run as a standalone script
    migrate_api_keys_to_encrypted()