import openai
import os
import json
import re
from core.config import OPENAI_API_KEY

# Set your OpenAI API key from an environment variable for security.
openai.api_key = OPENAI_API_KEY

def generate_assignment_chat_response(question: str, assignment_title: str, assignment_description: str, recent_messages: list) -> str:
    """
    Builds context for an assignment-level chat message and returns GPT's response.
    
    Parameters:
      question (str): The user's question.
      assignment_title (str): The title of the assignment.
      assignment_description (str): The assignment description.
      recent_messages (list): A list of recent ChatMessage objects (dictionaries) without a step_id.
      
    Returns:
      str: GPT's response text.
    """
    # Build context string
    context = f"Assignment Title: {assignment_title}\nAssignment Description: {assignment_description}\nRecent Conversation:\n"
    for msg in recent_messages:
        context += f"User: {msg.user_message}\nBot: {msg.bot_response or 'No response yet'}\n"
    context += f"\nUser Question: {question}\n"
    
    prompt = (
        f"Based on the following context:\n{context}\n"
        "Provide a clear and helpful answer to the user's question."
    )
    
    response = openai.chat.completions.create(
        model="gpt-4o-mini",  # or your desired model
        messages=[{"role": "system", "content": "You are an expert academic assistant."},
                  {"role": "user", "content": prompt}],
        temperature=0.6,
        max_tokens=10000
    )
    reply = response.choices[0].message.content.strip()
    return reply

def generate_node_chat_response(question: str, assignment_title: str, assignment_description: str, node_content: str, recent_node_messages: list) -> str:
    """
    Builds context for a node-specific chat message and returns GPT's response.
    
    Parameters:
      question (str): The user's question.
      assignment_title (str): The title of the assignment.
      assignment_description (str): The assignment description.
      node_content (str): The content of the node.
      recent_node_messages (list): A list of recent ChatMessage objects (dictionaries) for this node.
      
    Returns:
      str: GPT's response text.
    """
    context = (
        f"Assignment Title: {assignment_title}\n"
        f"Assignment Description: {assignment_description}\n"
        f"Node Content: {node_content}\n"
        "Recent Node Conversation:\n"
    )
    for msg in recent_node_messages:
        context += f"User: {msg.user_message}\nBot: {msg.bot_response or 'No response yet'}\n"
    context += f"\nUser Question: {question}\n"
    
    prompt = (
        f"Given the context:\n{context}\n"
        "Provide a detailed, clear response that addresses the user's question about the node."
    )
    
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": "You are an expert academic assistant."},
                  {"role": "user", "content": prompt}],
        temperature=0.6,
        max_tokens=10000
    )
    reply = response.choices[0].message.content.strip()
    return reply
