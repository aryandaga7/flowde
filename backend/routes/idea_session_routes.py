from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from models.models import IdeaSession, User, IdeaMessage, SpecChange
from core.database import SessionLocal
from auth.auth_dependencies import get_current_user
from sqlalchemy import desc
from uuid import UUID
from services.spec_service import markdown_to_json

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
        from_attributes = True

class CreateSessionResponse(BaseModel):
    id: UUID
    title: str | None
    spec_preview: str
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class SessionMessagesResponse(BaseModel):
    messages: List[MessageResponse]
    spec_markdown: str

    class Config:
        from_attributes = True

class SpecVersionResponse(BaseModel):
    id: UUID
    spec_markdown: str
    created_at: datetime
    change_data: dict | None

    class Config:
        from_attributes = True

class RestoreVersionRequest(BaseModel):
    version_id: UUID

class UpdateSpecRequest(BaseModel):
    spec_markdown: str
    change_description: str | None = None

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

@router.get("/api/idea/sessions/{session_id}/spec-versions", response_model=List[SpecVersionResponse])
async def get_spec_versions(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all spec versions for a session, ordered by creation date (newest first).
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

    spec_changes = db.query(SpecChange).filter(
        SpecChange.session_id == session_id
    ).order_by(desc(SpecChange.created_at)).all()

    return [
        SpecVersionResponse(
            id=change.id,
            spec_markdown=change.spec_markdown,
            created_at=change.created_at,
            change_data=change.change_data
        )
        for change in spec_changes
    ]

@router.post("/api/idea/sessions/{session_id}/restore-version")
async def restore_spec_version(
    session_id: UUID,
    request: RestoreVersionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Restore a specific version of the spec and create a new SpecChange entry for the restoration.
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

    # Get the version to restore
    version_to_restore = db.query(SpecChange).filter(
        SpecChange.id == request.version_id,
        SpecChange.session_id == session_id
    ).first()

    if not version_to_restore:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spec version not found"
        )

    try:
        # Convert markdown to JSON for structured storage
        spec_json = markdown_to_json(version_to_restore.spec_markdown)
        
        # Create new SpecChange entry for the restoration
        restoration_change = SpecChange(
            session_id=session.id,
            spec_markdown=version_to_restore.spec_markdown,
            patch={"action": "version_restore", "restored_from_version": str(request.version_id)},
            change_data={
                "type": "version_restore",
                "restored_from": str(request.version_id),
                "restored_at": datetime.utcnow().isoformat()
            },
            created_at=datetime.utcnow()
        )
        db.add(restoration_change)
        
        # Update session with restored spec
        session.spec_markdown = version_to_restore.spec_markdown
        session.spec_json = spec_json
        session.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "message": "Version restored successfully",
            "spec_markdown": session.spec_markdown
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error restoring version: {str(e)}"
        )

@router.post("/api/idea/sessions/{session_id}/update-spec")
async def update_spec_manually(
    session_id: UUID,
    request: UpdateSpecRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually update the spec and create a new SpecChange entry.
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

    try:
        # Convert markdown to JSON for structured storage
        spec_json = markdown_to_json(request.spec_markdown)
        
        # Create new SpecChange entry for manual edit
        manual_change = SpecChange(
            session_id=session.id,
            spec_markdown=request.spec_markdown,
            patch={"action": "manual_edit", "description": request.change_description},
            change_data={
                "type": "manual_edit",
                "description": request.change_description or "Manual specification update",
                "edited_at": datetime.utcnow().isoformat()
            },
            created_at=datetime.utcnow()
        )
        db.add(manual_change)
        
        # Update session with new spec
        session.spec_markdown = request.spec_markdown
        session.spec_json = spec_json
        session.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "message": "Spec updated successfully",
            "spec_markdown": session.spec_markdown
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating spec: {str(e)}"
        ) 