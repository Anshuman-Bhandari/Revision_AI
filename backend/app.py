"""
RevisionAI — FastAPI Backend
Main entry point for the API server.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from routes.chat import router as chat_router
from routes.documents import router as documents_router

app = FastAPI(
    title="RevisionAI API",
    description="AI Exam Revision Assistant — Backend API",
    version="1.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat_router, prefix="/api")
app.include_router(documents_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "RevisionAI API is running 🚀"}
