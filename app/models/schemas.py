"""
SQLAlchemy database models.
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .database import Base


class ScanStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SuggestionType(enum.Enum):
    OPTIMIZATION = "optimization"
    AUTOMATION = "automation"


class SuggestionStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    APPLIED = "applied"


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    status = Column(Enum(ScanStatus), default=ScanStatus.PENDING)
    file_count = Column(Integer, default=0)
    llm_profile_id = Column(Integer, ForeignKey("llm_profiles.id"), nullable=True)
    
    # Relationships
    suggestions = relationship("Suggestion", back_populates="scan")
    llm_profile = relationship("LLMProfile", back_populates="scans")


class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"))
    type = Column(Enum(SuggestionType))
    title = Column(String(255))
    body_md = Column(Text)
    impact = Column(String(50))  # high, medium, low
    status = Column(Enum(SuggestionStatus), default=SuggestionStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(JSON, nullable=True)  # Store additional metadata
    
    # Relationships
    scan = relationship("Scan", back_populates="suggestions")
    diff = relationship("Diff", back_populates="suggestion", uselist=False)


class Diff(Base):
    __tablename__ = "diffs"

    id = Column(Integer, primary_key=True, index=True)
    suggestion_id = Column(Integer, ForeignKey("suggestions.id"))
    file_path = Column(String(500))
    patch = Column(Text)
    original_sha = Column(String(64))  # SHA-256 of original file
    
    # Relationships
    suggestion = relationship("Suggestion", back_populates="diff")


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, default=1)  # Singleton
    yaml_includes = Column(JSON, default=list)
    yaml_excludes = Column(JSON, default=list)
    cron_expr = Column(String(100), nullable=True)
    db_dsn = Column(String(500), nullable=True)
    db_type = Column(String(50), default="sqlite")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LLMProfile(Base):
    __tablename__ = "llm_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    provider = Column(String(50))  # openai, anthropic, groq, ollama, custom
    endpoint = Column(String(500), nullable=True)
    api_key = Column(String(500), nullable=True)  # Should be encrypted
    context_tokens = Column(Integer, default=4000)
    role = Column(String(50))  # summary, optimize, automation
    model_name = Column(String(100), nullable=True)
    is_active = Column(Integer, default=1)  # Boolean as integer for SQLite
    
    # Relationships
    scans = relationship("Scan", back_populates="llm_profile")


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    level = Column(String(20))  # DEBUG, INFO, WARNING, ERROR
    message = Column(Text)
    component = Column(String(100), nullable=True)  # Which part of system
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=True)