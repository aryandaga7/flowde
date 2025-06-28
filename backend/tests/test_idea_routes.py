from fastapi.testclient import TestClient
from main import app 

client = TestClient(app)

def test_clarify_idea():
    response = client.post("/api/idea/clarify")
    assert response.status_code == 200
    assert "questions" in response.json()

def test_generate_idea():
    response = client.post("/api/idea/generate")
    assert response.status_code == 200
    assert "nodes" in response.json()
    assert "edges" in response.json()
    assert "techStack" in response.json()

def test_node_details():
    response = client.post("/api/idea/node-details")
    assert response.status_code == 200
    assert "buildSteps" in response.json()
    assert "apiSpec" in response.json()

def test_message_idea():
    response = client.post(
        "/api/idea/message",
        json={"text": "Test message", "sessionId": None}
    )
    assert response.status_code == 200
    json_response = response.json()
    assert "assistant" in json_response
    assert "specMarkdown" in json_response
    assert json_response["assistant"] == "This is a mock response from Architect GPT."
    assert json_response["specMarkdown"] == "# Updated Spec\n- Change 1\n- Change 2"