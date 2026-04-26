from rag.vector_store import query_documents

def generate_quiz(topic: str, num_questions: int = 5) -> dict:
    """
    Generate MCQ quiz questions for testing knowledge on a specific topic.
    This tool searches the uploaded notes and returns relevant content
    that should be used to create multiple choice questions.
    
    Args:
        topic: The topic to create quiz questions for
        num_questions: Number of MCQ questions to generate (default: 5)
    
    Returns:
        Context from notes to base the quiz on
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
        "num_questions": num_questions,
        "context": "\n\n".join(context_parts),
        "instruction": (
            f"Create exactly {num_questions} MCQ questions using ONLY the provided context. "
            "Format each question EXACTLY like this:\n\n"
            "1. [Question text]\n"
            "A. [Option]\n"
            "B. [Option]\n"
            "C. [Option]\n"
            "D. [Option]\n"
            "Answer: [correct letter]\n\n"
            "IMPORTANT: After each question's 4 options, write 'Answer: X' on a new line "
            "where X is the correct letter (A, B, C, or D). "
            "Do NOT include a separate answer key at the end. "
            "Each question MUST have its own 'Answer:' line right after its options. "
            "All questions and correct answers must come strictly from the provided context."
        )
    }