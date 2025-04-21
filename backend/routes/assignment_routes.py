from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.models import Assignment, Step, Connection
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

# Dependency: Provide a database session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for API responses
class ConnectionModel(BaseModel):
    id: int
    from_step: int
    to_step: int

class StepModel(BaseModel):
    id: int
    content: str
    position_x: float
    position_y: float
    completed: bool
    parent_id: Optional[int] = None
    
    class Config:
        orm_mode = True

class AssignmentDetailModel(BaseModel):
    id: int
    title: str
    description: Optional[str] = None  # Allow None values
    deadline: Optional[str] = None     # Allow None values
    completed: bool
    steps: List[StepModel]
    connections: List[ConnectionModel]

    class Config:
        orm_mode = True

@router.get("/assignments/{assignment_id}", response_model=AssignmentDetailModel)
def get_assignment_details(assignment_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific assignment, including all steps and connections.
    This endpoint is used by the React Flow chart to visualize the assignment.
    """
    # Query the assignment
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Query all steps for this assignment
    steps = db.query(Step).filter(Step.assignment_id == assignment_id).all()
    
    # Query all connections for this assignment
    connections = db.query(Connection).filter(Connection.assignment_id == assignment_id).all()
    
    # Create the response model
    response = {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "deadline": assignment.deadline.isoformat() if assignment.deadline else None,
        "completed": assignment.completed,
        "steps": steps,
        "connections": connections
    }
    
    return response