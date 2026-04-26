"""
Agent Service — Uses Ollama (llama3.2:3b) locally for all LLM calls.
Replaces the Google ADK agent with direct Ollama chat.
"""

import re
from ollama import Client

from revision_agent.tools.agent_prompt import AGENT_INSTRUCTION
from revision_agent.tools.search_notes import search_notes
from revision_agent.tools.generate_revision_notes import generate_revision_notes
from revision_agent.tools.generate_flashcards import generate_flashcards
from revision_agent.tools.generate_quiz import generate_quiz

# ─── OLLAMA CONFIG ────────────────────────────────────────────────────────────

OLLAMA_HOST = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2:3b"

_client = Client(host=OLLAMA_HOST)

# ─── CONVERSATION HISTORY ────────────────────────────────────────────────────

_sessions: dict[str, list[dict]] = {}

MAX_HISTORY = 10  # Keep last N messages for context


# ─── INTENT DETECTION ─────────────────────────────────────────────────────────

def _detect_intent(user_input: str) -> str:
    """Detect user intent from keywords in the message."""
    text = user_input.lower()

    if any(kw in text for kw in ["flashcard", "flash card", "flip card"]):
        return "flashcards"
    if any(kw in text for kw in ["quiz", "mcq", "multiple choice", "test me"]):
        return "quiz"
    if any(kw in text for kw in ["revision", "revise", "summary", "summarize", "summarise", "key points", "overview"]):
        return "revision"
    return "search"


# ─── RUN AGENT ────────────────────────────────────────────────────────────────

async def run_agent(user_input: str, session_id: str = "revision_session_001") -> str:
    """
    Process user input: detect intent, call appropriate tool, send to Ollama.

    Args:
        user_input: The user's message
        session_id: Session identifier for conversation continuity

    Returns:
        The model's response as a string
    """
    # Ensure session exists
    if session_id not in _sessions:
        _sessions[session_id] = []

    # 1. Detect intent and call the right tool
    intent = _detect_intent(user_input)

    if intent == "flashcards":
        tool_result = generate_flashcards(user_input)
    elif intent == "quiz":
        tool_result = generate_quiz(user_input)
    elif intent == "revision":
        tool_result = generate_revision_notes(user_input)
    else:
        tool_result = search_notes(user_input)

    # 2. Build the user prompt with context
    if tool_result.get("status") == "no_documents":
        user_prompt = (
            f"The user asked: {user_input}\n\n"
            "No documents have been uploaded yet. "
            "Please politely ask the user to upload their notes first."
        )
    else:
        context = tool_result.get("context", "")
        instruction = tool_result.get("instruction", "")
        user_prompt = (
            f"Context from uploaded notes:\n{context}\n\n"
            f"{instruction}\n\n"
            f"User question: {user_input}"
        )

    # 3. Build messages with conversation history
    messages = [
        {"role": "system", "content": AGENT_INSTRUCTION},
        *_sessions[session_id][-MAX_HISTORY:],
        {"role": "user", "content": user_prompt},
    ]

    # 4. Call Ollama
    response = _client.chat(model=OLLAMA_MODEL, messages=messages)
    reply = response["message"]["content"]

    # 5. Store in conversation history (original user input, not the full prompt)
    _sessions[session_id].append({"role": "user", "content": user_input})
    _sessions[session_id].append({"role": "assistant", "content": reply})

    return reply if reply else "I couldn't generate a response. Please try again."
