"""
Core suggestion engine that orchestrates LLM analysis of YAML configurations.
"""
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import logging

from app.llm_providers.base import BaseLLMProvider, LLMMessage
from app.models.schemas import Suggestion, SuggestionType, SuggestionStatus
from app.services.yaml_ingest import YAMLIngestService

logger = logging.getLogger(__name__)


class SuggestionEngine:
    """Orchestrates LLM analysis and suggestion generation."""
    
    def __init__(self, llm_provider: BaseLLMProvider, yaml_service: YAMLIngestService):
        self.llm_provider = llm_provider
        self.yaml_service = yaml_service
    
    async def analyze_configuration(
        self, 
        file_paths: List[str], 
        scan_id: int,
        analysis_type: str = "optimization"
    ) -> List[Dict[str, Any]]:
        """
        Analyze YAML configuration files and generate suggestions.
        
        Args:
            file_paths: List of YAML files to analyze
            scan_id: Database scan ID for tracking
            analysis_type: Type of analysis (optimization, automation, etc.)
            
        Returns:
            List of suggestion dictionaries ready for database storage
        """
        logger.info(f"Starting {analysis_type} analysis for scan {scan_id}")
        
        # Read all YAML files
        yaml_data = self.yaml_service.read_multiple_files(file_paths)
        if not yaml_data:
            logger.warning("No YAML files found or readable")
            return []
        
        # Prepare context for LLM
        context = self._prepare_analysis_context(yaml_data, analysis_type)
        
        # Generate suggestions based on analysis type
        if analysis_type == "optimization":
            suggestions = await self._generate_optimization_suggestions(context, scan_id)
        elif analysis_type == "automation":
            suggestions = await self._generate_automation_suggestions(context, scan_id)
        else:
            logger.error(f"Unknown analysis type: {analysis_type}")
            return []
        
        logger.info(f"Generated {len(suggestions)} suggestions for scan {scan_id}")
        return suggestions
    
    def _prepare_analysis_context(self, yaml_data: Dict[str, Any], analysis_type: str) -> Dict[str, Any]:
        """Prepare context information for LLM analysis."""
        context = {
            "files": {},
            "summary": {
                "total_files": len(yaml_data),
                "total_size": 0,
                "file_types": set()
            },
            "analysis_type": analysis_type
        }
        
        for file_path, file_info in yaml_data.items():
            # Extract file type from path
            file_type = self._classify_yaml_file(file_path)
            context["summary"]["file_types"].add(file_type)
            context["summary"]["total_size"] += file_info.get("size", 0)
            
            # Store file content with metadata
            context["files"][file_path] = {
                "type": file_type,
                "content": file_info.get("content"),
                "hash": file_info.get("hash"),
                "size": file_info.get("size", 0)
            }
        
        context["summary"]["file_types"] = list(context["summary"]["file_types"])
        return context
    
    def _classify_yaml_file(self, file_path: str) -> str:
        """Classify YAML file type based on path and name."""
        file_path_lower = file_path.lower()
        
        if "automation" in file_path_lower:
            return "automations"
        elif "script" in file_path_lower:
            return "scripts"
        elif "scene" in file_path_lower:
            return "scenes"
        elif "configuration.yaml" in file_path_lower:
            return "configuration"
        elif "customize" in file_path_lower:
            return "customization"
        elif "group" in file_path_lower:
            return "groups"
        elif "sensor" in file_path_lower:
            return "sensors"
        elif "switch" in file_path_lower:
            return "switches"
        else:
            return "other"
    
    async def _generate_optimization_suggestions(
        self, 
        context: Dict[str, Any], 
        scan_id: int
    ) -> List[Dict[str, Any]]:
        """Generate optimization suggestions using LLM."""
        
        # Build optimization prompt
        prompt = self._build_optimization_prompt(context)
        
        # Split into chunks if needed
        if self.llm_provider.can_handle_context(prompt):
            chunks = [prompt]
        else:
            chunks = self._chunk_analysis_context(context)
        
        all_suggestions = []
        
        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i+1}/{len(chunks)}")
            
            messages = [
                LLMMessage(role="system", content=self._get_optimization_system_prompt()),
                LLMMessage(role="user", content=chunk)
            ]
            
            try:
                logger.info(f"Sending prompt to LLM (chunk {i+1}): {chunk[:200]}...")
                response = await self.llm_provider.generate(messages)
                logger.info(f"Received LLM response: {response.content[:200]}...")
                chunk_suggestions = self._parse_optimization_response(response.content, scan_id)
                all_suggestions.extend(chunk_suggestions)
                
            except Exception as e:
                logger.error(f"Error processing chunk {i+1}: {e}")
                continue
        
        return all_suggestions
    
    async def _generate_automation_suggestions(
        self, 
        context: Dict[str, Any], 
        scan_id: int
    ) -> List[Dict[str, Any]]:
        """Generate automation suggestions using LLM."""
        
        prompt = self._build_automation_prompt(context)
        
        messages = [
            LLMMessage(role="system", content=self._get_automation_system_prompt()),
            LLMMessage(role="user", content=prompt)
        ]
        
        try:
            response = await self.llm_provider.generate(messages)
            suggestions = self._parse_automation_response(response.content, scan_id)
            return suggestions
            
        except Exception as e:
            logger.error(f"Error generating automation suggestions: {e}")
            return []
    
    def _build_optimization_prompt(self, context: Dict[str, Any]) -> str:
        """Build optimization analysis prompt."""
        prompt_parts = [
            "# Home Assistant Configuration Analysis Request",
            "",
            f"## Summary",
            f"- Total files: {context['summary']['total_files']}",
            f"- File types: {', '.join(context['summary']['file_types'])}",
            f"- Total size: {context['summary']['total_size']} bytes",
            "",
            "## Files to Analyze",
            ""
        ]
        
        for file_path, file_info in context["files"].items():
            prompt_parts.extend([
                f"### {file_path} ({file_info['type']})",
                "```yaml",
                self._yaml_to_string(file_info["content"]),
                "```",
                ""
            ])
        
        prompt_parts.extend([
            "## Analysis Request",
            "Please analyze the above Home Assistant configuration files and provide optimization suggestions.",
            "Focus on:",
            "1. Performance improvements",
            "2. Code simplification and cleanup",
            "3. Best practices and conventions",
            "4. Deprecated or outdated patterns",
            "5. Redundant or inefficient configurations",
            "",
            "Format your response as a JSON array of suggestion objects."
        ])
        
        return "\n".join(prompt_parts)
    
    def _build_automation_prompt(self, context: Dict[str, Any]) -> str:
        """Build automation suggestion prompt."""
        # Extract entities and devices from configuration
        entities = self._extract_entities_from_context(context)
        
        prompt_parts = [
            "# Home Assistant Automation Suggestions Request",
            "",
            "## Available Entities",
            f"Found {len(entities)} entities across your configuration:",
            ""
        ]
        
        # Group entities by domain
        entity_groups = {}
        for entity in entities:
            domain = entity.split(".")[0] if "." in entity else "unknown"
            if domain not in entity_groups:
                entity_groups[domain] = []
            entity_groups[domain].append(entity)
        
        for domain, domain_entities in entity_groups.items():
            prompt_parts.append(f"### {domain.title()} ({len(domain_entities)} entities)")
            for entity in domain_entities[:10]:  # Limit to first 10 per domain
                prompt_parts.append(f"- {entity}")
            if len(domain_entities) > 10:
                prompt_parts.append(f"- ... and {len(domain_entities) - 10} more")
            prompt_parts.append("")
        
        prompt_parts.extend([
            "## Request",
            "Based on the available entities, suggest useful automations that would improve the smart home experience.",
            "Consider common automation patterns like:",
            "- Lighting automation based on presence/time",
            "- Climate control optimization", 
            "- Security and monitoring",
            "- Energy efficiency",
            "- Convenience automations",
            "",
            "Format your response as a JSON array of automation suggestion objects."
        ])
        
        return "\n".join(prompt_parts)
    
    def _get_optimization_system_prompt(self) -> str:
        """Get system prompt for optimization analysis."""
        # Check if this is an o4 model and use simpler prompt
        if hasattr(self.llm_provider, 'model') and "o4" in self.llm_provider.model:
            return """You are a Home Assistant expert. Find problems in the YAML and suggest fixes.

Return a JSON array with suggestions. Each suggestion needs:
- "title": What to fix
- "description": How to fix it  
- "impact": "high", "medium", or "low"
- "category": "performance" or "maintainability"
- "file_path": Which file to change
- "before": Current YAML
- "after": Fixed YAML
- "reasoning": Why fix this

Only return valid JSON, nothing else."""
        
        return """You are an expert Home Assistant configuration analyst. Your job is to analyze YAML configuration files and suggest specific optimizations.

For each suggestion, provide a JSON object with these fields:
- "title": Brief, clear title of the optimization
- "description": Detailed explanation of the issue and proposed fix
- "impact": "high", "medium", or "low" based on performance/maintainability impact
- "category": "performance", "maintainability", "best_practices", "security", or "deprecated"
- "file_path": The specific file that needs changes
- "before": YAML snippet showing current problematic code
- "after": YAML snippet showing the improved version
- "reasoning": Why this change improves the configuration

Focus on actionable, specific suggestions. Avoid generic advice. Always include exact YAML snippets for before/after comparisons.

Respond only with a valid JSON array of suggestion objects, no other text."""
    
    def _get_automation_system_prompt(self) -> str:
        """Get system prompt for automation suggestions."""
        return """You are an expert Home Assistant automation designer. Your job is to suggest practical, useful automations based on available entities.

For each automation suggestion, provide a JSON object with these fields:
- "title": Clear, descriptive automation name
- "description": What the automation does and why it's useful
- "impact": "high", "medium", or "low" based on usefulness
- "category": "lighting", "climate", "security", "energy", "convenience", or "monitoring"
- "trigger": Description of what triggers the automation
- "condition": Any conditions that must be met
- "action": What actions are performed
- "yaml": Complete YAML automation configuration
- "entities_used": List of entity IDs referenced in the automation

Only suggest automations that:
1. Use entities that actually exist in the configuration
2. Follow Home Assistant best practices
3. Provide clear value to the user
4. Are safe and won't cause issues

Respond only with a valid JSON array of automation suggestion objects, no other text."""
    
    def _parse_optimization_response(self, response: str, scan_id: int) -> List[Dict[str, Any]]:
        """Parse LLM response into optimization suggestions."""
        suggestions = []
        
        try:
            # Extract JSON from response (handle cases where LLM adds extra text)
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = response
            
            parsed = json.loads(json_str)
            
            for item in parsed:
                if not isinstance(item, dict):
                    continue
                
                suggestion = {
                    "scan_id": scan_id,
                    "type": SuggestionType.OPTIMIZATION,
                    "title": item.get("title", "Optimization Suggestion"),
                    "body_md": self._format_optimization_body(item),
                    "impact": item.get("impact", "medium").lower(),
                    "status": SuggestionStatus.PENDING,
                    "created_at": datetime.utcnow(),
                    # Store raw LLM data for diff generation
                    "metadata": {
                        "category": item.get("category"),
                        "file_path": item.get("file_path"),
                        "before": item.get("before"),
                        "after": item.get("after"),
                        "reasoning": item.get("reasoning")
                    }
                }
                suggestions.append(suggestion)
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse optimization response as JSON: {e}")
            logger.error(f"Raw LLM response: {response}")
            logger.info("The LLM may not have returned properly formatted JSON. This is normal for the first run.")
        except Exception as e:
            logger.error(f"Error parsing optimization response: {e}")
            logger.error(f"Raw LLM response: {response}")
        
        return suggestions
    
    def _parse_automation_response(self, response: str, scan_id: int) -> List[Dict[str, Any]]:
        """Parse LLM response into automation suggestions."""
        suggestions = []
        
        try:
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = response
            
            parsed = json.loads(json_str)
            
            for item in parsed:
                if not isinstance(item, dict):
                    continue
                
                suggestion = {
                    "scan_id": scan_id,
                    "type": SuggestionType.AUTOMATION,
                    "title": item.get("title", "Automation Suggestion"),
                    "body_md": self._format_automation_body(item),
                    "impact": item.get("impact", "medium").lower(),
                    "status": SuggestionStatus.PENDING,
                    "created_at": datetime.utcnow(),
                    "metadata": {
                        "category": item.get("category"),
                        "trigger": item.get("trigger"),
                        "condition": item.get("condition"),
                        "action": item.get("action"),
                        "yaml": item.get("yaml"),
                        "entities_used": item.get("entities_used", [])
                    }
                }
                suggestions.append(suggestion)
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse automation response as JSON: {e}")
            logger.debug(f"Response content: {response}")
        except Exception as e:
            logger.error(f"Error parsing automation response: {e}")
        
        return suggestions
    
    def _format_optimization_body(self, item: Dict[str, Any]) -> str:
        """Format optimization suggestion as markdown."""
        parts = [item.get("description", "")]
        
        if item.get("reasoning"):
            parts.extend(["", "**Why this helps:**", item["reasoning"]])
        
        if item.get("before") and item.get("after"):
            parts.extend([
                "", "**Current configuration:**",
                "```yaml", item["before"], "```",
                "", "**Improved configuration:**", 
                "```yaml", item["after"], "```"
            ])
        
        return "\n".join(parts)
    
    def _format_automation_body(self, item: Dict[str, Any]) -> str:
        """Format automation suggestion as markdown."""
        parts = [item.get("description", "")]
        
        if item.get("trigger"):
            parts.extend(["", f"**Trigger:** {item['trigger']}"])
        
        if item.get("condition"):
            parts.extend([f"**Condition:** {item['condition']}"])
        
        if item.get("action"):
            parts.extend([f"**Action:** {item['action']}"])
        
        if item.get("yaml"):
            parts.extend([
                "", "**Automation YAML:**",
                "```yaml", item["yaml"], "```"
            ])
        
        return "\n".join(parts)
    
    def _yaml_to_string(self, yaml_content: Any) -> str:
        """Convert YAML content to string representation."""
        if yaml_content is None:
            return ""
        
        try:
            import yaml
            return yaml.dump(yaml_content, default_flow_style=False, allow_unicode=True)
        except Exception:
            return str(yaml_content)
    
    def _extract_entities_from_context(self, context: Dict[str, Any]) -> List[str]:
        """Extract entity IDs from configuration context."""
        entities = set()
        
        for file_path, file_info in context["files"].items():
            content = file_info.get("content", {})
            if isinstance(content, dict):
                entities.update(self._find_entities_in_dict(content))
        
        return sorted(list(entities))
    
    def _find_entities_in_dict(self, data: Dict[str, Any], path: str = "") -> List[str]:
        """Recursively find entity IDs in dictionary."""
        entities = []
        
        if not isinstance(data, dict):
            return entities
        
        for key, value in data.items():
            current_path = f"{path}.{key}" if path else key
            
            # Check if this looks like an entity ID
            if isinstance(value, str) and "." in value and len(value.split(".")) == 2:
                # Basic entity ID pattern: domain.entity_name
                domain, entity_name = value.split(".", 1)
                if (domain.isalpha() and 
                    entity_name.replace("_", "").replace("-", "").isalnum()):
                    entities.append(value)
            
            # Recursively search nested dictionaries
            elif isinstance(value, dict):
                entities.extend(self._find_entities_in_dict(value, current_path))
            
            # Search in lists
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, dict):
                        entities.extend(self._find_entities_in_dict(item, f"{current_path}[{i}]"))
                    elif isinstance(item, str) and "." in item:
                        if len(item.split(".")) == 2:
                            domain, entity_name = item.split(".", 1)
                            if (domain.isalpha() and 
                                entity_name.replace("_", "").replace("-", "").isalnum()):
                                entities.append(item)
        
        return entities
    
    def _chunk_analysis_context(self, context: Dict[str, Any]) -> List[str]:
        """Split large context into manageable chunks."""
        chunks = []
        current_chunk_files = {}
        current_size = 0
        max_chunk_size = self.llm_provider.context_tokens * 3  # Conservative estimate
        
        for file_path, file_info in context["files"].items():
            file_size = len(self._yaml_to_string(file_info["content"]))
            
            if current_size + file_size > max_chunk_size and current_chunk_files:
                # Create chunk from current files
                chunk_context = {
                    "files": current_chunk_files,
                    "summary": {
                        "total_files": len(current_chunk_files),
                        "file_types": list(set(f["type"] for f in current_chunk_files.values()))
                    },
                    "analysis_type": context["analysis_type"]
                }
                chunks.append(self._build_optimization_prompt(chunk_context))
                
                # Start new chunk
                current_chunk_files = {file_path: file_info}
                current_size = file_size
            else:
                current_chunk_files[file_path] = file_info
                current_size += file_size
        
        # Add final chunk if there are remaining files
        if current_chunk_files:
            chunk_context = {
                "files": current_chunk_files,
                "summary": {
                    "total_files": len(current_chunk_files),
                    "file_types": list(set(f["type"] for f in current_chunk_files.values()))
                },
                "analysis_type": context["analysis_type"]
            }
            chunks.append(self._build_optimization_prompt(chunk_context))
        
        return chunks