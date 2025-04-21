import openai
import os
import json
import re
from core.config import OPENAI_API_KEY

# Set your OpenAI API key from an environment variable for security.
openai.api_key = OPENAI_API_KEY

def generate_assignment_workflow(assignment_input: str) -> dict:
    """
    Sends a prompt to GPT-4 to extract and structure assignment details.
    
    The output JSON will contain:
      - title: Title of the assignment.
      - due_date: The due date in '%Y-%m-%d' format(if provided, otherwise null).
      - description: A detailed description of the assignment.
      - steps: A list of steps, where each step can have an optional substeps array.
    
    Parameters:
      assignment_input (str): The combined text input including assignment details and any resources.
    
    Returns:
      dict: Parsed JSON data with the assignment workflow, or None if parsing fails.
    """
    
    # Construct prompt messages
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert academic assistant. Your task is to analyze a student's assignment input and "
                "extract the following details in strict JSON format with no extra text: "
                "'title', 'due_date' (if available, otherwise null), 'description', and 'steps'. "
                "The 'steps' should be an array of objects. Each step object must include an 'id', 'content', "
                "and include a 'substeps' array (with each substep having an 'id' and 'content')."
            )
        },
        {
            "role": "user",
            "content": (
                f"Assignment and resources: {assignment_input}\n\n"
                "Please extract the assignment details with great detail and external resources to help the student complete his assignment and structure the information as specified."
            )
        }
    ]
    
    try:
        # Call GPT-4 API using the ChatCompletion endpoint
        response = openai.chat.completions.create(
            model="gpt-4o-mini",  # Replace with your intended model if needed
            messages=messages,
            temperature=0.6,
            max_tokens=1500
        )
        
        # Extract the output text from GPT-4's response and strip any leading/trailing spaces
        output_text = response.choices[0].message.content.strip()
        print(output_text)
        
        try:
            # First attempt to parse the output directly as JSON
            assignment_data = json.loads(output_text)
            return assignment_data
        except Exception as e:
            print("Direct JSON parsing failed:", e)
            # Try to salvage JSON by extracting the first and last curly braces
            start = output_text.find("{")
            end = output_text.rfind("}")
            if start != -1 and end != -1 and end > start:
                trimmed_text = output_text[start:end+1]
                try:
                    assignment_data = json.loads(trimmed_text)
                    return assignment_data
                except Exception as e2:
                    print("Salvaged JSON parsing failed:", e2)
                    # Optionally, you could try more advanced cleaning here, e.g., using regex
                    # For now, we return None to indicate failure
                    return None
            else:
                print("No JSON object found in GPT response")
                return None

    except Exception as e:
        # If an error occurs (API error or JSON parsing error), print it for debugging
        print(f"Error during GPT-4 API call or JSON parsing: {e}")
        return None