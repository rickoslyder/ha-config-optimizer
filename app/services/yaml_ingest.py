"""
YAML parsing and file management service.
"""
import os
import hashlib
from typing import List, Dict, Any, Optional
from pathlib import Path
from ruamel.yaml import YAML
import logging

logger = logging.getLogger(__name__)


class YAMLIngestService:
    """Service for reading and parsing Home Assistant YAML files."""
    
    def __init__(self, config_path: str = "/config"):
        self.config_path = Path(config_path)
        self.yaml = YAML()
        self.yaml.preserve_quotes = True
        self.yaml.width = 4096
    
    def get_file_tree(self) -> Dict[str, Any]:
        """Get a tree structure of available YAML files."""
        tree = {"files": [], "directories": {}}
        
        try:
            for item in self.config_path.rglob("*"):
                if item.is_file() and item.suffix.lower() in ['.yaml', '.yml']:
                    relative_path = str(item.relative_to(self.config_path))
                    tree["files"].append({
                        "path": relative_path,
                        "size": item.stat().st_size,
                        "modified": item.stat().st_mtime
                    })
        except Exception as e:
            logger.error(f"Error reading file tree: {e}")
        
        return tree
    
    def read_yaml_file(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Read and parse a single YAML file."""
        full_path = self.config_path / file_path
        
        try:
            if not full_path.exists():
                logger.warning(f"File not found: {full_path}")
                return None
            
            with open(full_path, 'r', encoding='utf-8') as file:
                content = self.yaml.load(file)
                return content
        except Exception as e:
            logger.error(f"Error reading YAML file {file_path}: {e}")
            return None
    
    def get_file_hash(self, file_path: str) -> Optional[str]:
        """Get SHA-256 hash of a file for change detection."""
        full_path = self.config_path / file_path
        
        try:
            with open(full_path, 'rb') as file:
                content = file.read()
                return hashlib.sha256(content).hexdigest()
        except Exception as e:
            logger.error(f"Error hashing file {file_path}: {e}")
            return None
    
    def read_multiple_files(self, file_paths: List[str]) -> Dict[str, Any]:
        """Read multiple YAML files and return combined data."""
        results = {}
        
        for file_path in file_paths:
            content = self.read_yaml_file(file_path)
            if content is not None:
                results[file_path] = {
                    "content": content,
                    "hash": self.get_file_hash(file_path),
                    "size": (self.config_path / file_path).stat().st_size
                }
        
        return results
    
    def write_yaml_file(self, file_path: str, content: Dict[str, Any]) -> bool:
        """Write content back to a YAML file."""
        full_path = self.config_path / file_path
        
        try:
            # Create backup first
            backup_path = full_path.with_suffix(f"{full_path.suffix}.bak")
            if full_path.exists():
                full_path.rename(backup_path)
            
            # Write new content
            with open(full_path, 'w', encoding='utf-8') as file:
                self.yaml.dump(content, file)
            
            logger.info(f"Successfully wrote YAML file: {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error writing YAML file {file_path}: {e}")
            # Restore backup if write failed
            if backup_path.exists():
                backup_path.rename(full_path)
            return False
    
    def validate_yaml_syntax(self, content: str) -> tuple[bool, Optional[str]]:
        """Validate YAML syntax without writing to file."""
        try:
            self.yaml.load(content)
            return True, None
        except Exception as e:
            return False, str(e)
    
    def filter_files(self, includes: List[str], excludes: List[str]) -> List[str]:
        """Filter files based on include/exclude patterns."""
        import fnmatch
        
        all_files = []
        tree = self.get_file_tree()
        
        for file_info in tree["files"]:
            file_path = file_info["path"]
            
            # Check if file matches any include pattern
            included = any(fnmatch.fnmatch(file_path, pattern) for pattern in includes)
            
            # Check if file matches any exclude pattern
            excluded = any(fnmatch.fnmatch(file_path, pattern) for pattern in excludes)
            
            if included and not excluded:
                all_files.append(file_path)
        
        return all_files