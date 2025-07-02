"""
Google Gemini LLM provider implementation.
"""
import httpx
import json
from typing import AsyncGenerator, Optional
import logging

from .base import BaseLLMProvider, LLMMessage, LLMResponse

logger = logging.getLogger(__name__)


class GoogleProvider(BaseLLMProvider):
    """Google API provider for Gemini models."""
    
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config.get("endpoint", "https://generativelanguage.googleapis.com/v1beta")
        self.model = config.get("model_name", "gemini-2.5-flash")
    
    async def generate(self, messages: list[LLMMessage]) -> LLMResponse:
        """Generate a single response from Google Gemini."""
        try:
            async with httpx.AsyncClient() as client:
                # Google uses API key in URL
                url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
                
                headers = {
                    "Content-Type": "application/json"
                }
                
                # Convert messages to Gemini format
                contents = []
                system_instruction = None
                
                for msg in messages:
                    if msg.role == "system":
                        # Gemini uses systemInstruction separately
                        system_instruction = msg.content
                    else:
                        # Gemini uses "user" and "model" roles
                        role = "user" if msg.role == "user" else "model"
                        contents.append({
                            "role": role,
                            "parts": [{"text": msg.content}]
                        })
                
                payload = {
                    "contents": contents,
                    "generationConfig": {
                        "temperature": 0.1,
                        "maxOutputTokens": min(8192, self.context_tokens // 4),
                        "topP": 0.95,
                        "topK": 40
                    }
                }
                
                if system_instruction:
                    payload["systemInstruction"] = {
                        "parts": [{"text": system_instruction}]
                    }
                
                response = await client.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"Google API error: {response.status_code} - {response.text}")
                
                data = response.json()
                logger.debug(f"Google API response: {data}")
                
                # Extract content from the response
                content = ""
                if data.get("candidates"):
                    candidate = data["candidates"][0]
                    if candidate.get("content", {}).get("parts"):
                        for part in candidate["content"]["parts"]:
                            if "text" in part:
                                content += part["text"]
                
                if not content:
                    logger.warning("Google returned empty content")
                    content = ""
                
                # Extract token usage if available
                usage = {}
                if data.get("usageMetadata"):
                    usage = {
                        "prompt_tokens": data["usageMetadata"].get("promptTokenCount", 0),
                        "completion_tokens": data["usageMetadata"].get("candidatesTokenCount", 0),
                        "total_tokens": data["usageMetadata"].get("totalTokenCount", 0)
                    }
                
                return LLMResponse(
                    content=content,
                    usage=usage,
                    model=self.model,
                    finish_reason=data.get("candidates", [{}])[0].get("finishReason")
                )
                
        except Exception as e:
            logger.error(f"Google generation error: {e}")
            raise
    
    async def stream_generate(self, messages: list[LLMMessage]) -> AsyncGenerator[str, None]:
        """Stream response tokens from Google Gemini."""
        try:
            async with httpx.AsyncClient() as client:
                # Google uses API key in URL
                url = f"{self.base_url}/models/{self.model}:streamGenerateContent?key={self.api_key}"
                
                headers = {
                    "Content-Type": "application/json"
                }
                
                # Convert messages to Gemini format
                contents = []
                system_instruction = None
                
                for msg in messages:
                    if msg.role == "system":
                        system_instruction = msg.content
                    else:
                        role = "user" if msg.role == "user" else "model"
                        contents.append({
                            "role": role,
                            "parts": [{"text": msg.content}]
                        })
                
                payload = {
                    "contents": contents,
                    "generationConfig": {
                        "temperature": 0.1,
                        "maxOutputTokens": min(8192, self.context_tokens // 4),
                        "topP": 0.95,
                        "topK": 40
                    }
                }
                
                if system_instruction:
                    payload["systemInstruction"] = {
                        "parts": [{"text": system_instruction}]
                    }
                
                async with client.stream(
                    "POST",
                    url,
                    headers=headers,
                    json=payload,
                    timeout=120.0
                ) as response:
                    
                    if response.status_code != 200:
                        raise Exception(f"Google API error: {response.status_code}")
                    
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                # Google returns JSON lines
                                data = json.loads(line)
                                
                                if data.get("candidates"):
                                    candidate = data["candidates"][0]
                                    if candidate.get("content", {}).get("parts"):
                                        for part in candidate["content"]["parts"]:
                                            if "text" in part:
                                                yield part["text"]
                                
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            logger.error(f"Google streaming error: {e}")
            yield f"Error: {str(e)}"
    
    async def test_connection(self) -> tuple[bool, Optional[str]]:
        """Test Google API connection."""
        try:
            test_messages = [
                LLMMessage(role="user", content="Hello, please respond with 'OK' if you can hear me.")
            ]
            
            response = await self.generate(test_messages)
            
            if response.content:
                return True, "Connection successful"
            else:
                return False, "Empty response from API"
                
        except Exception as e:
            return False, f"Connection failed: {str(e)}"
    
    async def list_models(self) -> list[str]:
        """List available Google Gemini models."""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/models?key={self.api_key}"
                response = await client.get(url, timeout=30.0)
                
                if response.status_code == 200:
                    data = response.json()
                    models = []
                    for model in data.get("models", []):
                        model_name = model.get("name", "").replace("models/", "")
                        if model_name and "gemini" in model_name:
                            models.append(model_name)
                    return models
                else:
                    # Fallback to known models if API fails
                    return self._get_known_models()
        except Exception:
            return self._get_known_models()
    
    def _get_known_models(self) -> list[str]:
        """Return known Gemini models as fallback."""
        return [
            "gemini-2.5-pro",
            "gemini-2.5-flash", 
            "gemini-2.0-flash",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-pro",
            "gemini-pro-vision"
        ]