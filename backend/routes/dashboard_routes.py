from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from models.models import Assignment, Step
from core.database import SessionLocal
from auth.auth_dependencies import get_current_user  # Ensure this dependency is defined as shown earlier
from models.models import User
from sqlalchemy import desc

router = APIRouter()

# Dependency to get a DB session.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic model for a summary of an assignment.
class AssignmentSummary(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    deadline: Optional[str] = None
    completed: bool

    class Config:
        orm_mode = True

@router.get("/user/assignments", response_model=List[AssignmentSummary])
def get_user_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch all assignments for the authenticated user.
    This endpoint uses the current user's information (extracted from the JWT)
    to query the assignments linked to that user.
    """
    assignments = db.query(Assignment).filter(Assignment.user_id == current_user.id).order_by(desc(Assignment.created_at)).all()
    if not assignments:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No assignments found for this user")
    return assignments

@router.patch("/assignments/{assignment_id}/completion")
def update_assignment_completion(
    assignment_id: int,
    completed: bool = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the completion status of an assignment.
    """
    # Check if the assignment exists and belongs to the current user
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.user_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found or you don't have permission to modify it"
        )
    
    # Update the completion status
    assignment.completed = completed
    db.commit()
    
    return {"message": "Assignment completion status updated successfully"}

@router.get("/assignments/{assignment_id}/completion-status")
def get_assignment_completion_status(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if all steps in an assignment are completed.
    """
    # Check if the assignment exists and belongs to the current user
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.user_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found or you don't have permission to access it"
        )
    
    # Get all steps for the assignment
    steps = db.query(Step).filter(Step.assignment_id == assignment_id).all()
    
    # Check if there are any steps
    if not steps:
        return {"all_completed": False}
    
    # Check if all steps are completed
    all_completed = all(step.completed for step in steps)
    
    return {"all_completed": all_completed}


@router.get("/steps/{step_id}")
def get_step(
    step_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific step.
    """
    step = db.query(Step).filter(Step.id == step_id).first()
    
    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Step not found"
        )
    
    # Check if the step belongs to the current user
    assignment = db.query(Assignment).filter(
        Assignment.id == step.assignment_id,
        Assignment.user_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this step"
        )
    
    return step

@router.post("/assignments/{assignment_id}/check-completion")
def check_and_update_assignment_completion(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if all steps are completed and update assignment status accordingly.
    """
    # Check if the assignment exists and belongs to the current user
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.user_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found or you don't have permission to access it"
        )
    
    # Get all steps for the assignment
    steps = db.query(Step).filter(Step.assignment_id == assignment_id).all()
    
    # If no steps, nothing to complete
    if not steps:
        return {"all_completed": False, "updated": False}
    
    # Check if all steps are completed
    all_completed = all(step.completed for step in steps)
    
    # Only update if all are completed and assignment isn't already marked complete
    updated = False
    if all_completed and not assignment.completed:
        assignment.completed = True
        db.commit()
        updated = True
    
    return {"all_completed": all_completed, "updated": updated}

#print("Available routes in dashboard_routes:", [route.path for route in router.routes])
