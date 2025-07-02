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
    logger.info("=== PATH DETECTION DEBUG START ===")
    
    # Check if running in Home Assistant addon environment
    addon_env = os.path.exists("/data/options.json")
    logger.info(f"Addon environment detected: {addon_env} (/data/options.json exists: {addon_env})")
    
    if addon_env:
        # List all possible paths based on research and actual debug results
        possible_paths = [
            "/homeassistant",  # CONFIRMED: This is where the files actually are!
            "/config",  # Empty in user's case but still check
            "/homeassistant/config",  # Suggested by user in forum
            "/homeassistant_config",  # Based on HA docs pattern
        ]
        
        logger.info("Checking possible mount paths for homeassistant_config:")
        for path in possible_paths:
            exists = os.path.exists(path)
            is_dir = os.path.isdir(path) if exists else False
            
            if exists and is_dir:
                try:
                    # Try to list contents
                    contents = os.listdir(path)
                    file_count = len([f for f in contents if not f.startswith('.')])
                    logger.info(f"  {path}: EXISTS, IS_DIR, {len(contents)} total items, {file_count} visible files")
                    logger.info(f"    First 5 items: {contents[:5]}")
                    
                    # Return first path that exists and has content
                    if file_count > 0:
                        logger.info(f"Selected path: {path} (first non-empty directory)")
                        logger.info("=== PATH DETECTION DEBUG END ===")
                        return path
                        
                except PermissionError as e:
                    logger.warning(f"  {path}: EXISTS, IS_DIR, but PERMISSION_DENIED: {e}")
                except Exception as e:
                    logger.error(f"  {path}: EXISTS, IS_DIR, but ERROR listing contents: {e}")
            else:
                logger.info(f"  {path}: exists={exists}, is_dir={is_dir}")
        
        # If we get here, try any existing directory even if empty
        for path in possible_paths:
            if os.path.exists(path) and os.path.isdir(path):
                logger.warning(f"Using empty directory as fallback: {path}")
                logger.info("=== PATH DETECTION DEBUG END ===")
                return path
                
        logger.error("No valid paths found in addon environment!")
    
    # Development environment - use test-config directory
    dev_config = Path(__file__).parent.parent.parent / "test-config"
    logger.info(f"Development config path: {dev_config}, exists: {dev_config.exists()}")
    if dev_config.exists():
        logger.info(f"Selected development path: {dev_config}")
        logger.info("=== PATH DETECTION DEBUG END ===")
        return str(dev_config)
    
    # Fallback to current directory
    logger.warning("Using fallback path: '.'")
    logger.info("=== PATH DETECTION DEBUG END ===")
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
        logger.info("=== FILE TREE DEBUG START ===")
        logger.info(f"Config path: {self.config_path}")
        logger.info(f"Config path exists: {self.config_path.exists()}")
        logger.info(f"Config path is dir: {self.config_path.is_dir()}")
        
        if self.config_path.exists():
            try:
                all_items = list(self.config_path.iterdir())
                logger.info(f"Total items in config directory: {len(all_items)}")
                for item in all_items:
                    logger.info(f"  {item.name} ({'DIR' if item.is_dir() else 'FILE'})")
            except Exception as e:
                logger.error(f"Error listing config directory: {e}")
        
        def build_tree_node(path: Path) -> Dict[str, Any]:
            """Build a tree node for a file or directory."""
            logger.info(f"[build_tree_node] Processing: {path}")
            logger.info(f"[build_tree_node] Is file: {path.is_file()}, Is dir: {path.is_dir()}")
            
            try:
                if path == self.config_path:
                    relative_path = ""
                else:
                    relative_path = str(path.relative_to(self.config_path))
                logger.info(f"[build_tree_node] Relative path: '{relative_path}'")
            except Exception as e:
                logger.error(f"[build_tree_node] Error calculating relative path for {path}: {e}")
                # For files in the root directory, use just the filename
                relative_path = str(path.name)
            
            if path.is_file():
                try:
                    file_stat = path.stat()
                    logger.info(f"[build_tree_node] File {path.name}: size={file_stat.st_size}, extension={path.suffix.lower()}")
                    return {
                        "name": path.name,
                        "path": relative_path,
                        "type": "file",
                        "size": file_stat.st_size,
                        "lastModified": file_stat.st_mtime
                    }
                except Exception as e:
                    logger.error(f"[build_tree_node] Error accessing file {path}: {e}")
                    return None
            else:
                children = []
                logger.info(f"[build_tree_node] Processing directory: {path}")
                try:
                    # Sort directories first, then files
                    items = list(path.iterdir())
                    logger.info(f"[build_tree_node] Found {len(items)} items in directory: {[i.name for i in items]}")
                    items = sorted(items, key=lambda x: (x.is_file(), x.name.lower()))
                    
                    for item in items:
                        logger.info(f"[build_tree_node] Processing item: {item.name}")
                        
                        # Skip hidden files and common excludes
                        if item.name.startswith('.') or item.name in ['__pycache__', '.git']:
                            logger.info(f"[build_tree_node] Skipping hidden/excluded: {item.name}")
                            continue
                        
                        # Handle files and directories separately
                        if item.is_file():
                            logger.info(f"[build_tree_node] Item is file: {item.name}, extension: {item.suffix.lower()}")
                            # For files, only include YAML and common config files
                            if item.suffix.lower() in ['.yaml', '.yml', '.json', '.txt', '.md']:
                                logger.info(f"[build_tree_node] Including file: {item.name} (size: {item.stat().st_size})")
                                file_node = build_tree_node(item)
                                if file_node is not None:
                                    children.append(file_node)
                                    logger.info(f"[build_tree_node] File node added successfully: {item.name}")
                                else:
                                    logger.error(f"[build_tree_node] File node creation failed: {item.name}")
                            else:
                                logger.info(f"[build_tree_node] Skipping file (wrong extension): {item.name}")
                        else:
                            # For directories, process recursively and include if they have any content
                            logger.info(f"[build_tree_node] Processing subdirectory: {item.name}")
                            child_node = build_tree_node(item)
                            if child_node and child_node.get("children"):
                                logger.info(f"[build_tree_node] Including directory: {item.name} (has {len(child_node.get('children', []))} children)")
                                children.append(child_node)
                            else:
                                logger.info(f"[build_tree_node] Skipping empty directory: {item.name}")
                                
                    logger.info(f"[build_tree_node] Directory {path.name} processed: {len(children)} children added")
                    
                except PermissionError as e:
                    logger.error(f"[build_tree_node] Permission denied reading directory {path}: {e}")
                except Exception as e:
                    logger.error(f"[build_tree_node] Error processing directory {path}: {e}")
                
                return {
                    "name": path.name if path != self.config_path else "Home Assistant Config",
                    "path": relative_path if path != self.config_path else "",
                    "type": "directory",
                    "children": children
                }
        
        try:
            logger.info("[get_file_tree] Calling build_tree_node for root path")
            root_node = build_tree_node(self.config_path)
            logger.info(f"[get_file_tree] Root node built: {root_node.get('name', 'UNKNOWN')}")
            logger.info(f"[get_file_tree] Root node type: {root_node.get('type', 'UNKNOWN')}")
            logger.info(f"[get_file_tree] Root node children count: {len(root_node.get('children', []))}")
            
            if root_node.get('children'):
                logger.info("[get_file_tree] Root node children details:")
                for i, child in enumerate(root_node.get('children', [])):
                    logger.info(f"  Child {i+1}: {child.get('name', 'UNKNOWN')} ({child.get('type', 'UNKNOWN')})")
            else:
                logger.warning("[get_file_tree] Root node has no children!")
            
            # Return the children of the root as the top level
            result = {"files": root_node.get("children", [])}
            logger.info(f"[get_file_tree] Final result: {len(result['files'])} top-level items")
            
            # Log details of returned files
            for i, file_item in enumerate(result['files'][:10]):  # First 10 files
                logger.info(f"  Result {i+1}: {file_item.get('name', 'UNKNOWN')} ({file_item.get('type', 'UNKNOWN')}) path='{file_item.get('path', 'UNKNOWN')}'")
            
            logger.info("=== FILE TREE DEBUG END ===")
            return result
        except Exception as e:
            logger.error(f"[get_file_tree] Error reading file tree: {e}")
            import traceback
            logger.error(f"[get_file_tree] Traceback: {traceback.format_exc()}")
            logger.info("=== FILE TREE DEBUG END ===")
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