"""
PDF Processing Module
- Extracts text from PDF files using PyPDF2
- Chunks text into manageable pieces for embedding
"""

import os
from PyPDF2 import PdfReader


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text content from a PDF file."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[dict]:
    """
    Split text into overlapping chunks for better retrieval.
    
    Args:
        text: The full text to chunk
        chunk_size: Maximum characters per chunk
        overlap: Number of overlapping characters between chunks
    
    Returns:
        List of dicts with 'text' and 'chunk_id' keys
    """
    chunks = []
    start = 0
    chunk_id = 0

    while start < len(text):
        end = start + chunk_size

        # Try to break at a sentence boundary
        if end < len(text):
            # Look for the last period, newline, or question mark before the end
            for sep in ['. ', '.\n', '? ', '?\n', '! ', '!\n', '\n\n']:
                last_sep = text[start:end].rfind(sep)
                if last_sep != -1:
                    end = start + last_sep + len(sep)
                    break

        chunk_text_content = text[start:end].strip()
        if chunk_text_content:
            chunks.append({
                "text": chunk_text_content,
                "chunk_id": f"chunk_{chunk_id}"
            })
            chunk_id += 1

        start = end - overlap
        if start >= len(text):
            break

    return chunks


def process_pdf(pdf_path: str, chunk_size: int = 1000, overlap: int = 200) -> list[dict]:
    """
    Full pipeline: extract text from PDF and chunk it.
    
    Args:
        pdf_path: Path to the PDF file
        chunk_size: Maximum characters per chunk
        overlap: Overlapping characters between chunks
    
    Returns:
        List of chunk dicts with 'text', 'chunk_id', and 'source' keys
    """
    filename = os.path.basename(pdf_path)
    text = extract_text_from_pdf(pdf_path)

    if not text.strip():
        raise ValueError(f"No text could be extracted from {filename}")

    chunks = chunk_text(text, chunk_size, overlap)

    # Add source metadata to each chunk
    for chunk in chunks:
        chunk["source"] = filename

    return chunks
