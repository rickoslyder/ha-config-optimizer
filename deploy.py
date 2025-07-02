#!/usr/bin/env python3
"""
Automated deployment script for Home Assistant LLM Config Optimizer addon.

This script synchronizes the local development files to your Home Assistant
addons directory via Samba, allowing for easy local testing without manual
file copying.

Usage:
    python3 deploy.py                    # Deploy once
    python3 deploy.py --watch           # Deploy and watch for changes
    python3 deploy.py --config-only     # Only sync configuration files
    python3 deploy.py --clean           # Clean remote addon directory first
"""

import argparse
import asyncio
import json
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Optional
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler


class SambaDeploymentError(Exception):
    """Custom exception for deployment errors."""
    pass


class Config:
    """Deployment configuration."""
    
    def __init__(self):
        # Samba configuration
        self.samba_host = "samba.richardbankole.com"
        self.samba_share = "addons"  # Assuming addons is the share name
        self.samba_user = None  # Will prompt if not provided
        self.samba_password = None  # Will prompt if not provided
        
        # Local paths
        self.project_root = Path(__file__).parent
        self.addon_name = "llm-config-optimizer"
        
        # Remote paths
        self.remote_addon_path = f"//{self.samba_host}/{self.samba_share}/{self.addon_name}"
        
        # Files to include in deployment
        self.include_patterns = [
            "config.yaml",
            "build.yaml",
            "repository.yaml",
            "Dockerfile",
            "DOCS.md",
            "CHANGELOG.md",
            "README.md",
            "requirements.txt",
            "app/**/*.py",
            "ui/src/**/*",
            "ui/package.json",
            "ui/tsconfig.json",
            "ui/vite.config.js",
            "ui/index.html",
            "rootfs/**/*",
        ]
        
        # Files/directories to exclude
        self.exclude_patterns = [
            "__pycache__",
            "*.pyc",
            ".git",
            ".gitignore",
            "node_modules",
            "venv",
            ".env",
            "data",
            "ui/build",
            "tests",
            "*.md",  # Exclude other markdown files except the ones we explicitly include
            "project_request.md",
            "technical_spec.md",
            "BRAND_GUIDELINES.md",
            "todo.md",
            "CLAUDE.md",
            "PRD.md",
            "USER_FLOWS.md",
            "example_ha_addon.md",
            "test_scan.py",
            "deploy.py",  # Don't deploy this script itself
        ]
    
    def load_from_file(self, config_file: str = "deploy_config.json") -> None:
        """Load configuration from JSON file."""
        config_path = self.project_root / config_file
        if config_path.exists():
            with open(config_path, 'r') as f:
                data = json.load(f)
                for key, value in data.items():
                    if hasattr(self, key):
                        setattr(self, key, value)
    
    def save_to_file(self, config_file: str = "deploy_config.json") -> None:
        """Save configuration to JSON file."""
        config_path = self.project_root / config_file
        data = {
            "samba_host": self.samba_host,
            "samba_share": self.samba_share,
            "samba_user": self.samba_user,
            # Note: We don't save password for security
        }
        with open(config_path, 'w') as f:
            json.dump(data, f, indent=2)


class SambaClient:
    """Samba client for file operations."""
    
    def __init__(self, config: Config):
        self.config = config
        self.mount_point: Optional[Path] = None
        self.is_mounted = False
    
    async def mount(self) -> None:
        """Mount the Samba share."""
        if self.is_mounted:
            return
        
        # Get credentials if not provided
        if not self.config.samba_user:
            self.config.samba_user = input(f"Samba username for {self.config.samba_host}: ")
        
        if not self.config.samba_password:
            import getpass
            self.config.samba_password = getpass.getpass("Samba password: ")
        
        # Create temporary mount point
        self.mount_point = Path(tempfile.mkdtemp(prefix="ha_addon_deploy_"))
        
        try:
            # Mount command for macOS
            mount_cmd = [
                "mount",
                "-t", "smbfs",
                f"//{self.config.samba_user}:{self.config.samba_password}@{self.config.samba_host}/{self.config.samba_share}",
                str(self.mount_point)
            ]
            
            print(f"🔗 Mounting Samba share: //{self.config.samba_host}/{self.config.samba_share}")
            result = subprocess.run(mount_cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise SambaDeploymentError(f"Failed to mount Samba share: {result.stderr}")
            
            self.is_mounted = True
            print(f"✅ Successfully mounted at {self.mount_point}")
            
        except Exception as e:
            if self.mount_point and self.mount_point.exists():
                shutil.rmtree(self.mount_point)
            raise SambaDeploymentError(f"Mount failed: {e}")
    
    async def unmount(self) -> None:
        """Unmount the Samba share."""
        if not self.is_mounted or not self.mount_point:
            return
        
        try:
            subprocess.run(["umount", str(self.mount_point)], check=True)
            shutil.rmtree(self.mount_point)
            self.is_mounted = False
            print(f"🔌 Unmounted Samba share")
        except Exception as e:
            print(f"⚠️  Warning: Failed to unmount: {e}")
    
    def get_addon_path(self) -> Path:
        """Get the path to the addon directory on the mounted share."""
        if not self.is_mounted or not self.mount_point:
            raise SambaDeploymentError("Samba share not mounted")
        
        return self.mount_point / self.config.addon_name


class AddonDeployer:
    """Main deployment class."""
    
    def __init__(self, config: Config):
        self.config = config
        self.samba = SambaClient(config)
    
    def should_include_file(self, file_path: Path) -> bool:
        """Check if a file should be included in deployment."""
        relative_path = file_path.relative_to(self.config.project_root)
        
        # Check exclude patterns first
        for pattern in self.config.exclude_patterns:
            if self._match_pattern(str(relative_path), pattern):
                return False
        
        # Then check include patterns
        for pattern in self.config.include_patterns:
            if self._match_pattern(str(relative_path), pattern):
                return True
        
        return False
    
    def _match_pattern(self, path: str, pattern: str) -> bool:
        """Match a file path against a pattern."""
        import fnmatch
        
        # Handle glob patterns
        if "**" in pattern:
            # Convert glob to regex-like matching
            parts = pattern.split("**")
            if len(parts) == 2:
                prefix, suffix = parts
                return (path.startswith(prefix.rstrip("/")) and 
                       path.endswith(suffix.lstrip("/")))
        
        # Standard fnmatch
        return fnmatch.fnmatch(path, pattern) or fnmatch.fnmatch(os.path.basename(path), pattern)
    
    def collect_files(self) -> List[Path]:
        """Collect all files to be deployed."""
        files = []
        
        for root, dirs, filenames in os.walk(self.config.project_root):
            root_path = Path(root)
            
            # Skip excluded directories
            dirs[:] = [d for d in dirs if not any(
                self._match_pattern(d, pattern) for pattern in self.config.exclude_patterns
            )]
            
            for filename in filenames:
                file_path = root_path / filename
                if self.should_include_file(file_path):
                    files.append(file_path)
        
        return sorted(files)
    
    async def deploy(self, clean: bool = False, config_only: bool = False) -> None:
        """Deploy the addon to Home Assistant."""
        print(f"🚀 Starting deployment of {self.config.addon_name}")
        
        try:
            # Mount Samba share
            await self.samba.mount()
            
            # Get addon directory
            addon_path = self.samba.get_addon_path()
            
            # Clean if requested
            if clean and addon_path.exists():
                print(f"🧹 Cleaning remote addon directory...")
                shutil.rmtree(addon_path)
            
            # Create addon directory
            addon_path.mkdir(parents=True, exist_ok=True)
            
            # Collect files to deploy
            files = self.collect_files()
            
            if config_only:
                # Only deploy configuration files
                files = [f for f in files if f.name in ["config.yaml", "build.yaml", "DOCS.md", "CHANGELOG.md"]]
            
            print(f"📦 Deploying {len(files)} files...")
            
            # Copy files
            for file_path in files:
                relative_path = file_path.relative_to(self.config.project_root)
                dest_path = addon_path / relative_path
                
                # Create parent directories
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Copy file
                shutil.copy2(file_path, dest_path)
                print(f"  📄 {relative_path}")
            
            # Build frontend if needed (and not config-only)
            if not config_only and (self.config.project_root / "ui").exists():
                await self._build_frontend(addon_path)
            
            print(f"✅ Deployment complete! Addon available at: {addon_path}")
            print(f"🔄 You can now restart the addon in Home Assistant to load changes.")
            
        except Exception as e:
            print(f"❌ Deployment failed: {e}")
            raise
        finally:
            await self.samba.unmount()
    
    async def _build_frontend(self, addon_path: Path) -> None:
        """Build the frontend if ui directory is included."""
        ui_source = self.config.project_root / "ui"
        ui_dest = addon_path / "ui"
        
        if ui_dest.exists() and (ui_dest / "package.json").exists():
            print("🔨 Building frontend...")
            
            # Run npm install and build in the deployed ui directory
            try:
                subprocess.run(["npm", "install"], cwd=ui_dest, check=True, capture_output=True)
                subprocess.run(["npm", "run", "build"], cwd=ui_dest, check=True, capture_output=True)
                print("✅ Frontend build complete")
            except subprocess.CalledProcessError as e:
                print(f"⚠️  Frontend build failed: {e}")


class FileWatcher(FileSystemEventHandler):
    """File system event handler for watching changes."""
    
    def __init__(self, deployer: AddonDeployer, debounce_seconds: float = 2.0):
        self.deployer = deployer
        self.debounce_seconds = debounce_seconds
        self.last_event_time = 0
        self.pending_deployment = False
    
    def on_any_event(self, event):
        """Handle any file system event."""
        if event.is_directory:
            return
        
        current_time = time.time()
        
        # Only trigger on files we care about
        file_path = Path(event.src_path)
        if not self.deployer.should_include_file(file_path):
            return
        
        print(f"📝 File changed: {file_path.relative_to(self.deployer.config.project_root)}")
        
        # Debounce rapid changes
        self.last_event_time = current_time
        
        if not self.pending_deployment:
            self.pending_deployment = True
            # Schedule deployment after debounce period
            asyncio.create_task(self._debounced_deploy())
    
    async def _debounced_deploy(self):
        """Deploy after debounce period if no new events."""
        await asyncio.sleep(self.debounce_seconds)
        
        # Check if this is still the latest event
        if time.time() - self.last_event_time >= self.debounce_seconds:
            self.pending_deployment = False
            try:
                await self.deployer.deploy()
            except Exception as e:
                print(f"❌ Auto-deployment failed: {e}")


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Deploy HA Config Optimizer addon via Samba")
    parser.add_argument("--watch", action="store_true", help="Watch for file changes and auto-deploy")
    parser.add_argument("--config-only", action="store_true", help="Only deploy configuration files")
    parser.add_argument("--clean", action="store_true", help="Clean remote addon directory first")
    parser.add_argument("--config-file", default="deploy_config.json", help="Configuration file path")
    
    args = parser.parse_args()
    
    # Load configuration
    config = Config()
    config.load_from_file(args.config_file)
    
    # Create deployer
    deployer = AddonDeployer(config)
    
    try:
        # Initial deployment
        await deployer.deploy(clean=args.clean, config_only=args.config_only)
        
        # Save configuration for future use
        config.save_to_file(args.config_file)
        
        # Watch mode
        if args.watch:
            print(f"👀 Watching for changes... (Press Ctrl+C to stop)")
            
            observer = Observer()
            event_handler = FileWatcher(deployer)
            observer.schedule(event_handler, str(config.project_root), recursive=True)
            observer.start()
            
            try:
                while True:
                    await asyncio.sleep(1)
            except KeyboardInterrupt:
                print(f"\n🛑 Stopping file watcher...")
                observer.stop()
                observer.join()
        
    except KeyboardInterrupt:
        print(f"\n🛑 Deployment cancelled by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(asyncio.run(main()))