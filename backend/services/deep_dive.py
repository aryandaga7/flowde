import openai
import os
import json
import re
import asyncio
from core.config import OPENAI_API_KEY
from openai import AsyncOpenAI
from services.embedder import chunk_text
from services.rag_retriever import retrieve_relevant_chunks
from core.database import SessionLocal

openai.api_key = OPENAI_API_KEY
client = AsyncOpenAI(api_key=openai.api_key)


async def generate_deep_dive_breakdown(node_context: str, extra_context: str = "") -> dict:
    """
    Build a prompt for deep dive breakdown and return a JSON-parsed response.
    For deep dive, we only request substeps (without positional data).
    """
    embedding_response = await client.embeddings.create(
        model="text-embedding-ada-002",
        input=node_context
    )
    query_embedding = embedding_response.data[0].embedding

    # Retrieve related context
    db = SessionLocal()
    retrieved_chunks = retrieve_relevant_chunks(query_embedding, db)
    if not retrieved_chunks:
        rag_context = "No relevant course notes found."
    else:
        rag_context = "\n\n".join(retrieved_chunks)
    db.close()
    # Suggested system prompt for deep_dive.py:
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert academic assistant providing detailed breakdowns of assignment steps. "
                "When a student wants to understand a step in more depth, you create a structured set of new substeps "
                "that help them complete that specific part of their assignment."
                "\n\n"
                "ALWAYS RETURN JSON-ONLY with NO additional text or explanation with this structure:"
                "{\n"
                "  \"new_steps\": [\n"
                "    { \"content\": \"First detailed substep description\" },\n"
                "    { \"content\": \"Second detailed substep description\" },\n"
                "    ...\n"
                "  ]\n"
                "}"
                "\n\n"
                "GUIDELINES:"
                "- Create 3-5 substeps that break down the original step further"
                "- Each substep should be specific, actionable, and build logically from the previous one"
                "- Use educational terminology appropriate for academic work"
                "- Consider research methods, writing techniques, or analysis approaches relevant to the assignment"
                "- All steps should directly contribute to completing the parent step"
                "RELEVANT COURSE MATERIALS:\n"
                f"{rag_context}\n\n"
            )
        },
        {
            "role": "user",
            "content": (
                f"{node_context}\n\n"
                f"The student wants a deeper breakdown of the step: \"{extra_context}\"\n"
                "Create a detailed set of substeps that will help them complete this specific part of their assignment. "
                "IMPORTANT: Return only valid JSON with no additional text or explanation."
            )
        }
    ]
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.6,
            max_tokens=1500
        )
        output_text = response.choices[0].message.content.strip()
        try:
            breakdown = json.loads(output_text)
            return breakdown
        except Exception:
            start = output_text.find("{")
            end = output_text.rfind("}")
            if start != -1 and end != -1 and end > start:
                trimmed_text = output_text[start:end+1]
                breakdown = json.loads(trimmed_text)
                return breakdown
            else:
                return {}
    except Exception as e:
        print(f"Error during GPT deep dive call: {e}")
        return {}