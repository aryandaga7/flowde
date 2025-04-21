from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from models.models import Assignment
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
