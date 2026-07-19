"""
User models and schemas
"""

from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from pydantic import BaseModel as PydanticModel, EmailStr
from typing import Optional


# Database Models
class User(BaseModel):
    """User database model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    # Relationships
    goals = relationship("Goal", back_populates="owner", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="owner", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="owner", cascade="all, delete-orphan")


# Pydantic Schemas
class UserCreate(PydanticModel):
    """User creation schema"""
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserUpdate(PydanticModel):
    """User update schema"""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(PydanticModel):
    """User response schema"""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    """User in database schema"""
    hashed_password: str
