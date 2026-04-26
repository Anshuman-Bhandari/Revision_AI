RevisionAI is an **AI-powered exam revision assistant** that runs **100% locally** on your machine. You upload your PDF study notes, and the AI can:

1. **Answer questions** about your notes
2. **Generate revision summaries** of key topics
3. **Create interactive flashcards** (flip cards with Q&A)
4. **Generate MCQ quizzes** with instant right/wrong feedback

No cloud APIs. No internet needed for AI. Everything runs on **Ollama** locally.

### Flow 4: Clear Knowledge Base

```
React (user clicks "Clear Knowledge Base")
    │
    ▼
clearDocuments()
    │
    ▼  Axios DELETE http://localhost:8000/api/documents
    │
    ▼
document_service.clear_knowledge_base()
    ├──► vector_store.clear_collection() → deletes ChromaDB collection
    └──► clears in-memory file list
    │
    ▼
FastAPI returns: { "chunk_count": 0, "files": [] }
    │
    ▼
React resets sidebar to show 0 chunks
```

### Prerequisites:
```bash
# Install and start Ollama, then pull both models:
ollama pull llama3.2:3b       # for chat generation
ollama pull qwen2.5:0.5b      # for embeddings
```

### Terminal 1 — Backend:
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Terminal 2 — Frontend:
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.