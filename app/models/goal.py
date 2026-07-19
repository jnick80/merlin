"""
Goal models and schemas
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from pydantic import BaseModel as PydanticModel
from typing import Optional
from datetime import datetime
import enum


class GoalStatus(str, enum.Enum):
    """Goal status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"


# Database Models
class Goal(BaseModel):
    """Goal database model"""
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(GoalStatus), default=GoalStatus.PENDING, nullable=False)
    priority = Column(Integer, default=0)
    target_date = Column(String, nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="goals")
    tasks = relationship("Task", back_populates="goal", cascade="all, delete-orphan")


# Pydantic Schemas
class GoalCreate(PydanticModel):
    """Goal creation schema"""
    title: str
    description: Optional[str] = None
    priority: int = 0
    target_date: Optional[str] = None


class GoalUpdate(PydanticModel):
    """Goal update schema"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[GoalStatus] = None
    priority: Optional[int] = None
    target_date: Optional[str] = None


class GoalResponse(PydanticModel):
    """Goal response schema"""
    id: int
    owner_id: int
    title: str
    description: Optional[str]
    status: GoalStatus
    priority: int
    target_date: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
