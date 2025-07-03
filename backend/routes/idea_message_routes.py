from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from core.database import SessionLocal
from models.models import IdeaSession, IdeaMessage, User, SpecChange
from auth.auth_dependencies import get_current_user
from services.architect_gpt import call_architect_gpt
from services.spec_service import markdown_to_json

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
    skill_level: Optional[str] = "intermediate"  # New field for Phase 1

class MessageResponse(BaseModel):
    assistant_msg: str
    spec_markdown: str
    updated_sections: list[str]
    changes_made: Optional[list[dict]] = []  # New field for Phase 1

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
        # Check if this is the first message
        is_first_message = not db.query(IdeaMessage).filter(
            IdeaMessage.session_id == session.id,
            IdeaMessage.id != user_message.id  # Exclude current message
        ).first()
        
        # Get current context summary if it exists
        current_context = None
        if session.context_summaries and len(session.context_summaries) > 0:
            current_context = session.context_summaries[-1]
        
        # Get message history
        message_history = []
        previous_messages = db.query(IdeaMessage).filter(
            IdeaMessage.session_id == session.id,
            IdeaMessage.id != user_message.id  # Exclude current message
        ).order_by(IdeaMessage.created_at.desc()).limit(10).all()  # Get last 10 messages
        
        for msg in previous_messages:
            message_dict = {
                "user_message": msg.content if msg.role == "user" else "",
                "bot_response": msg.content if msg.role == "assistant" else "",
                "spec_markdown": None  # We'll get this from spec_changes if needed
            }
            message_history.append(message_dict)
        
        message_history.reverse()  # Put in chronological order
        
        # Call ArchitectGPT with skill level
        gpt_response = await call_architect_gpt(
            spec_markdown=session.spec_markdown or "",
            user_msg=request.user_msg,
            session_id=str(session.id),
            is_first_message=is_first_message,
            context_summary=current_context,
            message_history=message_history,
            skill_level=request.skill_level
        )
        
        # Store assistant message
        assistant_message = IdeaMessage(
            session_id=session.id,
            role="assistant",
            content=gpt_response["assistant_msg"],
            created_at=datetime.utcnow()
        )
        db.add(assistant_message)
        
        # Update spec if changed
        if gpt_response["spec_markdown"] != session.spec_markdown:
            # Convert markdown to JSON for structured storage
            spec_json = markdown_to_json(gpt_response["spec_markdown"])
            
            # Determine if this is the first content creation (empty -> content)
            is_initial_version = not (session.spec_markdown and session.spec_markdown.strip())
            
            # Always create SpecChange entry, but mark initial versions appropriately
            spec_change = SpecChange(
                session_id=session.id,
                spec_markdown=gpt_response["spec_markdown"],
                patch={"updated_sections": gpt_response["updated_sections"]},
                change_data={
                    "type": "initial_version" if is_initial_version else "gpt_update",
                    "is_initial": is_initial_version,
                    "updated_sections": gpt_response["updated_sections"],
                    "changes_made": gpt_response.get("changes_made", []),  # Store structured changes
                    "skill_level": request.skill_level  # Track skill level used
                },
                created_at=datetime.utcnow()
            )
            db.add(spec_change)
            
            # Update session
            session.spec_markdown = gpt_response["spec_markdown"]
            session.spec_json = spec_json
            
            # Update title if this is the first message and we got a suggestion
            if is_first_message and gpt_response.get("suggested_title"):
                session.title = gpt_response["suggested_title"]
            
            # Update context summaries if we got a new one
            if gpt_response.get("context_summary"):
                if not session.context_summaries:
                    session.context_summaries = []
                session.context_summaries.append(gpt_response["context_summary"])
            
            session.updated_at = datetime.utcnow()
        
        db.commit()
        
        return MessageResponse(
            assistant_msg=gpt_response["assistant_msg"],
            spec_markdown=session.spec_markdown or "",
            updated_sections=gpt_response["updated_sections"],
            changes_made=gpt_response.get("changes_made", [])  # Include changes for Phase 1
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        ) 