"""
Unified LLM provider using LiteLLM for 100+ AI model support.
"""
import os
import logging
import asyncio
from typing import AsyncGenerator, Optional, Dict, Any, List
import litellm
from litellm import completion, acompletion
import openai

from .base import BaseLLMProvider, LLMMessage, LLMResponse

logger = logging.getLogger(__name__)


class LiteLLMProvider(BaseLLMProvider):
    """Unified LLM provider using LiteLLM for all supported AI models."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        
        # Check if proxy configuration is provided
        self.proxy_url = config.get("proxy_url")
        self.proxy_api_key = config.get("proxy_api_key")
        
        # Configure LiteLLM based on provider and config
        self.litellm_model = self._get_litellm_model_name()
        
        # Set up authentication (proxy or direct)
        if self.proxy_url:
            self._setup_proxy_auth()
        else:
            self._setup_environment_auth()
        
        # Configure LiteLLM settings
        litellm.drop_params = True  # Drop unsupported parameters automatically
        litellm.set_verbose = False  # Reduce logging noise
        
        logger.info(f"LiteLLM provider initialized: {self.litellm_model} (proxy: {bool(self.proxy_url)})")
    
    def _get_litellm_model_name(self) -> str:
        """Convert provider/model config to LiteLLM model identifier."""
        provider = self.provider_name.lower()
        model = self.model_name
        
        # Map our provider names to LiteLLM format
        if provider == "openai":
            return model  # OpenAI models use direct names (gpt-4, gpt-3.5-turbo, etc.)
        elif provider == "anthropic":
            return f"anthropic/{model}"  # anthropic/claude-3-sonnet-20240229
        elif provider == "google":
            if "gemini" in model.lower():
                return f"gemini/{model}"  # gemini/gemini-pro
            else:
                return f"vertex_ai/{model}"  # vertex_ai/text-bison
        elif provider == "groq":
            return f"groq/{model}"  # groq/llama3-70b-8192
        elif provider == "ollama":
            return f"ollama/{model}"  # ollama/llama3
        else:
            # For unknown providers, try direct model name
            return model
    
    def _setup_environment_auth(self):
        """Set up environment variables for LiteLLM authentication."""
        provider = self.provider_name.lower()
        
        if self.api_key:
            # Map provider names to LiteLLM environment variables
            if provider == "openai":
                os.environ["OPENAI_API_KEY"] = self.api_key
            elif provider == "anthropic":
                os.environ["ANTHROPIC_API_KEY"] = self.api_key
            elif provider == "google":
                os.environ["GOOGLE_API_KEY"] = self.api_key
            elif provider == "groq":
                os.environ["GROQ_API_KEY"] = self.api_key
            # Ollama typically doesn't need an API key for local instances
        
        # Set custom endpoint if provided
        if self.endpoint:
            if provider == "openai":
                os.environ["OPENAI_API_BASE"] = self.endpoint
            elif provider == "anthropic":
                os.environ["ANTHROPIC_API_BASE"] = self.endpoint
            elif provider == "ollama":
                os.environ["OLLAMA_API_BASE"] = self.endpoint
    
    def _setup_proxy_auth(self):
        """Set up authentication for LiteLLM proxy server."""
        logger.info(f"Using LiteLLM proxy at {self.proxy_url}")
        
        # For proxy mode, we set the API base and key for OpenAI client compatibility
        if self.proxy_api_key:
            os.environ["OPENAI_API_KEY"] = self.proxy_api_key
        else:
            # Use a default proxy key if none provided
            os.environ["OPENAI_API_KEY"] = "sk-1234"  # Common proxy placeholder
        
        # Set the proxy URL as the OpenAI base URL
        os.environ["OPENAI_API_BASE"] = self.proxy_url
    
    async def generate(self, messages: List[LLMMessage]) -> LLMResponse:
        """Generate a single response using LiteLLM."""
        try:
            # Convert our LLMMessage format to LiteLLM format
            litellm_messages = [
                {"role": msg.role, "content": msg.content} 
                for msg in messages
            ]
            
            # Prepare completion parameters
            completion_params = {
                "model": self.litellm_model,
                "messages": litellm_messages,
                "temperature": 0.1,
                "max_tokens": min(4000, self.context_tokens // 4),
            }
            
            # Add custom endpoint if specified (but not when using proxy)
            if not self.proxy_url and self.endpoint and self.provider_name.lower() not in ["openai", "anthropic"]:
                completion_params["api_base"] = self.endpoint
            elif self.proxy_url:
                # When using proxy, always use proxy URL as base
                completion_params["api_base"] = self.proxy_url
            
            logger.debug(f"LiteLLM completion request: {completion_params}")
            
            # Make the completion request
            response = await acompletion(**completion_params)
            
            # Extract response content
            content = ""
            if response.choices and len(response.choices) > 0:
                choice = response.choices[0]
                if hasattr(choice, 'message') and choice.message:
                    content = choice.message.content or ""
            
            # Convert to our LLMResponse format
            return LLMResponse(
                content=content,
                usage=response.usage._asdict() if response.usage else None,
                model=response.model if hasattr(response, 'model') else self.litellm_model,
                finish_reason=response.choices[0].finish_reason if response.choices else None
            )
            
        except openai.AuthenticationError as e:
            logger.error(f"Authentication failed for {self.litellm_model}: {e}")
            raise Exception(f"Invalid API key or unauthorized access: {str(e)}")
        except openai.RateLimitError as e:
            logger.error(f"Rate limit exceeded for {self.litellm_model}: {e}")
            raise Exception(f"API rate limit exceeded. Please wait and try again: {str(e)}")
        except openai.APITimeoutError as e:
            logger.error(f"Request timeout for {self.litellm_model}: {e}")
            raise Exception(f"Request timed out. Please check your connection: {str(e)}")
        except openai.BadRequestError as e:
            logger.error(f"Bad request for {self.litellm_model}: {e}")
            raise Exception(f"Invalid request parameters: {str(e)}")
        except Exception as e:
            # Check if this is a retryable error
            if hasattr(e, 'status_code'):
                should_retry = litellm._should_retry(e.status_code)
                logger.error(f"LiteLLM error (retryable: {should_retry}): {e}")
            else:
                logger.error(f"LiteLLM generation error: {e}")
            raise Exception(f"LLM generation failed: {str(e)}")
    
    async def stream_generate(self, messages: List[LLMMessage]) -> AsyncGenerator[str, None]:
        """Stream response tokens using LiteLLM."""
        try:
            # Convert our LLMMessage format to LiteLLM format
            litellm_messages = [
                {"role": msg.role, "content": msg.content} 
                for msg in messages
            ]
            
            # Prepare completion parameters
            completion_params = {
                "model": self.litellm_model,
                "messages": litellm_messages,
                "temperature": 0.1,
                "max_tokens": min(4000, self.context_tokens // 4),
                "stream": True
            }
            
            # Add custom endpoint if specified (but not when using proxy)
            if not self.proxy_url and self.endpoint and self.provider_name.lower() not in ["openai", "anthropic"]:
                completion_params["api_base"] = self.endpoint
            elif self.proxy_url:
                # When using proxy, always use proxy URL as base
                completion_params["api_base"] = self.proxy_url
            
            logger.debug(f"LiteLLM streaming request: {completion_params}")
            
            # Make the streaming completion request
            response_stream = await acompletion(**completion_params)
            
            # Stream the response
            async for chunk in response_stream:
                if chunk.choices and len(chunk.choices) > 0:
                    choice = chunk.choices[0]
                    if hasattr(choice, 'delta') and choice.delta:
                        if hasattr(choice.delta, 'content') and choice.delta.content:
                            yield choice.delta.content
                            
        except openai.AuthenticationError as e:
            logger.error(f"Authentication failed during streaming for {self.litellm_model}: {e}")
            yield f"Error: Invalid API key or unauthorized access"
        except openai.RateLimitError as e:
            logger.error(f"Rate limit exceeded during streaming for {self.litellm_model}: {e}")
            yield f"Error: API rate limit exceeded. Please wait and try again"
        except openai.APITimeoutError as e:
            logger.error(f"Request timeout during streaming for {self.litellm_model}: {e}")
            yield f"Error: Request timed out. Please check your connection"
        except Exception as e:
            # Check if this is a retryable error
            if hasattr(e, 'status_code'):
                should_retry = litellm._should_retry(e.status_code)
                logger.error(f"LiteLLM streaming error (retryable: {should_retry}): {e}")
            else:
                logger.error(f"LiteLLM streaming error: {e}")
            yield f"Error: {str(e)}"
    
    async def test_connection(self) -> tuple[bool, Optional[str]]:
        """Test LLM provider connection using LiteLLM."""
        try:
            logger.info(f"Testing connection for {self.litellm_model}")
            
            # Simple test message
            test_messages = [
                LLMMessage(role="user", content="Hello, please respond with 'OK' if you can hear me.")
            ]
            
            # Try to generate a response
            response = await self.generate(test_messages)
            
            if response.content:
                logger.info(f"Connection test successful for {self.litellm_model}")
                return True, "Connection successful"
            else:
                logger.warning(f"Empty response from {self.litellm_model}")
                return False, "Empty response from API"
                
        except openai.AuthenticationError as e:
            logger.error(f"Authentication failed for {self.litellm_model}: {e}")
            return False, "Invalid API key or unauthorized access"
        except openai.RateLimitError as e:
            logger.error(f"Rate limit exceeded for {self.litellm_model}: {e}")
            return False, "API quota exceeded or rate limited"
        except openai.APITimeoutError as e:
            logger.error(f"Request timeout for {self.litellm_model}: {e}")
            return False, "Network connection timeout"
        except openai.BadRequestError as e:
            logger.error(f"Bad request for {self.litellm_model}: {e}")
            return False, f"Invalid configuration: {str(e)}"
        except Exception as e:
            error_msg = str(e).lower()
            logger.error(f"Connection test failed for {self.litellm_model}: {e}")
            
            # Check if this is a retryable error
            if hasattr(e, 'status_code'):
                should_retry = litellm._should_retry(e.status_code)
                logger.info(f"Error is retryable: {should_retry}")
            
            # Fallback categorization for unknown errors
            if 'api key' in error_msg or 'unauthorized' in error_msg or 'invalid' in error_msg:
                return False, "Invalid API key or unauthorized access"
            elif 'quota' in error_msg or 'rate limit' in error_msg:
                return False, "API quota exceeded or rate limited"
            elif 'timeout' in error_msg or 'connection' in error_msg:
                return False, "Network connection failed"
            else:
                return False, f"Connection failed: {str(e)}"
    
    async def list_models(self) -> List[str]:
        """List available models for this provider using LiteLLM."""
        try:
            # LiteLLM provides model information, but we'll return common models
            # based on the provider since the dynamic listing can be complex
            provider = self.provider_name.lower()
            
            if provider == "openai":
                return [
                    "gpt-4o",
                    "gpt-4o-mini", 
                    "gpt-4-turbo",
                    "gpt-4",
                    "gpt-3.5-turbo",
                    "o1-preview",
                    "o1-mini"
                ]
            elif provider == "anthropic":
                return [
                    "claude-3-5-sonnet-20241022",
                    "claude-3-5-haiku-20241022", 
                    "claude-3-opus-20240229",
                    "claude-3-sonnet-20240229",
                    "claude-3-haiku-20240307"
                ]
            elif provider == "google":
                return [
                    "gemini-pro",
                    "gemini-pro-vision",
                    "gemini-1.5-pro",
                    "gemini-1.5-flash"
                ]
            elif provider == "groq":
                return [
                    "llama3-70b-8192",
                    "llama3-8b-8192",
                    "mixtral-8x7b-32768",
                    "gemma-7b-it"
                ]
            elif provider == "ollama":
                return [
                    "llama3",
                    "llama3.1",
                    "codellama",
                    "mistral",
                    "phi3"
                ]
            else:
                return []
                
        except Exception as e:
            logger.error(f"Error listing models for {self.provider_name}: {e}")
            return []
    
    def estimate_tokens(self, text: str) -> int:
        """Estimate token count using LiteLLM's token counting."""
        try:
            # Use LiteLLM's token counting if available
            return litellm.token_counter(model=self.litellm_model, text=text)
        except Exception:
            # Fallback to simple estimation
            return super().estimate_tokens(text)