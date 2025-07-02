#!/usr/bin/env python3
"""
Simple test script to verify the scan engine works.
"""
import asyncio
import os
import tempfile
import yaml
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

# Add the app directory to Python path
import sys
sys.path.insert(0, str(Path(__file__).parent))

from app.models.init_db import create_tables, init_default_data
from app.services.scan_service import ScanService
from app.services.yaml_ingest import YAMLIngestService
from app.services.llm_factory import LLMProviderFactory
from app.models.database import SessionLocal
from app.models.schemas import LLMProfile
from app.config import get_settings


def create_test_yaml_files(test_dir: Path):
    """Create some test YAML files for analysis."""
    
    # Create a sample configuration.yaml
    config_yaml = {
        "homeassistant": {
            "name": "Test Home",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "unit_system": "metric",
            "time_zone": "America/New_York"
        },
        "automation": "!include automations.yaml",
        "script": "!include scripts.yaml",
        "sensor": [
            {
                "platform": "template",
                "sensors": {
                    "test_sensor": {
                        "friendly_name": "Test Sensor",
                        "value_template": "{{ states('sensor.temperature') | float * 1.8 + 32 }}"
                    }
                }
            }
        ]
    }
    
    # Create automations.yaml with some inefficient patterns
    automations_yaml = [
        {
            "id": "test_automation_1",
            "alias": "Turn on lights",
            "trigger": {
                "platform": "state",
                "entity_id": "binary_sensor.motion_sensor",
                "to": "on"
            },
            "action": [
                {"service": "light.turn_on", "entity_id": "light.living_room"},
                {"delay": "00:00:01"},
                {"service": "light.turn_on", "entity_id": "light.kitchen"},
                {"delay": "00:00:01"},
                {"service": "light.turn_on", "entity_id": "light.bedroom"}
            ]
        },
        {
            "id": "test_automation_2", 
            "alias": "Duplicate motion detection",
            "trigger": {
                "platform": "state",
                "entity_id": "binary_sensor.motion_sensor",
                "to": "on"
            },
            "action": {
                "service": "notify.mobile_app",
                "data": {"message": "Motion detected"}
            }
        }
    ]
    
    # Write files
    with open(test_dir / "configuration.yaml", "w") as f:
        yaml.dump(config_yaml, f, default_flow_style=False)
    
    with open(test_dir / "automations.yaml", "w") as f:
        yaml.dump(automations_yaml, f, default_flow_style=False)
    
    print(f"Created test YAML files in {test_dir}")


async def test_scan_engine():
    """Test the complete scan engine workflow."""
    
    settings = get_settings()
    
    # Check if we have any API keys configured
    available_providers = settings.get_available_providers()
    if not available_providers:
        print("❌ No LLM providers configured!")
        print("Please set up at least one API key in your .env file:")
        print("- OPENAI_API_KEY=sk-your-key-here")
        print("- ANTHROPIC_API_KEY=your-key-here")  
        print("- GROQ_API_KEY=your-key-here")
        print("- Or configure Ollama locally")
        return
    
    print(f"✅ Found configured providers: {', '.join(available_providers)}")
    
    # Create temporary directory for test files
    with tempfile.TemporaryDirectory() as temp_dir:
        test_dir = Path(temp_dir)
        create_test_yaml_files(test_dir)
        
        # Initialize database
        print("Initializing database...")
        create_tables()
        init_default_data()
        
        # Set up test environment to use our temp directory
        original_config_path = os.environ.get("CONFIG_PATH", "/config")
        os.environ["CONFIG_PATH"] = str(test_dir)
        
        try:
            db = SessionLocal()
            
            # Use the first available provider
            provider_name = available_providers[0]
            print(f"Using provider: {provider_name}")
            
            # Create or update LLM profile with environment config
            llm_profile = db.query(LLMProfile).filter(LLMProfile.provider == provider_name).first()
            env_config = settings.get_llm_config(provider_name)
            
            if not llm_profile:
                print(f"Creating LLM profile for {provider_name}...")
                llm_profile = LLMProfile(
                    name=f"Environment {provider_name.title()}",
                    provider=provider_name,
                    endpoint=env_config["endpoint"],
                    api_key=env_config["api_key"],
                    context_tokens=env_config["context_tokens"],
                    role="optimize",
                    model_name=env_config["model_name"],
                    is_active=1
                )
                db.add(llm_profile)
                db.commit()
                db.refresh(llm_profile)
            else:
                # Update existing profile with current environment values
                print(f"Updating LLM profile for {provider_name}...")
                llm_profile.api_key = env_config["api_key"]
                llm_profile.endpoint = env_config["endpoint"]
                llm_profile.model_name = env_config["model_name"]
                llm_profile.context_tokens = env_config["context_tokens"]
                db.commit()
            
            print(f"Using LLM profile: {llm_profile.name} ({llm_profile.model_name})")
            
            # Create and execute a scan
            scan_service = ScanService()
            
            print("Creating scan...")
            scan = scan_service.create_scan(db, llm_profile_id=llm_profile.id)
            print(f"Created scan {scan.id}")
            
            # Override YAML service to use test directory
            original_yaml_service = scan_service.yaml_service
            scan_service.yaml_service = YAMLIngestService(str(test_dir))
            
            print("Starting scan execution...")
            
            # Note: This will fail without a real API key, but will test the workflow
            success = await scan_service.execute_scan(scan.id)
            
            if success:
                print("✅ Scan completed successfully!")
                
                # Check results
                db.refresh(scan)
                print(f"Scan status: {scan.status}")
                print(f"File count: {scan.file_count}")
                print(f"Suggestions: {len(scan.suggestions)}")
                
                for suggestion in scan.suggestions:
                    print(f"  - {suggestion.title} ({suggestion.impact} impact)")
                    
            else:
                print("❌ Scan failed (expected if no valid API key)")
                db.refresh(scan)
                print(f"Scan status: {scan.status}")
            
            db.close()
            
        finally:
            # Restore original config path
            if original_config_path:
                os.environ["CONFIG_PATH"] = original_config_path
            else:
                os.environ.pop("CONFIG_PATH", None)


if __name__ == "__main__":
    print("🚀 Testing HA Config Optimizer Scan Engine")
    print("=" * 50)
    
    asyncio.run(test_scan_engine())
    
    print("\n✨ Test completed!")
    print("\nTo test with a real API key:")
    print("1. Set OPENAI_API_KEY environment variable")
    print("2. Update the LLM profile in the database with your API key")
    print("3. Run this test again")