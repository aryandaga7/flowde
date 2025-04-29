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
    prompt = f"Use the following notes to improve your breakdown:\n{rag_context}\n\n"
    prompt = f"{node_context}\n"
    if extra_context.strip():
        prompt += f"Additional context: {extra_context}\n"
    prompt += (
        "Based on the above context, provide a structured JSON breakdown of this node into 2-3 actionable substeps. "
        "The JSON output must have a key 'new_steps' whose value is a list of substep objects. Each substep object must include a 'content' field. "
    )
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert academic assistant specializing in task decomposition."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=10000
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