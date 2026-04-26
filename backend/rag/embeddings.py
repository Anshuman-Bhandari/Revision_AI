"""
Embeddings Module
- Uses Ollama (qwen2.5:0.5b) running locally at http://localhost:11434
- No cloud API calls needed — runs entirely on your machine

Flow:
  1. PDF text chunks → Ollama embedding → stored in ChromaDB
  2. User query → Ollama embedding → search ChromaDB → retrieve relevant chunks
  3. Retrieved chunks → sent to Gemini (via ADK agent) → final answer
"""

from ollama import Client

# ─── OLLAMA CONFIG ────────────────────────────────────────────────────────────
OLLAMA_HOST = "http://localhost:11434"
OLLAMA_MODEL = "qwen2.5:0.5b"

# Create Ollama client pointing to local server
_client = Client(host=OLLAMA_HOST)


def get_embedding(text: str) -> list[float]:
    """
    Generate embedding for a single text using local Ollama.
    Used when converting a user query to a vector for ChromaDB search.
    """
    response = _client.embed(model=OLLAMA_MODEL, input=text)
    return response["embeddings"][0]


def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a batch of texts using local Ollama.
    Used when processing PDF chunks before storing in ChromaDB.
    """
    response = _client.embed(model=OLLAMA_MODEL, input=texts)
    return response["embeddings"]
