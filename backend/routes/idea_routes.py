# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# from typing import List, Dict, Any, Optional

# router = APIRouter()

# # Mock data models
# class ClarifyResponse(BaseModel):
#     questions: List[str]

# class GenerateResponse(BaseModel):
#     nodes: List[Dict[str, Any]]
#     edges: List[Dict[str, Any]]
#     techStack: List[str]

# class NodeDetailsResponse(BaseModel):
#     buildSteps: List[str]
#     apiSpec: Dict[str, Any]

# # Mock Architect GPT function
# async def mock_architect_gpt(text: str, current_spec: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
#     return {
#         "assistant": "This is a mock response from Architect GPT.",
#         "patches": [{"path": "/some/path", "op": "add", "value": "new_value"}],
#         "specMarkdown": "# Updated Spec\n- Change 1\n- Change 2"
#     }

# # Pydantic model for the request
# class MessageRequest(BaseModel):
#     sessionId: Optional[str]
#     text: str

# # Pydantic model for the response
# class MessageResponse(BaseModel):
#     assistant: str
#     specMarkdown: str

# # POST /api/idea/clarify
# @router.post("/api/idea/clarify", response_model=ClarifyResponse)
# async def clarify_idea():
#     return {"questions": ["What is the main goal?", "Who is the target audience?"]}

# # POST /api/idea/generate
# @router.post("/api/idea/generate", response_model=GenerateResponse)
# async def generate_idea():
#     return {
#         "nodes": [{"id": "1", "name": "Start", "type": "UI"}],
#         "edges": [{"source": "1", "target": "2", "type": "data_flow"}],
#         "techStack": ["Python", "FastAPI"]
#     }

# # POST /api/idea/node-details
# @router.post("/api/idea/node-details", response_model=NodeDetailsResponse)
# async def node_details():
#     return {
#         "buildSteps": ["Step 1: Define requirements", "Step 2: Design UI"],
#         "apiSpec": {"endpoint": "/api/idea", "method": "POST"}
#     }

# # POST /api/idea/message
# @router.post("/api/idea/message", response_model=MessageResponse)
# async def message_idea(request: MessageRequest):
#     # Store user message (mock implementation)
#     user_message = request.text
    
#     # Call the mock Architect GPT function
#     result = await mock_architect_gpt(request.text)
    
#     # Store assistant message and spec changes (mock implementation)
#     assistant_message = result["assistant"]
#     spec_changes = result["patches"]
    
#     # Return the response
#     return {
#         "assistant": assistant_message,
#         "specMarkdown": result["specMarkdown"]
#     }