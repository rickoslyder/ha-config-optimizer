"""
Ollama LLM provider implementation for local models.
"""
import httpx
import json
from typing import AsyncGenerator, Optional
import logging

from .base import BaseLLMProvider, LLMMessage, LLMResponse

logger = logging.getLogger(__name__)


class OllamaProvider(BaseLLMProvider):
    """Ollama provider for local LLM models."""
    
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config.get("endpoint", "http://localhost:11434")
        self.model = config.get("model_name", "llama3.3:70b")
        # Ollama doesn't require API keys for local models
        self.api_key = config.get("api_key", "")
    
    async def generate(self, messages: list[LLMMessage]) -> LLMResponse:
        """Generate a single response from Ollama."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Content-Type": "application/json"
                }
                
                # Convert messages to Ollama format
                # Ollama expects a single prompt or messages array
                if len(messages) == 1:
                    # Single message - use completion endpoint
                    prompt = messages[0].content
                    payload = {
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.1,
                            "num_predict": min(4096, self.context_tokens // 4)
                        }
                    }
                    endpoint = "/api/generate"
                else:
                    # Multiple messages - use chat endpoint
                    ollama_messages = []
                    for msg in messages:
                        ollama_messages.append({
                            "role": msg.role,
                            "content": msg.content
                        })
                    
                    payload = {
                        "model": self.model,
                        "messages": ollama_messages,
                        "stream": False,
                        "options": {
                            "temperature": 0.1,
                            "num_predict": min(4096, self.context_tokens // 4)
                        }
                    }
                    endpoint = "/api/chat"
                
                response = await client.post(
                    f"{self.base_url}{endpoint}",
                    headers=headers,
                    json=payload,
                    timeout=300.0  # Ollama can be slow for large models
                )
                
                if response.status_code != 200:
                    raise Exception(f"Ollama API error: {response.status_code} - {response.text}")
                
                data = response.json()
                logger.debug(f"Ollama API response: {data}")
                
                # Extract content based on endpoint
                if endpoint == "/api/generate":
                    content = data.get("response", "")
                else:
                    content = data.get("message", {}).get("content", "")
                
                if not content:
                    logger.warning("Ollama returned empty content")
                    content = ""
                
                # Ollama provides different usage stats
                usage = {}
                if data.get("eval_count") and data.get("prompt_eval_count"):
                    usage = {
                        "prompt_tokens": data["prompt_eval_count"],
                        "completion_tokens": data["eval_count"],
                        "total_tokens": data["prompt_eval_count"] + data["eval_count"]
                    }
                
                return LLMResponse(
                    content=content,
                    usage=usage,
                    model=data.get("model", self.model),
                    finish_reason="stop" if data.get("done") else "length"
                )
                
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")
            raise
    
    async def stream_generate(self, messages: list[LLMMessage]) -> AsyncGenerator[str, None]:
        """Stream response tokens from Ollama."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Content-Type": "application/json"
                }
                
                # Convert messages to Ollama format
                if len(messages) == 1:
                    # Single message - use completion endpoint
                    prompt = messages[0].content
                    payload = {
                        "model": self.model,
                        "prompt": prompt,
                        "stream": True,
                        "options": {
                            "temperature": 0.1,
                            "num_predict": min(4096, self.context_tokens // 4)
                        }
                    }
                    endpoint = "/api/generate"
                else:
                    # Multiple messages - use chat endpoint
                    ollama_messages = []
                    for msg in messages:
                        ollama_messages.append({
                            "role": msg.role,
                            "content": msg.content
                        })
                    
                    payload = {
                        "model": self.model,
                        "messages": ollama_messages,
                        "stream": True,
                        "options": {
                            "temperature": 0.1,
                            "num_predict": min(4096, self.context_tokens // 4)
                        }
                    }
                    endpoint = "/api/chat"
                
                async with client.stream(
                    "POST",
                    f"{self.base_url}{endpoint}",
                    headers=headers,
                    json=payload,
                    timeout=300.0
                ) as response:
                    
                    if response.status_code != 200:
                        raise Exception(f"Ollama API error: {response.status_code}")
                    
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                
                                # Extract content based on endpoint
                                if endpoint == "/api/generate":
                                    content = data.get("response", "")
                                else:
                                    content = data.get("message", {}).get("content", "")
                                
                                if content:
                                    yield content
                                
                                # Check if generation is complete
                                if data.get("done", False):
                                    break
                                    
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            logger.error(f"Ollama streaming error: {e}")
            yield f"Error: {str(e)}"
    
    async def test_connection(self) -> tuple[bool, Optional[str]]:
        """Test Ollama API connection."""
        try:
            # First check if Ollama is running
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/tags",
                    timeout=10.0
                )
                
                if response.status_code != 200:
                    return False, "Ollama service not running"
                
                # Check if the model exists
                data = response.json()
                models = [m["name"] for m in data.get("models", [])]
                
                if self.model not in models:
                    # Try to pull the model
                    return False, f"Model {self.model} not found. Available models: {', '.join(models)}"
            
            # Test generation
            test_messages = [
                LLMMessage(role="user", content="Hello, please respond with 'OK' if you can hear me.")
            ]
            
            response = await self.generate(test_messages)
            
            if response.content:
                return True, "Connection successful"
            else:
                return False, "Empty response from API"
                
        except httpx.ConnectError:
            return False, "Cannot connect to Ollama. Make sure it's running on the specified endpoint."
        except Exception as e:
            return False, f"Connection failed: {str(e)}"
    
    async def list_models(self) -> list[str]:
        """List available Ollama models."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/tags",
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    models = []
                    for model in data.get("models", []):
                        model_name = model.get("name")
                        if model_name:
                            models.append(model_name)
                    return models
                else:
                    # Fallback to known models if API fails
                    return self._get_known_models()
        except Exception:
            return self._get_known_models()
    
    def _get_known_models(self) -> list[str]:
        """Return commonly used Ollama models as fallback."""
        return [
            "llama3.3:70b",
            "llama3.1:70b",
            "llama3.1:8b",
            "llama2:70b",
            "mistral:latest",
            "mixtral:latest",
            "codellama:latest",
            "qwen2.5-coder:32b",
            "deepseek-coder:33b",
            "phi3:medium",
            "gemma2:27b",
            "command-r-plus:latest"
        ]