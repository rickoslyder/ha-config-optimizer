"""
Home Assistant integration API endpoints.
"""
from fastapi import APIRouter
from app.services.ha_integration import ha_api, get_entity_registry, get_integration_info

router = APIRouter()


@router.get("/")
async def get_ha_integration_status():
    """Get Home Assistant integration status."""
    return await get_integration_info()


@router.get("/config")
async def get_ha_config():
    """Get Home Assistant configuration."""
    config = await ha_api.get_config()
    if config is None:
        return {"error": "Home Assistant API not available"}
    return config


@router.get("/entities")
async def get_ha_entities():
    """Get all Home Assistant entities."""
    entities = await get_entity_registry()
    if entities is None:
        return {"error": "Home Assistant API not available"}
    return {"entities": entities, "count": len(entities)}


@router.get("/services")
async def get_ha_services():
    """Get available Home Assistant services."""
    services = await ha_api.get_services()
    if services is None:
        return {"error": "Home Assistant API not available"}
    return services


@router.post("/check-config")
async def check_ha_config():
    """Check Home Assistant configuration validity."""
    result = await ha_api.check_config()
    if result is None:
        return {"error": "Home Assistant API not available"}
    return result


@router.post("/restart")
async def restart_ha():
    """Restart Home Assistant (use with extreme caution)."""
    success = await ha_api.restart_homeassistant()
    return {"success": success}