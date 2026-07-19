"""
Task models and schemas
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from pydantic import BaseModel as PydanticModel
from typing import Optional
from datetime import datetime
import enum


class TaskStatus(str, enum.Enum):
    """Task status enumeration"""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    ARCHIVED = "archived"


# Database Models
class Task(BaseModel):
    """Task database model"""
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO, nullable=False)
    priority = Column(Integer, default=0)
    due_date = Column(String, nullable=True)
    is_approved = Column(Boolean, default=False)
    
    # Relationships
    owner = relationship("User", back_populates="tasks")
    goal = relationship("Goal", back_populates="tasks")


# Pydantic Schemas
class TaskCreate(PydanticModel):
    """Task creation schema"""
    title: str
    description: Optional[str] = None
    goal_id: Optional[int] = None
    priority: int = 0
    due_date: Optional[str] = None


class TaskUpdate(PydanticModel):
    """Task update schema"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[int] = None
    due_date: Optional[str] = None
    is_approved: Optional[bool] = None


class TaskResponse(PydanticModel):
    """Task response schema"""
    id: int
    owner_id: int
    goal_id: Optional[int]
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: int
    due_date: Optional[str]
    is_approved: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
