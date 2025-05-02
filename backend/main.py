from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import SessionLocal, engine, Base
from models.models import Assignment, Step, Connection, User
from services.gpt_workflow import generate_assignment_workflow
from datetime import datetime
import uvicorn
import asyncio
from typing import List, Optional
import os
import tempfile
import PyPDF2
import shutil

# Import routers
from routes.assignment_routes import router as assignment_router
from routes.auth_routes import router as auth_router
from routes.dashboard_routes import router as dashboard_router
from routes.node_routes import router as node_router
from routes.chat_routes import router as chat_router
from routes.connection_routes import router as connection_router  # Import new connection router

# Import current user dependency
from auth.auth_dependencies import get_current_user

# Create all tables if they don't exist yet.
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",  "https://getflowde.com", "https://www.getflowde.com", 
                   "https://flowde-frontend-54bud7wl2-aryan-dagas-projects-c1a7f340.vercel.app",
                   "https://assignment-workflow-mocha.vercel.app"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# Include routers
app.include_router(assignment_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(node_router)
app.include_router(chat_router)
app.include_router(connection_router)  # Add the new connection router


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
async def create_assignment(
    request: AssignmentRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        # Generate a workflow from GPT.
        workflow = await generate_assignment_workflow(request.assignment_input)
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

@app.post("/create-assignment-with-files")
async def create_assignment_with_files(
    assignment_input: str = Form(...),
    pdf_only: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Debug logging
        print(f"Received request. Assignment input length: {len(assignment_input)}")
        print(f"PDF only flag: {pdf_only}")
        print(f"Files received: {files}")
        
        # Check if files were provided
        if not files or len(files) == 0:
            print("No files were uploaded")
            # If no files but we have text input, proceed with just the text
            if assignment_input.strip() and pdf_only != 'true':
                print("Continuing with text input only")
                workflow = await generate_assignment_workflow(assignment_input)
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
            else:
                raise HTTPException(status_code=400, detail="No PDF files were uploaded")
        
        # Extract text from PDF files
        extracted_text = ""
        processed_files = []
        
        for file in files:
            print(f"Processing file: {file.filename}, content_type: {file.content_type}")
            if file.filename.endswith('.pdf'):
                processed_files.append(file.filename)
                try:
                    # Create a temporary file
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                        # Reset file pointer and read content
                        await file.seek(0)
                        content = await file.read()
                        # Write content to temporary file
                        temp_file.write(content)
                        temp_path = temp_file.name
                    
                    print(f"Temporary file created at: {temp_path}")
                    
                    # Extract text using PyPDF2
                    try:
                        with open(temp_path, 'rb') as pdf_file:
                            try:
                                # Create PDF reader
                                pdf_reader = PyPDF2.PdfReader(pdf_file)
                                print(f"PDF has {len(pdf_reader.pages)} pages")
                                
                                # Extract text from each page
                                for page_num in range(len(pdf_reader.pages)):
                                    page = pdf_reader.pages[page_num]
                                    page_text = page.extract_text()
                                    if page_text:
                                        extracted_text += page_text + "\n\n"
                                        print(f"Extracted {len(page_text)} characters from page {page_num+1}")
                                    else:
                                        print(f"No text extracted from page {page_num+1}")
                            except Exception as e:
                                print(f"PyPDF2 error: {str(e)}")
                                
                                # If PyPDF2 fails, try with pdfplumber if available
                                try:
                                    import pdfplumber
                                    with pdfplumber.open(temp_path) as pdf:
                                        for i, page in enumerate(pdf.pages):
                                            page_text = page.extract_text()
                                            if page_text:
                                                extracted_text += page_text + "\n\n"
                                                print(f"pdfplumber: Extracted {len(page_text)} characters from page {i+1}")
                                except ImportError:
                                    print("pdfplumber not available")
                    except Exception as e:
                        print(f"Error reading PDF: {str(e)}")
                    finally:
                        # Clean up the temporary file
                        try:
                            os.unlink(temp_path)
                            print(f"Deleted temporary file: {temp_path}")
                        except Exception as e:
                            print(f"Error deleting temporary file: {str(e)}")
                except Exception as e:
                    print(f"Error processing file {file.filename}: {str(e)}")
        
        # Check if we extracted any text
        print(f"Total extracted text length: {len(extracted_text)}")
        if len(extracted_text) > 0:
            print(f"First 200 chars: {extracted_text[:200]}")
        else:
            print("No text extracted from any PDF")
            extracted_text = "Unable to extract text from the uploaded PDFs."
        
        # Combine the extracted text with the user's input
        if pdf_only == 'true' or not assignment_input.strip():
            combined_input = f"Create an assignment based on the following PDF content:\n\n{extracted_text}"
        else:
            combined_input = f"{assignment_input}\n\nAdditional context from uploaded PDFs:\n\n{extracted_text}"
        
        print(f"Combined input length: {len(combined_input)}")
        
        # Generate a workflow from GPT
        workflow = await generate_assignment_workflow(combined_input)
        
        # Rest of your existing create_assignment logic
        if not workflow:
            raise HTTPException(status_code=500, detail="Failed to generate assignment workflow from GPT.")
        
        # Add file information to the description
        file_info = f"Assignment created from the following files: {', '.join(processed_files)}"
        description = workflow.get("description", "")
        workflow["description"] = f"{description}\n\n{file_info}"
        
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
        print("Error in create_assignment_with_files endpoint:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/test-pdf-extraction")
async def test_pdf_extraction(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        extracted_text = ""
        processed_files = []
        
        for file in files:
            if file.filename.endswith('.pdf'):
                processed_files.append(file.filename)
                with tempfile.NamedTemporaryFile(delete=False) as temp:
                    await file.seek(0)  # Reset file position
                    content = await file.read()
                    temp.write(content)
                    temp_path = temp.name
                
                try:
                    with open(temp_path, 'rb') as pdf_file:
                        pdf_reader = PyPDF2.PdfReader(pdf_file)
                        for page_num in range(len(pdf_reader.pages)):
                            page = pdf_reader.pages[page_num]
                            page_text = page.extract_text()
                            if page_text:
                                extracted_text += f"--- Page {page_num + 1} ---\n{page_text}\n\n"
                finally:
                    os.unlink(temp_path)
        
        return {
            "success": True,
            "processed_files": processed_files,
            "extracted_text_length": len(extracted_text),
            "extracted_text_preview": extracted_text[:1000] + ("..." if len(extracted_text) > 1000 else ""),
            "full_text": extracted_text
        }
    
    except Exception as e:
        print("Error in test-pdf-extraction endpoint:", e)
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

@app.get("/")
def read_root():
    return {"status": "online", "message": "Flowde API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)