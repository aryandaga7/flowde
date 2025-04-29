from sqlalchemy import text
from models.models import DocumentChunk
from sqlalchemy.orm import Session


def retrieve_relevant_chunks(query_embedding, db: Session, top_k=5):
    sql = text("""
        SELECT content
        FROM document_chunks
        ORDER BY embedding <-> (:embedding)::vector
        LIMIT :limit
    """)
    result = db.execute(sql, {"embedding": query_embedding, "limit": top_k})
    return [row[0] for row in result]
