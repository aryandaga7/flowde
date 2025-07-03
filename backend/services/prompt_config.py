"""Configuration file for ArchitectGPT prompts and guidelines."""

from typing import Optional, Dict, List

SECTION_GUIDELINES = {
    "Vision & Outcome": {
        "description": "High-level goals, expected impact, and key benefits",
        "required_elements": [
            "Project purpose",
            "Target users/audience",
            "Expected benefits/impact",
            "Success metrics (for roadmap planning)"
        ],
        "example_format": """## Vision & Outcome
• Primary Goal: [Clear statement of main objective]
• Target Users: [User types and their needs]
• Key Benefits: [List of main benefits]
• Success Metrics: [How you'll measure success]""",
        "roadmap_relevance": "Defines project scope and end goals for implementation planning"
    },
    "Core Features": {
        "description": "Key functionality, capabilities, and user interactions",
        "required_elements": [
            "Main features with priority levels",
            "User interactions and workflows",
            "Core capabilities",
            "MVP vs future features distinction"
        ],
        "example_format": """## Core Features
• [HIGH PRIORITY] Feature 1: [Description and purpose]
• [MEDIUM PRIORITY] Feature 2: [Description and purpose]
• [LOW PRIORITY/FUTURE] Feature 3: [Description and purpose]""",
        "roadmap_relevance": "Determines implementation order and development phases"
    },
    "Tech Stack": {
        "description": "Technologies, tools, and architectural decisions with complexity notes",
        "required_elements": [
            "Frontend technology with reasoning",
            "Backend technology with reasoning",
            "Database with reasoning",
            "Key libraries/frameworks",
            "Complexity/difficulty indicators"
        ],
        "example_format": """## Tech Stack
• Frontend: [Technology] - [Reasoning] - [Complexity: Beginner/Intermediate/Advanced]
• Backend: [Technology] - [Reasoning] - [Complexity: Beginner/Intermediate/Advanced]
• Database: [Solution] - [Reasoning]
• Key Tools: [Libraries/frameworks with learning curve notes]""",
        "roadmap_relevance": "Influences development time estimates and skill requirements"
    },
    "Extensions": {
        "description": "Additional features and considerations with implementation phases",
        "rules": [
            "Each item needs its own subheading",
            "No floating content without headers",
            "Include complexity and timing estimates",
            "Mark as Phase 2, Phase 3, etc."
        ],
        "categories": [
            "Security & Privacy",
            "Authentication",
            "Scalability",
            "Monetization",
            "Social Features",
            "Advanced Analytics"
        ],
        "roadmap_relevance": "Defines post-MVP development phases"
    },
    "Open Questions": {
        "description": "Critical missing information that blocks implementation",
        "criteria": [
            "Required for core functionality",
            "Cannot be assumed from context",
            "Impacts implementation timeline",
            "Affects architectural decisions"
        ],
        "roadmap_relevance": "Identifies research/decision points in development timeline"
    }
}

# NEW: Change communication framework for Phase 1
CHANGE_COMMUNICATION = {
    "change_types": {
        "added": {
            "emoji": "✅",
            "verb": "Added",
            "description": "New content or sections created"
        },
        "updated": {
            "emoji": "🔄",
            "verb": "Updated",
            "description": "Existing content modified or enhanced"
        },
        "refined": {
            "emoji": "📝",
            "verb": "Refined",
            "description": "Clarified or improved existing content"
        },
        "restructured": {
            "emoji": "🔧",
            "verb": "Restructured",
            "description": "Reorganized or reformatted content"
        }
    },
    "summary_format": """**Changes Made:**
{change_list}

**Impact:** {impact_summary}""",
    "change_item_format": "{emoji} **{verb}**: {section_name} - {description}"
}

# NEW: Skill level adaptation
SKILL_LEVEL_ADAPTATIONS = {
    "beginner": {
        "description": "CS student or new developer",
        "focus": [
            "Include learning resources and tutorials",
            "Suggest simpler technologies with good documentation",
            "Provide step-by-step guidance",
            "Highlight common pitfalls"
        ],
        "complexity_preference": "Prioritize learning and simplicity"
    },
    "intermediate": {
        "description": "Developer with 1-3 years experience",
        "focus": [
            "Balance learning with productivity",
            "Include some stretch technologies",
            "Provide architectural reasoning",
            "Consider best practices"
        ],
        "complexity_preference": "Moderate complexity with growth opportunities"
    },
    "advanced": {
        "description": "Senior developer or architect",
        "focus": [
            "Focus on scalability and maintainability",
            "Consider cutting-edge technologies",
            "Include performance considerations",
            "Address enterprise concerns"
        ],
        "complexity_preference": "Optimize for production readiness"
    }
}

FORMATTING_RULES = {
    "markdown": {
        "headers": {
            "main_sections": "## Section Name",
            "subsections": "### Subsection Name"
        },
        "lists": {
            "bullet": "• Item",
            "numbered": "1. Item"
        },
        "priority_indicators": {
            "high": "[HIGH PRIORITY]",
            "medium": "[MEDIUM PRIORITY]",
            "low": "[LOW PRIORITY/FUTURE]"
        },
        "complexity_indicators": {
            "beginner": "[Beginner-Friendly]",
            "intermediate": "[Intermediate]",
            "advanced": "[Advanced]"
        }
    },
    "content": {
        "todo_marker": "_TODO",
        "section_order": ["Vision & Outcome", "Core Features", "Tech Stack", "Extensions", "Open Questions"]
    }
}

def get_section_guidelines(section_name: Optional[str] = None) -> dict:
    """
    Get guidelines for sections.
    
    Args:
        section_name: Optional[str] - If provided, returns guidelines for specific section.
                                    If None, returns all section guidelines.
    """
    if section_name is None:
        return SECTION_GUIDELINES
    return SECTION_GUIDELINES.get(section_name, {})

def get_formatting_rules() -> dict:
    """Get all formatting rules."""
    return FORMATTING_RULES

def get_relevant_guidelines(sections: list[str]) -> dict:
    """Get guidelines only for specified sections."""
    return {
        section: SECTION_GUIDELINES[section]
        for section in sections
        if section in SECTION_GUIDELINES
    }

def get_change_communication_rules() -> dict:
    """Get change communication framework for Phase 1."""
    return CHANGE_COMMUNICATION

def get_skill_level_adaptation(level: str = "intermediate") -> dict:
    """Get skill level specific adaptations."""
    return SKILL_LEVEL_ADAPTATIONS.get(level, SKILL_LEVEL_ADAPTATIONS["intermediate"])

def format_change_summary(changes: List[Dict[str, str]]) -> str:
    """
    Format change summary for assistant message.
    
    Args:
        changes: List of dicts with 'type', 'section', 'description' keys
    
    Returns:
        Formatted change summary string
    """
    if not changes:
        return ""
    
    change_rules = get_change_communication_rules()
    change_items = []
    
    for change in changes:
        change_type = change_rules["change_types"].get(change["type"], change_rules["change_types"]["updated"])
        item = change_rules["change_item_format"].format(
            emoji=change_type["emoji"],
            verb=change_type["verb"],
            section_name=change["section"],
            description=change["description"]
        )
        change_items.append(item)
    
    return change_rules["summary_format"].format(
        change_list="\n".join(change_items),
        impact_summary=f"Enhanced specification with {len(changes)} improvements"
    ) 