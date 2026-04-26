from rag.vector_store import query_documents

def generate_flashcards(topic: str) -> dict:
    """
    Generate flashcard content for quick review on a specific topic.
    This tool searches the uploaded notes and returns relevant content
    that should be used to create Q&A flashcard pairs.
    
    Args:
        topic: The topic to create flashcards for
    
    Returns:
        Context from notes to base the flashcards on
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
        "instruction": (
            "Create exactly 4 flashcards using ONLY the provided context. "
            "Each flashcard should test one key concept.\n\n"
            "You MUST format each flashcard EXACTLY like this:\n\n"
            "Q: [question text]\n"
            "A: [answer text]\n\n"
            "Q: [question text]\n"
            "A: [answer text]\n\n"
            "Use exactly 'Q:' and 'A:' prefixes. Do NOT number them (no Q1/A1). "
            "Separate each flashcard with a blank line. "
            "Do NOT use your general knowledge — only the retrieved context."
        )
    }