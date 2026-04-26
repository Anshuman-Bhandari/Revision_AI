
from rag.vector_store import query_documents

def search_notes(query: str) -> dict:
    """
    Search the uploaded study notes for information relevant to the query.
    Use this tool whenever you need to find specific content from the user's uploaded documents.
    
    Args:
        query: The topic or question to search for in the notes
    
    Returns:
        A dictionary with the retrieved context from the notes
    """
    results = query_documents(query, n_results=5)
    
    if not results:
        return {
            "status": "no_documents",
            "message": "No documents have been uploaded yet. Please upload your notes first."
        }
    
    context_parts = []
    for i, doc in enumerate(results, 1):
        context_parts.append(f"[Source: {doc['source']}]\n{doc['text']}")
    
    context = "\n\n---\n\n".join(context_parts)
    
    return {
        "status": "success",
        "context": context,
        "num_results": len(results)
    }