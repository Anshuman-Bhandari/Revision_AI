"""
Documents Route — Upload, status, and clear endpoints.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from services.document_service import (
    process_uploaded_files,
    get_status,
    clear_knowledge_base,
)

router = APIRouter()


@router.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    """Upload and process PDF files into the knowledge base."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Validate all files are PDFs
    for f in files:
        if not f.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400, detail=f"Only PDF files are accepted. Got: {f.filename}"
            )

    try:
        result = await process_uploaded_files(files)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.get("/documents/status")
async def document_status():
    """Get the current knowledge base status."""
    return get_status()


@router.delete("/documents")
async def clear_documents():
    """Clear all documents from the knowledge base."""
    clear_knowledge_base()
    return {"message": "Knowledge base cleared", "chunk_count": 0, "files": []}
