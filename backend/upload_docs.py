import os
import fitz  
import asyncio
from core.database import SessionLocal
from services.embedder import embed_and_store

def read_pdf(filepath):
    doc = fitz.open(filepath)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

async def upload_folder(folder_path):
    db = SessionLocal()
    for filename in os.listdir(folder_path):
        if filename.endswith(".pdf"):
            full_path = os.path.join(folder_path, filename)
            print(f"Uploading: {filename}")
            text = read_pdf(full_path)
            await embed_and_store(text, db, source=filename)  # Pass filename as source
    db.close()

if __name__ == "__main__":
    asyncio.run(upload_folder("/Users/aryandaga/Desktop/workflow_documents"))  
