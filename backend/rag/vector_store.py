"""
Vector Store Module
- Uses ChromaDB for persistent vector storage
- Stores document chunks with Ollama-generated embeddings
- Retrieves relevant chunks for RAG queries
"""

import chromadb
from rag.embeddings import get_embedding, get_embeddings_batch

# Persistent ChromaDB client
CHROMA_PATH = "./chroma_db"
COLLECTION_NAME = "revision_notes"


def get_chroma_client():
    """Get or create a persistent ChromaDB client."""
    return chromadb.PersistentClient(path=CHROMA_PATH)


def get_collection():
    """Get or create the revision notes collection."""
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )


def add_documents(chunks: list[dict]) -> int:
    """
    Add document chunks to ChromaDB with Ollama embeddings.
    
    Args:
        chunks: List of dicts with 'text', 'chunk_id', and 'source' keys
    
    Returns:
        Number of chunks added
    """
    collection = get_collection()

    texts = [chunk["text"] for chunk in chunks]
    ids = [chunk["chunk_id"] for chunk in chunks]
    metadatas = [{"source": chunk["source"]} for chunk in chunks]

    # Generate embeddings using Ollama
    embeddings = get_embeddings_batch(texts)

    collection.add(
        documents=texts,
        embeddings=embeddings,
        ids=ids,
        metadatas=metadatas
    )

    return len(chunks)


def query_documents(query: str, n_results: int = 5) -> list[dict]:
    """
    Query ChromaDB for relevant document chunks.
    
    Args:
        query: The search query
        n_results: Number of results to return
    
    Returns:
        List of dicts with 'text', 'source', and 'distance' keys
    """
    collection = get_collection()

    if collection.count() == 0:
        return []

    # Generate query embedding using Ollama
    query_embedding = get_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(n_results, collection.count())
    )

    documents = []
    for i in range(len(results["documents"][0])):
        documents.append({
            "text": results["documents"][0][i],
            "source": results["metadatas"][0][i]["source"],
            "distance": results["distances"][0][i]
        })

    return documents


def clear_collection():
    """Delete all documents from the collection."""
    client = get_chroma_client()
    try:
        client.delete_collection(name=COLLECTION_NAME)
    except Exception:
        pass


def get_collection_count() -> int:
    """Get the number of documents in the collection."""
    try:
        collection = get_collection()
        return collection.count()
    except Exception:
        return 0
