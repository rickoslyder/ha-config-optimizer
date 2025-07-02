"""
Factory for creating LLM provider instances.
"""
from typing import Dict, Any, Optional
import logging

from app.llm_providers.base import BaseLLMProvider
from app.llm_providers.openai import OpenAIProvider
from app.llm_providers.litellm_provider import LiteLLMProvider
from app.models.schemas import LLMProfile
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMProviderFactory:
    """Factory for creating LLM provider instances."""
    
    @staticmethod
    def create_provider(profile: LLMProfile) -> Optional[BaseLLMProvider]:
        """Create an LLM provider from a profile configuration."""
        
        # Validate profile has required fields
        if not profile.provider:
            logger.error(f"Profile {profile.id} missing provider")
            return None
            
        if not profile.endpoint:
            logger.error(f"Profile {profile.id} missing endpoint")
            return None
        
        # Check if API key is required for this provider
        supported_providers = LLMProviderFactory.get_supported_providers()
        provider_info = supported_providers.get(profile.provider.lower())
        
        if provider_info and provider_info.get('requires_api_key', True):
            # Use environment config as fallback for missing profile values
            env_config = settings.get_llm_config(profile.provider)
            api_key = profile.api_key or env_config.get("api_key")
            
            if not api_key:
                logger.error(f"Profile {profile.id} ({profile.provider}) missing required API key")
                return None
                
            # Decrypt API key if it's encrypted
            try:
                from app.utils.crypto import decrypt_api_key, is_api_key_encrypted
                if is_api_key_encrypted(api_key):
                    api_key = decrypt_api_key(api_key)
            except Exception as e:
                logger.error(f"Failed to decrypt API key for profile {profile.id}: {e}")
                return None
        else:
            # For providers that don't require API key (like Ollama)
            env_config = settings.get_llm_config(profile.provider)
            api_key = profile.api_key or env_config.get("api_key", "")
        
        config = {
            "provider": profile.provider,
            "model_name": profile.model_name or env_config.get("model_name"),
            "endpoint": profile.endpoint or env_config.get("endpoint"),
            "api_key": api_key,
            "context_tokens": profile.context_tokens or env_config.get("context_tokens"),
            "role": profile.role,
            # Add optional proxy configuration
            "proxy_url": settings.litellm_proxy_url,
            "proxy_api_key": settings.litellm_proxy_api_key
        }
        
        try:
            # Get supported providers info
            supported_providers = LLMProviderFactory.get_supported_providers()
            provider_lower = profile.provider.lower()
            
            if provider_lower in supported_providers:
                logger.info(f"Creating LiteLLM provider for {profile.provider}")
                return LiteLLMProvider(config)
            else:
                logger.error(f"Unsupported LLM provider: {profile.provider}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to create LLM provider {profile.provider}: {e}")
            return None
    
    @staticmethod
    def create_provider_from_env(provider_name: str, role: str = "optimize") -> Optional[BaseLLMProvider]:
        """Create an LLM provider directly from environment configuration."""
        try:
            config = settings.get_llm_config(provider_name)
            config["role"] = role
            # Add optional proxy configuration
            config["proxy_url"] = settings.litellm_proxy_url
            config["proxy_api_key"] = settings.litellm_proxy_api_key
            
            # Get supported providers info
            supported_providers = LLMProviderFactory.get_supported_providers()
            provider_lower = provider_name.lower()
            
            if provider_lower in supported_providers:
                config["provider"] = provider_name  # Add provider name to config
                logger.info(f"Creating LiteLLM provider for {provider_name}")
                return LiteLLMProvider(config)
            else:
                logger.error(f"Unsupported LLM provider: {provider_name}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to create LLM provider {provider_name} from env: {e}")
            return None
    
    @staticmethod
    def get_supported_providers() -> Dict[str, Dict[str, Any]]:
        """Get information about supported LLM providers via LiteLLM."""
        return {
            "openai": {
                "name": "OpenAI",
                "models": [
                    "gpt-4o",
                    "gpt-4o-mini", 
                    "gpt-4-turbo",
                    "gpt-4",
                    "gpt-3.5-turbo",
                    "o1-preview",
                    "o1-mini"
                ],
                "requires_api_key": True,
                "default_endpoint": "https://api.openai.com/v1",
                "context_limits": {
                    "gpt-4o": 128000,
                    "gpt-4o-mini": 128000,
                    "gpt-4-turbo": 128000,
                    "gpt-4": 8000,
                    "gpt-3.5-turbo": 16000,
                    "o1-preview": 128000,
                    "o1-mini": 128000
                }
            },
            "anthropic": {
                "name": "Anthropic Claude",
                "models": [
                    "claude-3-5-sonnet-20241022",
                    "claude-3-5-haiku-20241022", 
                    "claude-3-opus-20240229",
                    "claude-3-sonnet-20240229",
                    "claude-3-haiku-20240307"
                ],
                "requires_api_key": True,
                "default_endpoint": "https://api.anthropic.com/v1",
                "context_limits": {
                    "claude-3-5-sonnet-20241022": 200000,
                    "claude-3-5-haiku-20241022": 200000,
                    "claude-3-opus-20240229": 200000,
                    "claude-3-sonnet-20240229": 200000,
                    "claude-3-haiku-20240307": 200000
                }
            },
            "google": {
                "name": "Google (Gemini)",
                "models": [
                    "gemini-pro",
                    "gemini-pro-vision",
                    "gemini-1.5-pro",
                    "gemini-1.5-flash"
                ],
                "requires_api_key": True,
                "default_endpoint": "https://generativelanguage.googleapis.com/v1beta",
                "context_limits": {
                    "gemini-pro": 30000,
                    "gemini-pro-vision": 16000,
                    "gemini-1.5-pro": 1000000,
                    "gemini-1.5-flash": 1000000
                }
            },
            "groq": {
                "name": "Groq",
                "models": [
                    "llama3-70b-8192",
                    "llama3-8b-8192",
                    "mixtral-8x7b-32768",
                    "gemma-7b-it"
                ],
                "requires_api_key": True,
                "default_endpoint": "https://api.groq.com/openai/v1",
                "context_limits": {
                    "llama3-70b-8192": 8192,
                    "llama3-8b-8192": 8192,
                    "mixtral-8x7b-32768": 32768,
                    "gemma-7b-it": 8192
                }
            },
            "ollama": {
                "name": "Ollama (Local)",
                "models": [
                    "llama3",
                    "llama3.1",
                    "codellama",
                    "mistral",
                    "phi3"
                ],
                "requires_api_key": False,
                "default_endpoint": "http://localhost:11434",
                "context_limits": {
                    "llama3": 8000,
                    "llama3.1": 128000,
                    "codellama": 16000,
                    "mistral": 8000,
                    "phi3": 128000
                }
            }
        }