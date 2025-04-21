# chat_routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json

# Import models and dependencies
from models.models import ChatMessage, Assignment, Step, User, Connection
from core.database import SessionLocal
from auth.auth_dependencies import get_current_user
from services.gpt_workflow import generate_assignment_workflow
from services.gpt_chat import (generate_assignment_chat_response, generate_node_chat_response)
from services.deep_dive import generate_deep_dive_breakdown

router = APIRouter()

# Dependency: provide DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------
# Pydantic models for chat messages
# -------------------------------
class StepModel(BaseModel):
    id: int
    content: str
    position_x: float
    position_y: float
    completed: bool
    parent_id: Optional[int] = None

    class Config:
        orm_mode = True
        from_attributes=True

class ChatMessageCreate(BaseModel):
    assignment_id: int
    step_id: Optional[int] = None  # If None, it's an assignment-level message
    user_message: str
    is_deepdive: bool = False 

class ChatMessageResponse(BaseModel):
    id: int
    assignment_id: int
    step_id: Optional[int] = None
    user_message: str
    bot_response: Optional[str] = None
    timestamp: datetime

    class Config:
        orm_mode = True

# For deep dive responses, we return a JSON breakdown of substeps.
class DeepDiveResponse(BaseModel):
    breakdown_steps: List[StepModel]

# ------------------------------------------------
# GET /chat/assignment/{assignment_id}
# Returns all general chat messages for an assignment
# ------------------------------------------------
@router.get("/chat/assignment/{assignment_id}", response_model=List[ChatMessageResponse])
def get_assignment_chat(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify assignment ownership.
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id, 
        Assignment.user_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or not authorized")
    messages = db.query(ChatMessage).filter(
        ChatMessage.assignment_id == assignment_id,
        ChatMessage.step_id.is_(None)
    ).order_by(ChatMessage.timestamp).all()
    return messages

# ------------------------------------------------
# GET /chat/node/{node_id}
# Returns chat messages for a specific node.
# ------------------------------------------------
@router.get("/chat/node/{node_id}", response_model=List[ChatMessageResponse])
def get_node_chat(node_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    node = db.query(Step).filter(Step.id == node_id).first()
    if not node or node.assignment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Node not found or not authorized")
    messages = db.query(ChatMessage).filter(
        ChatMessage.step_id == node_id
    ).order_by(ChatMessage.timestamp).all()
    return messages

# ------------------------------------------------
# POST /chat
# Create a new chat message (assignment-level or node-specific).
# This endpoint calls the GPT helper to generate a reply,
# then stores the user query and GPT response in the DB.
# ------------------------------------------------
@router.post("/chat", response_model=ChatMessageResponse)
def post_chat_message(chat: ChatMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify assignment ownership.
    assignment = db.query(Assignment).filter(
        Assignment.id == chat.assignment_id, 
        Assignment.user_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or not authorized")
    
    if chat.is_deepdive:
        raise HTTPException(status_code=400, detail="Use /chat/deepdive/{node_id} endpoint for deep dives")
    else:
        if chat.step_id is None:
            recent_messages = db.query(ChatMessage).filter(
                ChatMessage.assignment_id == chat.assignment_id,
                ChatMessage.step_id.is_(None)
            ).order_by(ChatMessage.timestamp.desc()).limit(5).all()
            # Assignment-level chat.
            bot_response = generate_assignment_chat_response(
                chat.user_message, 
                assignment_title=assignment.title, 
                assignment_description=assignment.description,
                recent_messages=recent_messages
            )
        else:
            # Node-specific chat.
            node = db.query(Step).filter(Step.id == chat.step_id).first()
            if not node:
                raise HTTPException(status_code=404, detail="Node not found")
            # Retrieve the last 5 messages for this node.
            recent_node_messages = db.query(ChatMessage).filter(
                ChatMessage.step_id == chat.step_id
            ).order_by(ChatMessage.timestamp.desc()).limit(5).all()
            bot_response = generate_node_chat_response(
                chat.user_message, 
                assignment_title=assignment.title, 
                assignment_description=assignment.description,
                node_content=node.content,
                recent_node_messages=recent_node_messages
            )
        
        new_message = ChatMessage(
            assignment_id=chat.assignment_id,
            step_id=chat.step_id,
            user_message=chat.user_message,  # Store only the user's question (without added context)
            bot_response=bot_response,
            timestamp=datetime.utcnow()
        )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        return new_message

# ------------------------------------------------
# POST /chat/deepdive/{node_id}
# Deep dive on a specific node.
# This endpoint calls GPT to generate a structured breakdown of the node into substeps.
# The response is returned as JSON (substeps without position data) and stored as a chat message.
# ------------------------------------------------
class DeepDiveRequest(BaseModel):
    question: str


@router.post("/chat/deepdive/{node_id}", response_model=DeepDiveResponse)
def deep_dive_node(node_id: int, request: DeepDiveRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify node exists and belongs to current user
    node = db.query(Step).filter(Step.id == node_id).first()
    if not node or node.assignment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Node not found or not authorized")
    
    assignment = db.query(Assignment).filter(Assignment.id == node.assignment_id).first()
    
    # Use the question from the request
    node_context = f"Assignment: {assignment.title}\nDescription: {assignment.description}\nNode Content: {node.content}\n"
    node_context += f"\nUser Deep Dive Question: {request.question}\n"
    
    breakdown = generate_deep_dive_breakdown(node_context, extra_context=request.question)
    if not breakdown:
        raise HTTPException(status_code=500, detail="Deep dive breakdown failed")
    
    breakdown_steps = breakdown["new_steps"]
    created_steps = []
    prev_step = None

    for idx, substep in enumerate(breakdown_steps):
        content = substep.get("content", "")
        
        # Determine insertion logic
        if node.parent_id is None:  # Parent node
            if idx == 0:
                insertion_type = "new_step"
                reference_node_id = node.id
            else:
                insertion_type = "after"
                reference_node_id = prev_step.id
        else:  # Child node
            if idx == 0:
                insertion_type = "substep"
                reference_node_id = node.id
            else:
                insertion_type = "after"
                reference_node_id = prev_step.id

        # Create new step with calculated position
        new_step = Step(
            assignment_id=node.assignment_id,
            content=content,
            parent_id=None,
            position_x=0,
            position_y=0,
            completed=False
        )
        db.add(new_step)
        db.flush()  # Generate ID

        # Calculate position based on insertion type
        ref_node = db.query(Step).filter(Step.id == reference_node_id).first()
        if not ref_node:
            continue

        if insertion_type == "new_step":
            # Add to right of parent as new main step
            new_step.position_x = ref_node.position_x + 250
            new_step.position_y = ref_node.position_y
        elif insertion_type == "substep":
            # Add as child below parent
            new_step.parent_id = ref_node.id
            new_step.position_x = ref_node.position_x + 150
            new_step.position_y = ref_node.position_y
        elif insertion_type == "after":
            # Add below previous step
            new_step.parent_id = ref_node.parent_id
            new_step.position_x = ref_node.position_x
            new_step.position_y = ref_node.position_y + 80

        # Update step with calculated position
        db.add(new_step)
        db.flush()

        # Create connections
        if insertion_type == "new_step":
            # Connect original node to new step
            db.add(Connection(
                assignment_id=assignment.id,
                from_step=ref_node.id,
                to_step=new_step.id
            ))
            
            # Connect new step to next main step if exists
            next_main = db.query(Connection).filter(
                Connection.from_step == ref_node.id,
                Step.parent_id.is_(None)
            ).join(Step, Connection.to_step == Step.id).first()
            
            if next_main:
                db.add(Connection(
                    assignment_id=assignment.id,
                    from_step=new_step.id,
                    to_step=next_main.to_step
                ))
                db.delete(next_main)

        elif insertion_type == "substep":
            # Connect parent to new substep
            db.add(Connection(
                assignment_id=assignment.id,
                from_step=ref_node.id,
                to_step=new_step.id
            ))

        elif insertion_type == "after":
            # Re-wire connections
            outgoing = db.query(Connection).filter(
                Connection.from_step == ref_node.id
            ).first()
            
            if outgoing:
                db.add(Connection(
                    assignment_id=assignment.id,
                    from_step=new_step.id,
                    to_step=outgoing.to_step
                ))
                db.delete(outgoing)
            
            db.add(Connection(
                assignment_id=assignment.id,
                from_step=ref_node.id,
                to_step=new_step.id
            ))

        created_steps.append(new_step)
        prev_step = new_step

    db.commit()

    # Store chat message
    new_chat = ChatMessage(
        assignment_id=node.assignment_id,
        step_id=node_id,
        user_message=request.question,
        bot_response=json.dumps({"substeps": [s.content for s in created_steps]}),
        timestamp=datetime.utcnow()
    )
    db.add(new_chat)
    db.commit()

    breakdown_steps = [StepModel.from_orm(step) for step in created_steps]
    return DeepDiveResponse(breakdown_steps=breakdown_steps)