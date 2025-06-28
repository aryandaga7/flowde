import json
import jsonpatch
import re
from typing import List, Dict, Optional

def markdown_to_json(markdown: str) -> Dict:
    """
    Convert markdown spec to a JSON structure.
    Handles headers as paths and content as values.
    """
    result = {}
    current_path = []
    current_content = []
    lines = markdown.split('\n')
    
    for line in lines:
        # Skip empty lines
        if not line.strip():
            continue
            
        # Check if it's a header
        header_match = re.match(r'^(#{1,6})\s+(.+)$', line)
        if header_match:
            # Save any accumulated content for the previous section
            if current_path:
                temp = result
                for part in current_path[:-1]:
                    if part not in temp:
                        temp[part] = {}
                    temp = temp[part]
                temp[current_path[-1]] = {
                    "content": "".join(current_content),
                    "order": len(current_path)
                }
                current_content = []
            
            level = len(header_match.group(1))
            title = header_match.group(2).strip()
            
            # Adjust current path based on header level
            current_path = current_path[:level-1]
            current_path.append(title)
            
            # Ensure path exists in result
            temp = result
            for part in current_path[:-1]:
                if part not in temp:
                    temp[part] = {}
                temp = temp[part]
            if current_path[-1] not in temp:
                temp[current_path[-1]] = {
                    "content": "",
                    "order": len(current_path)
                }
        else:
            # Add content to current section
            if current_path:
                current_content.append(line.strip() + "\n")
    
    # Don't forget to save content for the last section
    if current_path and current_content:
        temp = result
        for part in current_path[:-1]:
            if part not in temp:
                temp[part] = {}
            temp = temp[part]
        temp[current_path[-1]] = {
            "content": "".join(current_content),
            "order": len(current_path)
        }
    
    return result

def json_to_markdown(json_spec: Dict, level: int = 1) -> str:
    """
    Convert JSON structure back to markdown.
    """
    markdown = []
    
    # Sort sections by order if available
    items = sorted(
        json_spec.items(),
        key=lambda x: x[1].get("order", float('inf')) if isinstance(x[1], dict) else float('inf')
    )
    
    for key, value in items:
        # Add header
        markdown.append(f"{'#' * level} {key}\n")
        
        # Add content
        if isinstance(value, dict):
            if "content" in value:
                content = value["content"].strip()
                if content:
                    markdown.append(f"{content}\n")
            else:
                markdown.append(json_to_markdown(value, level + 1))
        
        markdown.append("\n")
    
    return "".join(markdown)

def apply_json_patches_to_spec(spec_markdown: str, patches: List[Dict]) -> str:
    """
    Apply JSON patches to a markdown specification.
    
    Args:
        spec_markdown (str): Current markdown specification
        patches (List[Dict]): List of JSON patch operations
        
    Returns:
        str: Updated markdown specification
    """
    try:
        # Convert markdown to JSON structure
        spec_json = markdown_to_json(spec_markdown)
        
        # Pre-process patches to ensure parent paths exist and handle content field
        for patch in patches:
            if patch["op"] in ["add", "replace"]:
                # Clean up the path - remove leading/trailing slashes and split
                path = patch["path"].strip("/")
                
                # If it's a root-level section, create/update it directly
                if "/" not in path:
                    if patch["op"] == "add" and path not in spec_json:
                        spec_json[path] = {
                            "content": patch["value"],
                            "order": get_section_order(path)
                        }
                    elif patch["op"] == "replace":
                        if path not in spec_json:
                            print(f"Warning: Cannot replace non-existent section '{path}'. Creating it instead.")
                        spec_json[path] = {
                            "content": patch["value"],
                            "order": get_section_order(path)
                        }
                    continue
                
                # For nested paths, create parent sections if needed
                path_parts = path.split("/")
                current = spec_json
                current_path = ""
                
                # Process all parts except the last one
                for part in path_parts[:-1]:
                    if part not in current:
                        current[part] = {
                            "content": "",
                            "order": get_section_order(part)
                        }
                    current = current[part]
                
                # Handle the final part
                last_part = path_parts[-1]
                if patch["op"] == "add":
                    current[last_part] = {
                        "content": patch["value"],
                        "order": get_section_order(last_part)
                    }
                elif patch["op"] == "replace":
                    if last_part not in current:
                        print(f"Warning: Cannot replace non-existent section '{last_part}'. Creating it instead.")
                    current[last_part] = {
                        "content": patch["value"],
                        "order": get_section_order(last_part)
                    }
        
        # Convert back to markdown
        return json_to_markdown(spec_json)
        
    except Exception as e:
        print(f"Error applying patches: {str(e)}")
        # Return original markdown if patching fails
        return spec_markdown

def get_section_order(section_name: str) -> int:
    """Get the standard order for a section."""
    order_map = {
        "System Overview": 1,
        "Core Features": 2,
        "Technical Architecture": 3,
        "Data Models": 4,
        "API Endpoints": 5,
        "UI/UX Components": 6,
        "Infrastructure": 7
    }
    return order_map.get(section_name, 99)  # Default to end for unknown sections 