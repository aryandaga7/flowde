# models.py

import datetime, uuid
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Text, ForeignKey, TIMESTAMP,
    DateTime, Enum as SQLEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from core.database import Base  # Import the Base from database.py
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import Column, Text
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import text, func
import enum

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
    
    id = Column(UUID(as_uuid=True),
                primary_key=True,
                default=uuid.uuid4,          # client-side generation
                server_default=text("gen_random_uuid()"))
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)
    first_name = Column(String, nullable=True) 
    last_name = Column(String, nullable=True)
    auth_provider = Column(String, default="email", nullable=False)  
    
    # Relationship: a user can have multiple assignments.
    assignments = relationship("Assignment", back_populates="owner", cascade="all, delete-orphan")
    # Relationship: a user can have multiple idea sessions.
    idea_sessions = relationship("IdeaSession", back_populates="user")


# ---------------------
# Assignment Model (represents an assignment or project)
# ---------------------
class Assignment(Base):
    __tablename__ = "assignments"
    
    # Unique identifier for the assignment.
    id = Column(Integer, primary_key=True, index=True)
    # Foreign key linking this assignment to a specific user.
    user_id = Column(UUID(as_uuid=True),
                     ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False)
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

# ───────── NEW TABLES (Flowde 2.0) ─────────

# Enum for session status
class SessionStatus(enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class IdeaSession(Base):
    __tablename__ = "idea_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
    
    # New columns
    status = Column(SQLEnum(SessionStatus), 
                   nullable=False, 
                   default=SessionStatus.DRAFT)
    session_data = Column(JSONB, nullable=True)  # Renamed from metadata
    spec_markdown = Column(Text, nullable=True)
    spec_json = Column(JSONB, nullable=True)  # New column for storing JSON representation
    context_summaries = Column(JSONB, nullable=True, default=list)  # List of context summaries
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="idea_sessions")
    messages = relationship("IdeaMessage", back_populates="session",
                          cascade="all, delete-orphan",
                          order_by="IdeaMessage.created_at")
    nodes = relationship("Node", back_populates="session",
                        cascade="all, delete-orphan")
    edges = relationship("Edge", back_populates="session", cascade="all, delete-orphan")
    spec_changes = relationship("SpecChange", back_populates="session",
                              cascade="all, delete-orphan",
                              order_by="SpecChange.created_at")

class IdeaMessage(Base):
    __tablename__ = "idea_messages"

    id = Column(UUID(as_uuid=True), primary_key=True,
                server_default=text("gen_random_uuid()"))
    session_id = Column(UUID(as_uuid=True),
                       ForeignKey("idea_sessions.id", ondelete="CASCADE"),
                       nullable=False)
    role = Column(String, nullable=False)  # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    
    # Add message_data for potential future use (e.g., message type, UI hints)
    message_data = Column(JSONB, nullable=True)  # Renamed from metadata
    
    created_at = Column(DateTime, nullable=False,
                       default=datetime.datetime.utcnow)

    session = relationship("IdeaSession", back_populates="messages")

class SpecChange(Base):
    __tablename__ = "spec_changes"

    id = Column(UUID(as_uuid=True), primary_key=True,
                server_default=text("gen_random_uuid()"))
    session_id = Column(UUID(as_uuid=True),
                       ForeignKey("idea_sessions.id", ondelete="CASCADE"),
                       nullable=False)
    
    # Store both the patch and the complete spec at this point
    patch = Column(JSONB, nullable=False)
    spec_markdown = Column(Text, nullable=False)  # Full spec at this point
    
    created_at = Column(DateTime, nullable=False,
                       default=datetime.datetime.utcnow)
    
    # Add change_data for tracking change context
    change_data = Column(JSONB, nullable=True)  # Renamed from metadata
    
    session = relationship("IdeaSession", back_populates="spec_changes")

class Node(Base):
    """
    A graph node representing a component in the tech stack flowchart.
    Nodes can have multiple incoming and outgoing connections through the Edge table.
    """
    __tablename__ = "nodes"

    id = Column(UUID(as_uuid=True), primary_key=True,
                server_default=text("gen_random_uuid()"))
    session_id = Column(UUID(as_uuid=True),
                       ForeignKey("idea_sessions.id", ondelete="CASCADE"),
                       nullable=False)
    
    # Node properties
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'UI' | 'API' | 'Database' | 'Service' etc
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    node_data = Column(JSONB, nullable=True)  # Additional node configuration

    created_at = Column(DateTime, nullable=False,
                       default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, nullable=False,
                       default=datetime.datetime.utcnow,
                       onupdate=datetime.datetime.utcnow)

    # Relationships
    session = relationship("IdeaSession", back_populates="nodes")
    
    # Graph relationships through edges
    outgoing_edges = relationship(
        "Edge",
        foreign_keys="Edge.source_id",
        back_populates="source_node",
        cascade="all, delete-orphan"
    )
    incoming_edges = relationship(
        "Edge",
        foreign_keys="Edge.target_id",
        back_populates="target_node",
        cascade="all, delete-orphan"
    )

    def get_connected_nodes(self, direction="both"):
        """Get nodes connected to this node."""
        if direction == "outgoing":
            return [edge.target_node for edge in self.outgoing_edges]
        elif direction == "incoming":
            return [edge.source_node for edge in self.incoming_edges]
        else:  # both
            return (
                [edge.target_node for edge in self.outgoing_edges] +
                [edge.source_node for edge in self.incoming_edges]
            )

class Edge(Base):
    """
    Represents a directed connection between two nodes in the flowchart.
    Each edge has a source node and target node, creating a directed graph structure.
    """
    __tablename__ = "edges"

    id = Column(UUID(as_uuid=True), primary_key=True,
                server_default=text("gen_random_uuid()"))
    session_id = Column(UUID(as_uuid=True),
                       ForeignKey("idea_sessions.id", ondelete="CASCADE"),
                       nullable=False)
    
    # Graph structure
    source_id = Column(UUID(as_uuid=True), 
                      ForeignKey("nodes.id", ondelete="CASCADE"),
                      nullable=False)
    target_id = Column(UUID(as_uuid=True), 
                      ForeignKey("nodes.id", ondelete="CASCADE"),
                      nullable=False)
    
    # Edge properties
    edge_type = Column(String, nullable=False)  # 'data_flow', 'dependency', 'api_call', etc
    edge_data = Column(JSONB, nullable=True)  # Additional edge configuration
    
    # Optional label/description for the connection
    label = Column(String, nullable=True)
    
    created_at = Column(DateTime, nullable=False,
                       default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, nullable=False,
                       default=datetime.datetime.utcnow,
                       onupdate=datetime.datetime.utcnow)

    # Relationships
    session = relationship("IdeaSession", back_populates="edges")
    source_node = relationship(
        "Node",
        foreign_keys=[source_id],
        back_populates="outgoing_edges"
    )
    target_node = relationship(
        "Node",
        foreign_keys=[target_id],
        back_populates="incoming_edges"
    )

    __table_args__ = (
        # Prevent duplicate edges between the same nodes
        UniqueConstraint('session_id', 'source_id', 'target_id', 
                        name='unique_edge_per_session'),
    )
