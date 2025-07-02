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


def get_config_path() -> str:
    """Get the appropriate config path based on environment."""
    # Check if running in Home Assistant addon environment
    if os.path.exists("/data/options.json"):
        # With homeassistant_config mapping, HA config is at /homeassistant_config
        if os.path.exists("/homeassistant_config"):
            return "/homeassistant_config"
        # Fallback to old mapping if it exists
        elif os.path.exists("/config"):
            return "/config"
    
    # Development environment - use test-config directory
    dev_config = Path(__file__).parent.parent.parent / "test-config"
    if dev_config.exists():
        return str(dev_config)
    
    # Fallback to current directory
    return "."


class YAMLIngestService:
    """Service for reading and parsing Home Assistant YAML files."""
    
    def __init__(self, config_path: Optional[str] = None):
        if config_path is None:
            config_path = get_config_path()
        
        self.config_path = Path(config_path)
        self.yaml = YAML()
        self.yaml.preserve_quotes = True
        self.yaml.width = 4096
        
        logger.info(f"Initialized YAMLIngestService with config path: {self.config_path}")
        
        # Validate config path exists and is readable
        if not self.config_path.exists():
            logger.warning(f"Config path does not exist: {self.config_path}")
        elif not self.config_path.is_dir():
            logger.warning(f"Config path is not a directory: {self.config_path}")
        else:
            logger.info(f"Config path is valid and accessible: {self.config_path}")
    
    def _validate_file_path(self, file_path: str) -> bool:
        """Validate that a file path is safe and within the config directory."""
        try:
            # Resolve the full path and ensure it's within the config directory
            full_path = (self.config_path / file_path).resolve()
            config_path_resolved = self.config_path.resolve()
            
            # Check if the path is within the config directory
            try:
                full_path.relative_to(config_path_resolved)
            except ValueError:
                logger.warning(f"Path traversal attempt blocked: {file_path}")
                return False
            
            # Only allow certain file extensions for security
            allowed_extensions = {'.yaml', '.yml', '.json', '.txt', '.md'}
            if full_path.suffix.lower() not in allowed_extensions:
                logger.warning(f"File extension not allowed: {file_path}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating file path {file_path}: {e}")
            return False
    
    def get_file_tree(self) -> Dict[str, Any]:
        """Get a tree structure of available files and directories."""
        def build_tree_node(path: Path) -> Dict[str, Any]:
            """Build a tree node for a file or directory."""
            relative_path = str(path.relative_to(self.config_path))
            
            if path.is_file():
                return {
                    "name": path.name,
                    "path": relative_path,
                    "type": "file",
                    "size": path.stat().st_size,
                    "lastModified": path.stat().st_mtime
                }
            else:
                children = []
                try:
                    # Sort directories first, then files
                    items = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
                    for item in items:
                        # Skip hidden files and common excludes
                        if item.name.startswith('.') or item.name in ['__pycache__', '.git']:
                            continue
                        # For files, only include YAML and common config files
                        if item.is_file():
                            if item.suffix.lower() in ['.yaml', '.yml', '.json', '.txt', '.md']:
                                children.append(build_tree_node(item))
                        else:
                            # Include all directories but recursively
                            child_node = build_tree_node(item)
                            if child_node.get("children"):  # Only include dirs with content
                                children.append(child_node)
                except PermissionError:
                    pass  # Skip directories we can't read
                
                return {
                    "name": path.name if path != self.config_path else "Home Assistant Config",
                    "path": relative_path if path != self.config_path else "",
                    "type": "directory",
                    "children": children
                }
        
        try:
            root_node = build_tree_node(self.config_path)
            # Return the children of the root as the top level
            return {"files": root_node.get("children", [])}
        except Exception as e:
            logger.error(f"Error reading file tree: {e}")
            return {"files": []}
    
    def read_yaml_file(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Read and parse a single YAML file."""
        # Validate file path for security
        if not self._validate_file_path(file_path):
            logger.error(f"Invalid or unsafe file path: {file_path}")
            return None
        
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
        # Validate file path for security
        if not self._validate_file_path(file_path):
            logger.error(f"Invalid or unsafe file path: {file_path}")
            return None
        
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
        # Validate file path for security
        if not self._validate_file_path(file_path):
            logger.error(f"Invalid or unsafe file path: {file_path}")
            return False
        
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