"""
Home Assistant API integration service.
"""
import os
import httpx
from typing import Optional, Dict, Any
from app.config import get_settings

settings = get_settings()


class HomeAssistantAPI:
    """Client for Home Assistant Core API integration."""
    
    def __init__(self):
        self.supervisor_token = os.getenv("SUPERVISOR_TOKEN")
        self.base_url = "http://supervisor/core/api"
        self.headers = {
            "Authorization": f"Bearer {self.supervisor_token}",
            "Content-Type": "application/json"
        } if self.supervisor_token else {}
    
    @property
    def is_available(self) -> bool:
        """Check if Home Assistant API is available."""
        return bool(self.supervisor_token and os.path.exists("/config"))
    
    async def get_config(self) -> Optional[Dict[str, Any]]:
        """Get Home Assistant configuration."""
        if not self.is_available:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/config",
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Failed to get HA config: {e}")
            return None
    
    async def get_states(self) -> Optional[list]:
        """Get all entity states from Home Assistant."""
        if not self.is_available:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/states",
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Failed to get HA states: {e}")
            return None
    
    async def get_services(self) -> Optional[Dict[str, Any]]:
        """Get available services from Home Assistant."""
        if not self.is_available:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/services",
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Failed to get HA services: {e}")
            return None
    
    async def restart_homeassistant(self) -> bool:
        """Restart Home Assistant (use with caution)."""
        if not self.is_available:
            return False
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/services/homeassistant/restart",
                    headers=self.headers,
                    json={},
                    timeout=10.0
                )
                response.raise_for_status()
                return True
        except Exception as e:
            print(f"Failed to restart HA: {e}")
            return False
    
    async def check_config(self) -> Optional[Dict[str, Any]]:
        """Check Home Assistant configuration validity."""
        if not self.is_available:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/services/homeassistant/check_config",
                    headers=self.headers,
                    json={},
                    timeout=30.0  # Config check can take time
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Failed to check HA config: {e}")
            return None


# Global instance
ha_api = HomeAssistantAPI()


async def get_entity_registry() -> Optional[list]:
    """Get entity registry information if available."""
    states = await ha_api.get_states()
    if not states:
        return None
    
    # Extract useful entity information
    entities = []
    for state in states:
        entity_info = {
            "entity_id": state.get("entity_id"),
            "domain": state.get("entity_id", "").split(".")[0] if state.get("entity_id") else None,
            "state": state.get("state"),
            "attributes": state.get("attributes", {}),
            "last_changed": state.get("last_changed"),
            "last_updated": state.get("last_updated"),
        }
        entities.append(entity_info)
    
    return entities


async def get_integration_info() -> Dict[str, Any]:
    """Get information about Home Assistant integration status."""
    info = {
        "api_available": ha_api.is_available,
        "supervisor_token": bool(ha_api.supervisor_token),
        "config_path": "/config" if os.path.exists("/config") else None,
        "data_path": "/data" if os.path.exists("/data") else None,
    }
    
    if ha_api.is_available:
        config = await ha_api.get_config()
        if config:
            info.update({
                "ha_version": config.get("version"),
                "location_name": config.get("location_name"),
                "time_zone": config.get("time_zone"),
                "unit_system": config.get("unit_system"),
            })
    
    return info