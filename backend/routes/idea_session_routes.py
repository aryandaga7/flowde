from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from models.models import IdeaSession, User, IdeaMessage
from core.database import SessionLocal
from auth.auth_dependencies import get_current_user
from sqlalchemy import desc
from uuid import UUID

router = APIRouter()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class IdeaSessionResponse(BaseModel):
    id: UUID
    title: str | None
    spec_preview: str
    created_at: datetime
    updated_at: datetime | None

    class Config:
        orm_mode = True

class CreateSessionResponse(BaseModel):
    id: UUID
    title: str | None
    spec_preview: str
    created_at: datetime
    updated_at: datetime | None

    class Config:
        orm_mode = True

class MessageResponse(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        orm_mode = True

class SessionMessagesResponse(BaseModel):
    messages: List[MessageResponse]
    spec_markdown: str

    class Config:
        orm_mode = True

@router.get("/api/idea/sessions/{session_id}/messages", response_model=SessionMessagesResponse)
async def get_session_messages(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all messages and current spec for a specific session.
    Only returns data if the session belongs to the authenticated user.
    """
    session = db.query(IdeaSession).filter(
        IdeaSession.id == session_id,
        IdeaSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or you don't have permission to access it"
        )

    messages = db.query(IdeaMessage).filter(
        IdeaMessage.session_id == session_id
    ).order_by(IdeaMessage.created_at).all()

    return SessionMessagesResponse(
        messages=[
            MessageResponse(
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at
            ) for msg in messages
        ],
        spec_markdown=session.spec_markdown or ""
    )

@router.post("/api/idea/sessions", response_model=CreateSessionResponse)
async def create_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new idea session for the authenticated user.
    """
    new_session = IdeaSession(
        user_id=current_user.id,
        title=None,  # Will be set later
        spec_markdown="",  # Start with empty spec
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    try:
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return CreateSessionResponse(
            id=new_session.id,
            title=new_session.title,
            spec_preview="",  # New session starts empty
            created_at=new_session.created_at,
            updated_at=new_session.updated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )

@router.get("/api/idea/sessions", response_model=List[IdeaSessionResponse])
async def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch all idea sessions for the authenticated user.
    Returns sessions sorted by most recent first.
    """
    sessions = db.query(IdeaSession).filter(
        IdeaSession.user_id == current_user.id
    ).order_by(desc(IdeaSession.created_at)).all()

    # Transform sessions to include spec preview
    return [
        IdeaSessionResponse(
            id=session.id,
            title=session.title or f"Untitled Idea {session.id}",
            spec_preview=session.spec_markdown[:100] + "..." if session.spec_markdown else "",
            created_at=session.created_at,
            updated_at=session.updated_at
        )
        for session in sessions
    ]

@router.get("/api/idea/sessions/{session_id}", response_model=IdeaSessionResponse)
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch a specific idea session by ID.
    Only returns the session if it belongs to the authenticated user.
    """
    session = db.query(IdeaSession).filter(
        IdeaSession.id == session_id,
        IdeaSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or you don't have permission to access it"
        )

    return IdeaSessionResponse(
        id=session.id,
        title=session.title or f"Untitled Idea {session.id}",
        spec_preview=session.spec_markdown[:100] + "..." if session.spec_markdown else "",
        created_at=session.created_at,
        updated_at=session.updated_at
    ) 