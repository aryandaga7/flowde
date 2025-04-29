import openai
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import Session
from models.models import DocumentChunk
from uuid import uuid4

def chunk_text(text, chunk_size=500, overlap=100):
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        chunks.append(chunk)
    return chunks

async def embed_and_store(text, db: Session, source="unknown"):
    from openai import AsyncOpenAI
    client = AsyncOpenAI()

    chunks = chunk_text(text)
    for chunk in chunks:
        response = await client.embeddings.create(
            model="text-embedding-ada-002",
            input=chunk
        )
        embedding = response.data[0].embedding

        db.add(DocumentChunk(
            id=uuid4(),
            content=chunk,
            embedding=embedding,
            source=source
        ))
    db.commit()
