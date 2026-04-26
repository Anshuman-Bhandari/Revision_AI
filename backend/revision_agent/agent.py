"""
Revision Agent — Tool and prompt registry.
Uses Ollama (llama3.2:3b) locally instead of Google Gemini.
"""
from .tools.agent_prompt import AGENT_INSTRUCTION
from .tools.search_notes import search_notes
from .tools.generate_revision_notes import generate_revision_notes
from .tools.generate_flashcards import generate_flashcards
from .tools.generate_quiz import generate_quiz

import sys
import os

# Add project root to path so we can import rag modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

TOOLS = {
    "search_notes": search_notes,
    "generate_revision_notes": generate_revision_notes,
    "generate_flashcards": generate_flashcards,
    "generate_quiz": generate_quiz,
}
