"""
Memory models and schemas
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from pydantic import BaseModel as PydanticModel
from typing import Optional, Any
from datetime import datetime


# Database Models
class Memory(BaseModel):
    """Memory database model"""
    __tablename__ = "memories"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=True, index=True)
    tags = Column(JSON, nullable=True)  # Array of tags
    is_archived = Column(String, default=False)
    
    # Relationships
    owner = relationship("User", back_populates="memories")


# Pydantic Schemas
class MemoryCreate(PydanticModel):
    """Memory creation schema"""
    title: str
    content: str
    category: Optional[str] = None
    tags: Optional[list[str]] = None


class MemoryUpdate(PydanticModel):
    """Memory update schema"""
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None


class MemoryResponse(PydanticModel):
    """Memory response schema"""
    id: int
    owner_id: int
    title: str
    content: str
    category: Optional[str]
    tags: Optional[list[str]]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MemorySearch(PydanticModel):
    """Memory search schema"""
    query: str
    category: Optional[str] = None
    limit: int = 10
