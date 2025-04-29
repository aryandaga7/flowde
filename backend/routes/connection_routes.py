# connection_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.models import Connection, Assignment, User
from core.database import SessionLocal
from auth.auth_dependencies import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ConnectionCreate(BaseModel):
    assignment_id: int
    from_step: int
    to_step: int

@router.post("/connections", status_code=status.HTTP_201_CREATED)
def create_connection(
    connection: ConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify assignment exists and user has permission
    assignment = db.query(Assignment).filter(Assignment.id == connection.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this assignment")
    
    # Check if connection already exists
    existing_connection = db.query(Connection).filter(
        Connection.assignment_id == connection.assignment_id,
        Connection.from_step == connection.from_step,
        Connection.to_step == connection.to_step
    ).first()
    
    if existing_connection:
        return {"message": "Connection already exists", "connection": existing_connection}
    
    # Create new connection
    new_connection = Connection(
        assignment_id=connection.assignment_id,
        from_step=connection.from_step,
        to_step=connection.to_step
    )
    
    db.add(new_connection)
    db.commit()
    db.refresh(new_connection)
    
    return {"message": "Connection created successfully", "connection": new_connection}