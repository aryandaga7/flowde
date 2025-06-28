from openai import AsyncOpenAI
import os
import json
import asyncio
from typing import Dict, List, Optional
from tenacity import retry, stop_after_attempt, wait_exponential
from core.config import OPENAI_API_KEY

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = """You are ArchitectGPT, an expert system architect helping users design technical systems.
Your role is to help users refine and expand their technical specifications while maintaining a clear markdown structure.

When responding:
1. Keep your assistant_msg concise and focused - do not include markdown formatting in it
2. Generate specific JSON patches to update the spec when needed
3. Keep the spec well-organized and properly formatted in markdown

The spec should maintain this exact section order:
1. System Overview
2. Core Features
3. Technical Architecture
4. Data Models
5. API Endpoints
6. UI/UX Components
7. Infrastructure

IMPORTANT PATCH GUIDELINES:
- Use exact section names in paths (e.g., "/Technical Architecture")
- When updating a section, use "replace" operation with the full section content
- When adding a new section, use "add" operation
- Paths must match existing structure exactly

Return format must be valid JSON with:
{
    "assistant_msg": "Your response to the user (NO markdown formatting)",
    "patches": [
        {
            "op": "add|replace|remove",
            "path": "/Section Name",
            "value": "Section content in markdown format"
        }
    ]
}"""

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry_error_callback=lambda retry_state: {"error": str(retry_state.outcome.exception())}
)
async def call_architect_gpt(
    spec_markdown: str,
    user_msg: str,
    session_id: Optional[str] = None
) -> Dict:
    """
    Call GPT-4 to process user input and update the technical specification.
    
    Args:
        spec_markdown (str): Current markdown specification
        user_msg (str): User's message
        session_id (Optional[str]): Session ID for context
    
    Returns:
        Dict with keys:
        - assistant_msg (str): GPT's response
        - patches (List[Dict]): JSON patches to apply to spec
    """
    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Current Specification:\n\n{spec_markdown}\n\nUser Message: {user_msg}"}
        ]

        response = await client.chat.completions.create(
            model="gpt-4o-mini",  # Using mini for testing
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )

        # Extract and parse the response
        content = response.choices[0].message.content
        try:
            # Try to parse as JSON first
            result = json.loads(content)
            
            # Validate response format
            if not isinstance(result.get("assistant_msg"), str):
                raise ValueError("assistant_msg must be a string")
            if not isinstance(result.get("patches"), list):
                raise ValueError("patches must be a list")
                
            # Ensure patches have required fields
            for patch in result.get("patches", []):
                if not isinstance(patch, dict):
                    raise ValueError("Each patch must be a dictionary")
                if "op" not in patch or "path" not in patch:
                    raise ValueError("Patches must have 'op' and 'path' fields")
                if patch["op"] in ["add", "replace"] and "value" not in patch:
                    raise ValueError("Add/replace operations must have a 'value' field")
            
            return result
            
        except json.JSONDecodeError:
            # If the response isn't valid JSON, extract what looks like the message
            # and return it without patches
            return {
                "assistant_msg": content,
                "patches": []
            }
        except ValueError as e:
            print(f"Invalid response format: {str(e)}")
            return {
                "assistant_msg": "I apologize, but I encountered an error in processing the specification updates. Let me know if you'd like me to try again.",
                "patches": []
            }

    except Exception as e:
        print(f"Error in call_architect_gpt: {str(e)}")
        return {
            "assistant_msg": "I apologize, but I encountered an error processing your request. Please try again.",
            "patches": []
        } 