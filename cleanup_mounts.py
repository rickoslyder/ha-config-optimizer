#!/usr/bin/env python3
"""
Quick cleanup script for stale Samba mount points.
Run this if the deploy script is having mount issues.
"""

import glob
import os
import shutil
import subprocess

def cleanup_all_mounts():
    """Clean up all possible stale mount points."""
    print("🧹 Cleaning up stale mount points...")
    
    # Find all ha_addon_deploy_* directories
    patterns = [
        "/tmp/ha_addon_deploy_*",
        "/private/var/folders/*/ha_addon_deploy_*",
        "/private/var/folders/*/*/ha_addon_deploy_*",
        "/private/var/folders/*/*/*/ha_addon_deploy_*",
    ]
    
    cleaned = 0
    
    for pattern in patterns:
        try:
            dirs = glob.glob(pattern)
            for mount_dir in dirs:
                if os.path.isdir(mount_dir):
                    try:
                        print(f"  Found: {mount_dir}")
                        # Try to unmount first
                        result = subprocess.run(
                            ["umount", mount_dir], 
                            capture_output=True, 
                            text=True
                        )
                        if result.returncode == 0:
                            print(f"  ✅ Unmounted: {mount_dir}")
                        
                        # Remove the directory
                        shutil.rmtree(mount_dir)
                        print(f"  🗑️  Removed: {mount_dir}")
                        cleaned += 1
                        
                    except Exception as e:
                        print(f"  ⚠️  Could not clean {mount_dir}: {e}")
        except Exception:
            pass
    
    if cleaned > 0:
        print(f"✅ Cleaned up {cleaned} mount points")
    else:
        print("ℹ️  No stale mount points found")

if __name__ == "__main__":
    cleanup_all_mounts()