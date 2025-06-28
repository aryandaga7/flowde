from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from core.database import SessionLocal
from models.models import IdeaSession, IdeaMessage, User
from auth.auth_dependencies import get_current_user
from services.architect_gpt import call_architect_gpt
from services.spec_service import apply_json_patches_to_spec

router = APIRouter()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class MessageRequest(BaseModel):
    session_id: UUID
    user_msg: str

class MessageResponse(BaseModel):
    assistant_msg: str
    spec_markdown: str

@router.post("/api/idea/message", response_model=MessageResponse)
async def process_idea_message(
    request: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process a new message in an idea session.
    Stores the message, gets GPT response, and updates the spec if needed.
    """
    # Get the session and verify ownership
    session = db.query(IdeaSession).filter(
        IdeaSession.id == request.session_id,
        IdeaSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or you don't have permission to access it"
        )
    
    # Store user message
    user_message = IdeaMessage(
        session_id=session.id,
        role="user",
        content=request.user_msg,
        created_at=datetime.utcnow()
    )
    db.add(user_message)
    
    try:
        # Call ArchitectGPT
        gpt_response = await call_architect_gpt(
            spec_markdown=session.spec_markdown or "",
            user_msg=request.user_msg,
            session_id=str(session.id)
        )
        
        # Store assistant message
        assistant_message = IdeaMessage(
            session_id=session.id,
            role="assistant",
            content=gpt_response["assistant_msg"],
            created_at=datetime.utcnow()
        )
        db.add(assistant_message)
        
        # Apply patches to spec if any
        if gpt_response["patches"]:
            updated_spec = apply_json_patches_to_spec(
                session.spec_markdown or "",
                gpt_response["patches"]
            )
            session.spec_markdown = updated_spec
            session.updated_at = datetime.utcnow()
        
        db.commit()
        
        return MessageResponse(
            assistant_msg=gpt_response["assistant_msg"],
            spec_markdown=session.spec_markdown or ""
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        ) 