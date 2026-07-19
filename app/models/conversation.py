"""
Conversation models and schemas
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from pydantic import BaseModel as PydanticModel
from typing import Optional
from datetime import datetime


# Database Models
class Conversation(BaseModel):
    """Conversation database model"""
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(BaseModel):
    """Message database model"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


# Pydantic Schemas
class MessageCreate(PydanticModel):
    """Message creation schema"""
    role: str
    content: str


class MessageResponse(PydanticModel):
    """Message response schema"""
    id: int
    conversation_id: int
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationCreate(PydanticModel):
    """Conversation creation schema"""
    title: str
    summary: Optional[str] = None


class ConversationUpdate(PydanticModel):
    """Conversation update schema"""
    title: Optional[str] = None
    summary: Optional[str] = None


class ConversationResponse(PydanticModel):
    """Conversation response schema"""
    id: int
    owner_id: int
    title: str
    summary: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ConversationWithMessages(ConversationResponse):
    """Conversation with messages schema"""
    messages: list[MessageResponse] = []
