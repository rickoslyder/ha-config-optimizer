"""
Cryptographic utilities for secure storage of sensitive data.
"""
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class EncryptionManager:
    """Manages encryption/decryption of sensitive data like API keys."""
    
    def __init__(self):
        self._fernet = None
        self._initialize_key()
    
    def _initialize_key(self):
        """Initialize or load the encryption key."""
        # Try to get key from environment variable first
        key_env = os.getenv("ENCRYPTION_KEY")
        if key_env:
            try:
                key = base64.urlsafe_b64decode(key_env.encode())
                self._fernet = Fernet(key_env)
                return
            except Exception:
                pass  # Fall through to generate new key
        
        # Generate key from a password (use Home Assistant's supervisor token if available)
        password = os.getenv("SUPERVISOR_TOKEN", "ha-config-optimizer-default-key").encode()
        salt = b"ha-config-optimizer-salt"  # Fixed salt for consistency
        
        # Derive key using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        self._fernet = Fernet(key)
    
    def encrypt(self, data: str) -> str:
        """Encrypt a string and return base64 encoded result."""
        if not data:
            return ""
        
        try:
            encrypted = self._fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            # If encryption fails, log warning but don't crash
            print(f"Warning: Failed to encrypt data: {e}")
            return data  # Return unencrypted as fallback
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt base64 encoded encrypted string."""
        if not encrypted_data:
            return ""
        
        try:
            # First, try to decrypt (assume it's encrypted)
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self._fernet.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception:
            # If decryption fails, assume it's plain text (backward compatibility)
            return encrypted_data
    
    def is_encrypted(self, data: str) -> bool:
        """Check if data appears to be encrypted."""
        if not data:
            return False
        
        try:
            # Try to decode as base64
            decoded = base64.urlsafe_b64decode(data.encode())
            # Try to decrypt
            self._fernet.decrypt(decoded)
            return True
        except Exception:
            return False


# Global instance
encryption_manager = EncryptionManager()


def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key for secure storage."""
    return encryption_manager.encrypt(api_key)


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key for use."""
    return encryption_manager.decrypt(encrypted_key)


def is_api_key_encrypted(api_key: str) -> bool:
    """Check if an API key is encrypted."""
    return encryption_manager.is_encrypted(api_key)