from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import SessionLocal, engine, Base
from models.models import Assignment, Step, Connection, User
from services.gpt_workflow import generate_assignment_workflow
from datetime import datetime
import uvicorn

# Import routers
from routes.assignment_routes import router as assignment_router
from routes.auth_routes import router as auth_router
from routes.dashboard_routes import router as dashboard_router
from routes.node_routes import router as node_router
from routes.chat_routes import router as chat_router

# Import current user dependency
from auth.auth_dependencies import get_current_user

# Create all tables if they don't exist yet.
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(assignment_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(node_router)
app.include_router(chat_router)


# Pydantic model for assignment creation.
class AssignmentRequest(BaseModel):
    assignment_input: str

# Dependency to provide DB session.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/create-assignment")
def create_assignment(
    request: AssignmentRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        # Generate a workflow from GPT.
        workflow = generate_assignment_workflow(request.assignment_input)
        if not workflow:
            raise HTTPException(status_code=500, detail="Failed to generate assignment workflow from GPT.")
        
        # Parse deadline if provided.
        deadline_str = workflow.get("due_date")
        deadline = None
        if deadline_str:
            try:
                deadline = datetime.strptime(deadline_str.strip(), "%Y-%m-%d")
            except Exception as e:
                print("Error parsing due_date:", e)
        
        # Create the assignment record.
        new_assignment = Assignment(
            user_id=current_user.id,
            title=workflow.get("title", "Untitled Assignment"),
            description=workflow.get("description", ""),
            deadline=deadline
        )
        db.add(new_assignment)
        db.commit()
        db.refresh(new_assignment)
        
        # Calculate initial positions.
        const_horizontal_gap = 250
        const_vertical_gap = 100
        
        # Store main steps and their substeps in a list.
        top_steps = []
        steps = workflow.get("steps", [])
        for idx, step in enumerate(steps):
            # For main steps, position_x is determined by index and y is 0.
            main_x = idx * const_horizontal_gap
            main_y = 0
            new_step = Step(
                assignment_id=new_assignment.id,
                content=step.get("content", ""),
                position_x=main_x,
                position_y=main_y,
                completed=False
            )
            db.add(new_step)
            db.flush()  # Ensure new_step.id is available.
            
            # For substeps, position them vertically below the main step.
            current_substeps = []
            substeps = step.get("substeps", [])
            for s_idx, sub in enumerate(substeps):
                sub_x = main_x  # For now, same x as parent.
                sub_y = (s_idx + 1) * const_vertical_gap
                new_substep = Step(
                    assignment_id=new_assignment.id,
                    parent_id=new_step.id,
                    content=sub.get("content", ""),
                    position_x=sub_x,
                    position_y=sub_y,
                    completed=False
                )
                db.add(new_substep)
                db.flush()
                current_substeps.append(new_substep)
            
            top_steps.append((new_step, current_substeps))
        
        # Create connection records.
        # 1. Connect main steps sequentially.
        for i in range(len(top_steps) - 1):
            current_step, _ = top_steps[i]
            next_step, _ = top_steps[i + 1]
            new_conn = Connection(
                assignment_id=new_assignment.id,
                from_step=current_step.id,
                to_step=next_step.id
            )
            db.add(new_conn)
        
        # 2. Connect substeps sequentially within each main step.
        for _, substeps in top_steps:
            if len(substeps) > 1:
                for j in range(len(substeps) - 1):
                    new_conn = Connection(
                        assignment_id=new_assignment.id,
                        from_step=substeps[j].id,
                        to_step=substeps[j + 1].id
                    )
                    db.add(new_conn)
        
        # 3. Create connection from parent to its first substep (if exists).
        for main, substeps in top_steps:
            if substeps:
                new_conn = Connection(
                    assignment_id=new_assignment.id,
                    from_step=main.id,
                    to_step=substeps[0].id
                )
                db.add(new_conn)
        
        db.commit()  # Commit all connection records.
        return {"message": "Assignment created successfully", "assignment_id": new_assignment.id}
    
    except Exception as e:
        print("Error in create_assignment endpoint:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/test-gpt")
def test_gpt(body: dict):
    """
    Temporary endpoint to test GPT integration.
    Expects a JSON body with key 'assignment_input' and returns the generated workflow.
    """
    assignment_input = body.get("assignment_input", "")
    workflow = generate_assignment_workflow(assignment_input)
    if not workflow:
        return {"error": "No response from GPT"}
    return workflow

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
