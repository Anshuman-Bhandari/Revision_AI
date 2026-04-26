"""
Chat Route — POST /api/chat
Sends user messages to the ADK agent and returns responses.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.agent_service import run_agent

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: str = "revision_session_001"


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message to the revision agent and get a response."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        response_text = await run_agent(request.message, request.session_id)
        return ChatResponse(response=response_text)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            raise HTTPException(
                status_code=429,
                detail="API Quota Exceeded: The Gemini API limit has been reached. Please wait and try again.",
            )
        elif "401" in error_msg or "UNAUTHENTICATED" in error_msg:
            raise HTTPException(
                status_code=401,
                detail="Authentication Error: Please check the GOOGLE_API_KEY.",
            )
        else:
            raise HTTPException(status_code=500, detail=f"Agent error: {error_msg}")
