"""
Pydantic models for API request/response schemas.
"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from enum import Enum


class ScanStatusEnum(str, Enum):
    PENDING = "pending"
    RUNNING = "running" 
    COMPLETED = "completed"
    FAILED = "failed"


class SuggestionTypeEnum(str, Enum):
    OPTIMIZATION = "optimization"
    AUTOMATION = "automation"


class SuggestionStatusEnum(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    APPLIED = "applied"


# Request models
class ScanCreate(BaseModel):
    files: List[str] = []
    scan_type: str = "manual"
    llm_profile_id: Optional[int] = None
    analysis_types: List[str] = ["optimization"]


class SuggestionUpdate(BaseModel):
    status: SuggestionStatusEnum


class SettingsUpdate(BaseModel):
    yaml_includes: Optional[List[str]] = None
    yaml_excludes: Optional[List[str]] = None
    cron_expr: Optional[str] = None
    db_dsn: Optional[str] = None
    db_type: Optional[str] = None


class LLMProfileCreate(BaseModel):
    name: str
    provider: str
    endpoint: Optional[str] = None
    api_key: Optional[str] = None
    context_tokens: int = 4000
    role: str
    model_name: Optional[str] = None


class LLMProfileUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    endpoint: Optional[str] = None
    api_key: Optional[str] = None
    context_tokens: Optional[int] = None
    role: Optional[str] = None
    model_name: Optional[str] = None
    is_active: Optional[bool] = None


# Response models
class DiffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    file_path: str
    patch: str
    original_sha: str


class SuggestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    type: SuggestionTypeEnum
    title: str
    body_md: str
    impact: str
    status: SuggestionStatusEnum
    created_at: datetime
    diff: Optional[DiffResponse] = None


class ScanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: ScanStatusEnum
    file_count: int
    suggestions: List[SuggestionResponse] = []


class LLMProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    provider: str
    endpoint: Optional[str] = None
    context_tokens: int
    role: str
    model_name: Optional[str] = None
    is_active: bool


class SettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    yaml_includes: List[str]
    yaml_excludes: List[str]
    cron_expr: Optional[str] = None
    db_dsn: Optional[str] = None
    db_type: str