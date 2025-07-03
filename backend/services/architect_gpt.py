from openai import AsyncOpenAI
import os
import json
import asyncio
from typing import Dict, List, Optional, Tuple
from tenacity import retry, stop_after_attempt, wait_exponential
from core.config import OPENAI_API_KEY
from services.prompt_config import (
    get_section_guidelines, 
    get_formatting_rules, 
    get_relevant_guidelines,
    get_change_communication_rules,
    get_skill_level_adaptation,
    format_change_summary
)
import re

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

def format_message_history(messages: List[Dict[str, str]], k: int = 5) -> str:
    """Format the last k messages into a string for context."""
    if not messages:
        return ""
    
    # Take last k messages
    recent_messages = messages[-k:]
    formatted = "\nRecent Conversation:\n"
    
    for msg in recent_messages:
        formatted += f"User: {msg['user_message']}\n"
        if msg.get('bot_response'):
            formatted += f"Assistant: {msg['bot_response']}\n"
        if msg.get('spec_markdown'):
            formatted += f"[Spec Update]\n"
    
    return formatted

SYSTEM_PROMPT = """You are ArchitectGPT, an expert system architect helping users design technical specifications that can be converted into actionable development roadmaps.

CORE RESPONSIBILITIES:
• Help users create comprehensive technical specifications
• Adapt guidance to user skill level (CS student to senior developer)
• Maintain clear markdown structure optimized for roadmap generation
• Provide detailed change communication (Phase 1 requirement)
• Consider implementation complexity and timeline implications

RESPONSE WORKFLOW:
1. Analyze user input and current specification
2. Determine what sections need updates
3. Update sections with roadmap-friendly content
4. Generate clear change summary with specific actions taken
5. Return structured response with assistant message and updated spec

CHANGE COMMUNICATION (CRITICAL):
Always explain what you changed using this format:
- ✅ **Added**: [Section] - [What was added and why]
- 🔄 **Updated**: [Section] - [What was changed and why]  
- 📝 **Refined**: [Section] - [How it was improved]
- 🔧 **Restructured**: [Section] - [How it was reorganized]

SECTION QUALITY STANDARDS:
• Vision & Outcome: Must include success metrics for roadmap milestones
• Core Features: Must have priority levels [HIGH/MEDIUM/LOW PRIORITY]
• Tech Stack: Must include complexity indicators and reasoning
• Extensions: Must be organized by implementation phases
• Open Questions: Must identify implementation blockers

ROADMAP PREPARATION:
• Include implementation complexity estimates
• Mark features by development priority
• Consider skill requirements for technology choices
• Identify dependencies and potential blockers
• Suggest MVP vs future feature distinctions

SKILL LEVEL ADAPTATION:
• Beginner: Focus on learning-friendly technologies, include tutorials/resources
• Intermediate: Balance learning with productivity, provide architectural reasoning
• Advanced: Optimize for scalability, consider enterprise concerns

RESPONSE FORMAT:
{
    "assistant_msg": "Clear explanation of changes made with emoji indicators",
    "spec_markdown": "Complete specification with all sections",
    "updated_sections": ["List of section names that were modified"],
    "suggested_title": "Project title (first message only)",
    "context_summary": "Updated on significant scope changes",
    "changes_made": [{"type": "added|updated|refined", "section": "Section Name", "description": "What changed"}]
}"""

def get_dynamic_guidelines(spec_markdown: str, user_msg: str, skill_level: str = "intermediate") -> str:
    """
    Determine which section guidelines to include based on context and skill level.
    """
    # Get skill-level specific adaptations
    skill_adaptation = get_skill_level_adaptation(skill_level)
    
    # Default to including all guidelines for first message
    if not spec_markdown:
        guidelines_text = "\n\nSECTION GUIDELINES:\n" + "\n".join(
            f"• {section}: {guidelines['description']}\n  Roadmap Relevance: {guidelines.get('roadmap_relevance', 'N/A')}"
            for section, guidelines in get_section_guidelines().items()
        )
        
        # Add skill level guidance
        guidelines_text += f"\n\nSKILL LEVEL ADAPTATION ({skill_level.upper()}):\n"
        guidelines_text += f"• Focus: {', '.join(skill_adaptation['focus'])}\n"
        guidelines_text += f"• Complexity Preference: {skill_adaptation['complexity_preference']}\n"
        
        return guidelines_text
    
    # Find sections mentioned in user message or marked as _TODO
    relevant_sections = []
    
    # Check user message for section mentions
    for section in get_formatting_rules()["content"]["section_order"]:
        if section.lower() in user_msg.lower():
            relevant_sections.append(section)
    
    # Check spec for _TODO sections
    for section in get_formatting_rules()["content"]["section_order"]:
        if f"## {section}" in spec_markdown and "_TODO" in spec_markdown.split(f"## {section}")[1].split("##")[0]:
            relevant_sections.append(section)
    
    if not relevant_sections:
        return f"\n\nSKILL LEVEL: {skill_level.upper()} - {skill_adaptation['complexity_preference']}"
    
    # Get guidelines only for relevant sections
    guidelines = get_relevant_guidelines(relevant_sections)
    if not guidelines:
        return f"\n\nSKILL LEVEL: {skill_level.upper()} - {skill_adaptation['complexity_preference']}"
    
    guidelines_text = "\n\nRELEVANT SECTION GUIDELINES:\n" + "\n".join(
        f"• {section}: {guide['description']}\n  Roadmap Relevance: {guide.get('roadmap_relevance', 'N/A')}"
        for section, guide in guidelines.items()
    )
    
    guidelines_text += f"\n\nSKILL LEVEL: {skill_level.upper()} - {skill_adaptation['complexity_preference']}"
    
    return guidelines_text

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry_error_callback=lambda retry_state: {"error": str(retry_state.outcome.exception())}
)
async def call_architect_gpt(
    spec_markdown: str,
    user_msg: str,
    session_id: Optional[str] = None,
    is_first_message: bool = False,
    context_summary: Optional[str] = None,
    message_history: Optional[List[Dict[str, str]]] = None,
    skill_level: str = "intermediate"
) -> Dict:
    """
    Call GPT-4 to process user input and update the technical specification.
    
    Args:
        spec_markdown (str): Current markdown specification
        user_msg (str): User's message
        session_id (Optional[str]): Session ID for context
        is_first_message (bool): Whether this is the first message in the session
        context_summary (Optional[str]): Current context summary of the project
        message_history (Optional[List[Dict]]): List of previous messages with their responses
        skill_level (str): User skill level for adaptation (beginner/intermediate/advanced)
    
    Returns:
        Dict with keys:
        - assistant_msg (str): GPT's response with change communication
        - spec_markdown (str): Complete updated markdown
        - updated_sections (List[str]): List of sections that were modified
        - suggested_title (str|None): Suggested project title (only for first message)
        - context_summary (str|None): Updated context summary (only if significant changes)
        - changes_made (List[Dict]): Structured list of changes for future use
    """
    try:
        # Prepare the context information
        context_info = f"Project Context:\n{context_summary}\n\n" if context_summary else ""
        
        # Add message history if available
        conversation_history = format_message_history(message_history) if message_history else ""
        
        # Get dynamic section guidelines with skill level adaptation
        dynamic_guidelines = get_dynamic_guidelines(spec_markdown, user_msg, skill_level)
        
        # Add change communication rules
        change_rules = get_change_communication_rules()
        change_guidance = f"\n\nCHANGE COMMUNICATION RULES:\n"
        for change_type, details in change_rules["change_types"].items():
            change_guidance += f"• {details['emoji']} {details['verb']}: {details['description']}\n"

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + dynamic_guidelines + change_guidance},
            {"role": "user", "content": (
                f"{context_info}"
                f"Current Specification:\n\n{spec_markdown}\n\n"
                f"{conversation_history}"
                f"User Message: {user_msg}\n\n"
                f"Skill Level: {skill_level.upper()}\n\n"
                f"{'This is the first message for this project. Please suggest a title, provide an initial context summary, and explain what sections you created.' if is_first_message else 'Please explain exactly what you changed and why.'}"
            )}
        ]

        response = await client.chat.completions.create(
            model="gpt-4o-mini",  # Using mini for testing
            messages=messages,
            temperature=0.7,
            max_tokens=2500  # Increased for change communication
        )

        # Extract and parse the response
        content = response.choices[0].message.content
        print(content)
        try:
            # Try to parse as JSON first
            result = json.loads(content)
            
            # Validate response format
            if not isinstance(result.get("assistant_msg"), str):
                raise ValueError("assistant_msg must be a string")
            if not isinstance(result.get("spec_markdown"), str):
                raise ValueError("spec_markdown must be a string")
            if not isinstance(result.get("updated_sections"), list):
                # If updated_sections is missing or not a list, extract from spec changes
                updated = []
                # Try to extract from assistant message mentions
                assistant_msg = result.get("assistant_msg", "")
                for section in get_formatting_rules()["content"]["section_order"]:
                    if section in assistant_msg:
                        updated.append(section)
                result["updated_sections"] = updated

            # Handle suggested_title
            if is_first_message and not isinstance(result.get("suggested_title"), str):
                # Try to extract title from markdown if not provided
                match = re.search(r"# ([^\n]+)", result["spec_markdown"])
                result["suggested_title"] = match.group(1) if match else "New Project"
            elif not is_first_message:
                result["suggested_title"] = None
            
            # Handle context_summary
            if not isinstance(result.get("context_summary"), str):
                result["context_summary"] = None
            
            # Handle changes_made (new for Phase 1)
            if not isinstance(result.get("changes_made"), list):
                result["changes_made"] = []
            
            return result
            
        except json.JSONDecodeError:
            # If the response isn't valid JSON, extract what looks like the message
            # and return it without spec updates
            return {
                "assistant_msg": content,
                "spec_markdown": spec_markdown,
                "updated_sections": [],
                "suggested_title": None,
                "context_summary": None,
                "changes_made": []
            }
        except ValueError as e:
            print(f"Invalid response format: {str(e)}")
            return {
                "assistant_msg": "I apologize, but I encountered an error in processing the specification updates. Let me know if you'd like me to try again.",
                "spec_markdown": spec_markdown,
                "updated_sections": [],
                "suggested_title": None,
                "context_summary": None,
                "changes_made": []
            }

    except Exception as e:
        print(f"Error in call_architect_gpt: {str(e)}")
        return {
            "assistant_msg": "I apologize, but I encountered an error processing your request. Please try again.",
            "spec_markdown": spec_markdown,
            "updated_sections": [],
            "suggested_title": None,
            "context_summary": None,
            "changes_made": []
        } 