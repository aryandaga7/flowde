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
# from routes.idea_routes import router as idea_router
from routes.assignment_routes import router as assignment_router
from routes.auth_routes import router as auth_router
from routes.dashboard_routes import router as dashboard_router
from routes.node_routes import router as node_router
from routes.chat_routes import router as chat_router
from routes.connection_routes import router as connection_router  # Import new connection router
from routes.idea_session_routes import router as idea_session_router  # Import idea session router
from routes.idea_message_routes import router as idea_message_router  # Import idea message router

# Import current user dependency
from auth.auth_dependencies import get_current_user

# Create all tables if they don't exist yet.
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://getflowde.com", "https://www.getflowde.com", 
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
# app.include_router(idea_router)
app.include_router(idea_session_router)  # Add the idea session router
app.include_router(idea_message_router)  # Add the idea message router


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