# models.py

import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from core.database import Base  # Import the Base from database.py
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, Text
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import text

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    content = Column(Text)
    embedding = Column(Vector(1536))
    source = Column(Text)

# ---------------------
# User Model
# ---------------------
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)
    first_name = Column(String, nullable=True) 
    last_name = Column(String, nullable=True)
    auth_provider = Column(String, default="email", nullable=False)  
    
    # Relationship: a user can have multiple assignments.
    assignments = relationship("Assignment", back_populates="owner", cascade="all, delete-orphan")


# ---------------------
# Assignment Model (represents an assignment or project)
# ---------------------
class Assignment(Base):
    __tablename__ = "assignments"
    
    # Unique identifier for the assignment.
    id = Column(Integer, primary_key=True, index=True)
    # Foreign key linking this assignment to a specific user.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Title of the assignment.
    title = Column(String, nullable=False)
    # Detailed description of the assignment.
    description = Column(Text)
    # Deadline for the assignment.
    deadline = Column(TIMESTAMP, nullable=True)
    # Status indicating if the assignment is completed.
    completed = Column(Boolean, default=False)
    # Timestamp when the assignment was created.
    created_at = Column(TIMESTAMP, default=datetime.datetime.utcnow)
    
    # Relationship: each assignment belongs to a user.
    owner = relationship("User", back_populates="assignments")
    # Relationship: one assignment has many steps (nodes) in the flowchart.
    steps = relationship("Step", back_populates="assignment", cascade="all, delete-orphan")
    # Relationship: one assignment has many connections (edges) between steps.
    connections = relationship("Connection", back_populates="assignment", cascade="all, delete-orphan")
    # Relationship: one assignment has many chat messages (for the unified chatbot).
    chat_messages = relationship("ChatMessage", back_populates="assignment", cascade="all, delete-orphan")


# ---------------------
# Step Model (represents a node or step in the flowchart)
# ---------------------
class Step(Base):
    __tablename__ = "steps"
    
    # Unique identifier for the step.
    id = Column(Integer, primary_key=True, index=True)
    # Foreign key linking this step to a specific assignment.
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    # Self-referential foreign key: if this step is a sub-step, parent_id links to its parent step.
    parent_id = Column(Integer, ForeignKey("steps.id", ondelete="CASCADE"), nullable=True)
    # Content or description of the step.
    content = Column(Text, nullable=False)
    # X-coordinate for the draggable UI.
    position_x = Column(Float, nullable=False)
    # Y-coordinate for the draggable UI.
    position_y = Column(Float, nullable=False)
    # Boolean indicating if this step is marked as completed.
    completed = Column(Boolean, default=False)
    
    # Relationship: each step belongs to an assignment.
    assignment = relationship("Assignment", back_populates="steps")
    # Self-referential relationship: a step can have multiple sub-steps.
    sub_steps = relationship("Step", backref="parent", remote_side=[id])


# ---------------------
# Connection Model (represents an edge/connection between two steps)
# ---------------------
class Connection(Base):
    __tablename__ = "connections"
    
    # Unique identifier for the connection.
    id = Column(Integer, primary_key=True, index=True)
    # Foreign key linking this connection to a specific assignment.
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    # The starting step of the connection.
    from_step = Column(Integer, ForeignKey("steps.id", ondelete="CASCADE"), nullable=False)
    # The ending step of the connection.
    to_step = Column(Integer, ForeignKey("steps.id", ondelete="CASCADE"), nullable=False)
    
    # Relationship: each connection belongs to an assignment.
    assignment = relationship("Assignment", back_populates="connections")


# ---------------------
# ChatMessage Model (stores chat logs for assignments)
# ---------------------
class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    # Unique identifier for the chat message.
    id = Column(Integer, primary_key=True, index=True)
    # Foreign key linking this chat message to a specific assignment.
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    # Optional foreign key: if this message is about a specific step, otherwise NULL.
    step_id = Column(Integer, ForeignKey("steps.id", ondelete="CASCADE"), nullable=True)
    # Stores the user's message (what the user asked).
    user_message = Column(Text, nullable=False)
    # Stores the bot's response to the user's message.
    bot_response = Column(Text, nullable=True)
    # Timestamp for when the message was sent.
    timestamp = Column(TIMESTAMP, default=datetime.datetime.utcnow)
    
    # Relationship: each chat message belongs to an assignment.
    assignment = relationship("Assignment", back_populates="chat_messages")
