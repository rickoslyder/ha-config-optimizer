"""
OpenAI LLM provider implementation.
"""
import httpx
import json
from typing import AsyncGenerator, Optional
import logging

from .base import BaseLLMProvider, LLMMessage, LLMResponse

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseLLMProvider):
    """OpenAI API provider for GPT models."""
    
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config.get("endpoint", "https://api.openai.com/v1")
        self.model = config.get("model_name", "gpt-3.5-turbo")
    
    async def generate(self, messages: list[LLMMessage]) -> LLMResponse:
        """Generate a single response from OpenAI."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                # Special handling for o4 models
                is_o4_model = "o4" in self.model
                
                payload = {
                    "model": self.model,
                    "messages": [{"role": msg.role, "content": msg.content} for msg in messages],
                }
                
                # Add token limit parameter based on model type
                if is_o4_model:
                    # o4 models need much more tokens due to reasoning overhead
                    payload["max_completion_tokens"] = min(4000, self.context_tokens - 500)
                    # o4 models only support temperature=1 (default)
                else:
                    payload["max_tokens"] = min(1000, self.context_tokens // 4)
                    payload["temperature"] = 0.1
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")
                
                data = response.json()
                logger.debug(f"OpenAI API response: {data}")
                
                choice = data["choices"][0]
                content = choice["message"]["content"]
                
                if not content:
                    logger.warning("OpenAI returned empty content")
                    content = ""
                
                return LLMResponse(
                    content=content,
                    usage=data.get("usage"),
                    model=data.get("model"),
                    finish_reason=choice.get("finish_reason")
                )
                
        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")
            raise
    
    async def stream_generate(self, messages: list[LLMMessage]) -> AsyncGenerator[str, None]:
        """Stream response tokens from OpenAI."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                # Special handling for o4 models
                is_o4_model = "o4" in self.model
                
                payload = {
                    "model": self.model,
                    "messages": [{"role": msg.role, "content": msg.content} for msg in messages],
                    "stream": True
                }
                
                # Add parameters based on model type
                if is_o4_model:
                    # o4 models need much more tokens due to reasoning overhead
                    payload["max_completion_tokens"] = min(4000, self.context_tokens - 500)
                    # o4 models only support temperature=1 (default)
                else:
                    payload["max_tokens"] = min(1000, self.context_tokens // 4)
                    payload["temperature"] = 0.1
                
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=120.0
                ) as response:
                    
                    if response.status_code != 200:
                        raise Exception(f"OpenAI API error: {response.status_code}")
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]  # Remove "data: " prefix
                            
                            if data_str.strip() == "[DONE]":
                                break
                            
                            try:
                                data = json.loads(data_str)
                                choice = data["choices"][0]
                                delta = choice.get("delta", {})
                                
                                if "content" in delta:
                                    yield delta["content"]
                                    
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            yield f"Error: {str(e)}"
    
    async def test_connection(self) -> tuple[bool, Optional[str]]:
        """Test OpenAI API connection."""
        try:
            logger.info(f"Testing OpenAI connection to {self.base_url} with model {self.model}")
            
            # First test basic API connectivity with a simple request
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key[:10]}...",  # Log partial key for debugging
                    "Content-Type": "application/json"
                }
                
                # Test basic connectivity with a minimal request
                test_payload = {
                    "model": self.model,
                    "messages": [{"role": "user", "content": "test"}],
                    "max_tokens": 1
                }
                
                logger.info(f"Sending test request to {self.base_url}/chat/completions")
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=test_payload,
                    timeout=30.0
                )
                
                logger.info(f"OpenAI API response status: {response.status_code}")
                
                if response.status_code == 200:
                    return True, "Connection successful"
                elif response.status_code == 401:
                    return False, "Invalid API key"
                elif response.status_code == 429:
                    return False, "Rate limit exceeded"
                else:
                    error_text = response.text[:200] if response.text else "No error details"
                    return False, f"API error {response.status_code}: {error_text}"
                
        except httpx.ConnectTimeout as e:
            logger.error(f"OpenAI connection timeout: {e}")
            return False, f"Connection timeout: {str(e)}"
        except httpx.ConnectError as e:
            logger.error(f"OpenAI connection error: {e}")
            return False, f"Connection error: {str(e)}"
        except Exception as e:
            logger.error(f"OpenAI test connection failed: {type(e).__name__}: {e}")
            return False, f"Connection failed: {str(e)}"
    
    async def list_models(self) -> list[str]:
        """List available OpenAI models."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                response = await client.get(
                    f"{self.base_url}/models",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    models = []
                    for model in data.get("data", []):
                        model_id = model.get("id")
                        # Filter for chat models and newer models
                        if model_id and ("gpt" in model_id or "o1" in model_id or "o3" in model_id or "o4" in model_id):
                            models.append(model_id)
                    
                    # Sort models with newest first
                    models.sort(reverse=True)
                    return models
                else:
                    # Fallback to known models if API fails
                    return self._get_known_models()
        except Exception:
            return self._get_known_models()
    
    def _get_known_models(self) -> list[str]:
        """Return known OpenAI models as fallback."""
        return [
            "o4-mini",
            "o4-mini-high",
            "o3",
            "o1-preview",
            "o1-mini",
            "gpt-4o",
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo"
        ]