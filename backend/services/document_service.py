"""
Document Service — PDF upload processing and vector store management.
Extracted from the original app.py for modularity.
"""

import os
from fastapi import UploadFile
from typing import List

from rag.pdf_processor import process_pdf
from rag.vector_store import add_documents, clear_collection, get_collection_count

# ─── STATE ────────────────────────────────────────────────────────────────────

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
_uploaded_files: list[str] = []


# ─── PUBLIC API ───────────────────────────────────────────────────────────────

async def process_uploaded_files(files: List[UploadFile]) -> dict:
    """
    Save uploaded PDFs, process them into chunks, and store in ChromaDB.

    Args:
        files: List of uploaded PDF files from FastAPI

    Returns:
        Dict with processing results
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Clear existing data before processing new batch
    clear_collection()
    _uploaded_files.clear()

    total_chunks = 0
    processed_files = []
    errors = []

    for uploaded_file in files:
        filename = uploaded_file.filename
        file_path = os.path.join(UPLOAD_DIR, filename)

        # Save file to disk
        content = await uploaded_file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Process PDF → chunks → store
        try:
            chunks = process_pdf(file_path)
            # Add unique prefix to chunk IDs to avoid collisions
            for chunk in chunks:
                chunk["chunk_id"] = f"{filename}_{chunk['chunk_id']}"
            num_added = add_documents(chunks)
            total_chunks += num_added
            processed_files.append(filename)
        except Exception as e:
            errors.append({"file": filename, "error": str(e)})

    _uploaded_files.extend(processed_files)

    return {
        "message": f"Processed {len(processed_files)} file(s) → {total_chunks} chunks stored",
        "chunks_stored": total_chunks,
        "files_processed": processed_files,
        "errors": errors if errors else None,
    }


def get_status() -> dict:
    """Get the current knowledge base status."""
    return {
        "chunk_count": get_collection_count(),
        "files": list(_uploaded_files),
    }


def clear_knowledge_base():
    """Clear all documents from the knowledge base."""
    clear_collection()
    _uploaded_files.clear()
