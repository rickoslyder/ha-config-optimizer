#!/usr/bin/env python3
"""
Simple test script to verify the scan engine works.
"""
import asyncio
import os
import tempfile
import yaml
from pathlib import Path

# Add the app directory to Python path
import sys
sys.path.insert(0, str(Path(__file__).parent))

from app.models.init_db import create_tables, init_default_data
from app.services.scan_service import ScanService
from app.services.yaml_ingest import YAMLIngestService
from app.models.database import SessionLocal
from app.models.schemas import LLMProfile


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
            
            # Check if we have an LLM profile
            llm_profile = db.query(LLMProfile).first()
            if not llm_profile:
                print("No LLM profile found. Creating a test profile...")
                # Note: This won't work without a real API key
                test_profile = LLMProfile(
                    name="Test OpenAI",
                    provider="openai",
                    endpoint="https://api.openai.com/v1",
                    api_key="test-key-please-set-real-key",
                    context_tokens=4000,
                    role="optimize",
                    model_name="gpt-3.5-turbo",
                    is_active=1
                )
                db.add(test_profile)
                db.commit()
                db.refresh(test_profile)
                llm_profile = test_profile
            
            print(f"Using LLM profile: {llm_profile.name}")
            
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