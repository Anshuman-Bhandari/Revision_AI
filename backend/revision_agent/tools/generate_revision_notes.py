from rag.vector_store import query_documents

def generate_revision_notes(topic: str) -> dict:
    """
    Generate structured revision notes for a specific topic.
    This tool searches the uploaded notes and returns relevant content
    that should be used to create a brief, organized summary.
    
    Args:
        topic: The topic to generate revision notes for
       
    Returns:
        Context from notes to base the revision summary on
    """
    results = query_documents(topic, n_results=7)
    
    if not results:
        return {
            "status": "no_documents",
            "message": "No documents uploaded. Please upload your study notes first."
        }
    
    context_parts = []
    for doc in results:
        context_parts.append(doc["text"])
    
    return {
        "status": "success",
        "topic": topic,
        "context": "\n\n".join(context_parts),
        "instruction": "Create a well-structured revision summary using ONLY the provided context. Include key points, definitions, and important facts. Use bullet points and headers for clarity. Do NOT add information from your general knowledge into the main summary. If you want to add extra context, put it in a clearly separated 'Extra Details' section at the very end."
    }
