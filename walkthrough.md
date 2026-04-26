# RevisionAI — Complete Project Walkthrough

## 📌 What is this Project?

RevisionAI is an **AI-powered exam revision assistant** that runs **100% locally** on your machine. You upload your PDF study notes, and the AI can:

1. **Answer questions** about your notes
2. **Generate revision summaries** of key topics
3. **Create interactive flashcards** (flip cards with Q&A)
4. **Generate MCQ quizzes** with instant right/wrong feedback

No cloud APIs. No internet needed for AI. Everything runs on **Ollama** locally.

---

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│              http://localhost:5173                        │
│                                                          │
│  User types message ──► Axios POST /api/chat ──────-─┐   │
│  User uploads PDF   ──► Axios POST /api/upload ─-─┐  │   │
│  User checks status ──► Axios GET /api/docs/status│  │   │
│                                                   │  │   │
└───────────────────────────────────────────────────┼──┼───┘
                                                    │  │
                          HTTP (JSON + multipart)   │  │
                                                    │  │
┌───────────────────────────────────────────────────┼──┼───┐
│                    BACKEND (FastAPI)              │  │   │
│              http://localhost:8000                │  │   │
│                                                   │  │   │
│  routes/documents.py ◄────────────────────────────┘  │   │
│       │                                              │   │
│       ▼                                              │   │
│  services/document_service.py                        │   │
│       │                                              │   │
│       ├──► rag/pdf_processor.py  (extract + chunk)   │   │
│       ├──► rag/embeddings.py     (Ollama qwen2.5)    │   │
│       └──► rag/vector_store.py   (ChromaDB store)    │   │
│                                                      │   │
│  routes/chat.py ◄────────────────────────────────────┘   │
│       │                                                  │
│       ▼                                                  │
│  services/agent_service.py                               │
│       │                                                  │
│       ├──► _detect_intent()  (keyword matching)          │
│       ├──► tools/search_notes.py        ──┐              │
│       ├──► tools/generate_flashcards.py   ├──► ChromaDB  │
│       ├──► tools/generate_quiz.py         │    query     │
│       ├──► tools/generate_revision_notes  ┘              │
│       │                                                  │
│       └──► Ollama llama3.2:3b  (generate response)       │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   Ollama (Local)     │
              │  localhost:11434     │
              │                     │
              │  llama3.2:3b ─ chat │
              │  qwen2.5:0.5b ─ emb│
              └─────────────────────┘
```

---

## 📂 Folder Structure

```
Revision_AI/
├── backend/
│   ├── app.py                          # FastAPI entry point
│   ├── .env                            # Environment variables
│   ├── requirements.txt                # Python dependencies
│   │
│   ├── routes/                         # API endpoint definitions
│   │   ├── chat.py                     # POST /api/chat
│   │   └── documents.py               # POST /api/upload, GET /api/documents/status, DELETE /api/documents
│   │
│   ├── services/                       # Business logic layer
│   │   ├── agent_service.py            # LLM orchestration (Ollama + tools)
│   │   └── document_service.py         # PDF processing pipeline
│   │
│   ├── rag/                            # RAG pipeline modules
│   │   ├── pdf_processor.py            # PDF text extraction & chunking
│   │   ├── embeddings.py               # Ollama embedding generation
│   │   └── vector_store.py             # ChromaDB CRUD operations
│   │
│   ├── revision_agent/                 # Agent tools & prompt
│   │   ├── agent.py                    # Tool registry
│   │   └── tools/
│   │       ├── agent_prompt.py         # System prompt for the LLM
│   │       ├── search_notes.py         # General note search tool
│   │       ├── generate_flashcards.py  # Flashcard generation tool
│   │       ├── generate_quiz.py        # Quiz generation tool
│   │       └── generate_revision_notes.py  # Revision notes tool
│   │
│   ├── uploads/                        # Saved PDF files
│   └── chroma_db/                      # Persistent vector database
│
└── frontend/                           # React + Vite app
    └── src/
        ├── api/client.js               # Axios HTTP helpers
        ├── App.jsx                     # Main layout + state
        └── components/
            ├── Sidebar.jsx             # Upload, status, quick actions
            ├── ChatArea.jsx            # Message list + input
            ├── MessageBubble.jsx       # Markdown + parser for flashcards/quiz
            ├── FlashcardGrid.jsx       # Interactive flip cards
            └── QuizBlock.jsx           # Interactive MCQ with scoring
```

---

## 🔧 What is RAG? (Retrieval-Augmented Generation)

RAG is the core technique behind this project. Instead of the AI making up answers from general knowledge, we:

1. **Retrieve** relevant chunks from the user's own uploaded notes
2. **Augment** the LLM prompt with those chunks as context
3. **Generate** a response that is grounded in the user's actual study material

This ensures the AI answers are **faithful to the user's notes**, not hallucinated.

---

# BACKEND — Deep Dive

---

## 1. `app.py` — FastAPI Entry Point

### What is FastAPI?
FastAPI is a modern Python web framework for building REST APIs. We use it because:
- It supports **async/await** natively (needed for Ollama calls)
- It has **automatic request validation** via Pydantic models
- It generates **API documentation** automatically at `/docs`
- It's extremely fast and lightweight

### What does `app.py` do?

```python
app = FastAPI(title="RevisionAI API")
```
Creates the application instance.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    ...
)
```

**CORS (Cross-Origin Resource Sharing)**: The React frontend runs on `localhost:5173` and the backend runs on `localhost:8000`. Browsers block requests between different origins by default. CORS middleware tells the browser: "Yes, requests from `localhost:5173` are allowed."

Without CORS, every Axios request from React would be blocked by the browser.

```python
app.include_router(chat_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
```

Registers route modules. The `prefix="/api"` means all routes are prefixed with `/api` (e.g., `/api/chat`, `/api/upload`).

### Libraries used:
| Library | Purpose |
|---------|---------|
| `fastapi` | Web framework for REST API |
| `CORSMiddleware` | Allow cross-origin requests from React |
| `dotenv` / `load_dotenv()` | Load `.env` file variables into `os.environ` |

---

## 2. `routes/chat.py` — Chat Endpoint

### What does it do?
Defines a single endpoint: **`POST /api/chat`**

When the React frontend sends a chat message, it hits this endpoint.

### Key code explained:

```python
class ChatRequest(BaseModel):
    message: str
    session_id: str = "revision_session_001"
```

**Pydantic BaseModel** — Automatically validates incoming JSON. If the frontend sends `{ "message": "hello" }`, FastAPI parses it into a `ChatRequest` object. If `message` is missing, it returns a 400 error automatically.

```python
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    response_text = await run_agent(request.message, request.session_id)
    return ChatResponse(response=response_text)
```

Calls `run_agent()` from `agent_service.py` and returns the LLM response as JSON: `{ "response": "..." }`.

### Error handling:
- **429**: Ollama rate limiting (rare locally, but handled)
- **401**: Authentication errors
- **500**: Any other agent error

---

## 3. `routes/documents.py` — Document Management Endpoints

### Three endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/upload` | Upload PDF files, process them, store in ChromaDB |
| `GET` | `/api/documents/status` | Get chunk count + list of uploaded filenames |
| `DELETE` | `/api/documents` | Clear the entire knowledge base |

### Upload flow:

```python
@router.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
```

`UploadFile` is FastAPI's built-in type for handling file uploads. `File(...)` means the field is required. The frontend sends files as **multipart/form-data** (not JSON).

The route validates all files are PDFs, then delegates to `document_service.py`.

---

## 4. `services/document_service.py` — PDF Processing Pipeline

### What does it do?
Orchestrates the full document ingestion pipeline:

```
PDF file → save to disk → extract text → chunk text → generate embeddings → store in ChromaDB
```

### Key function: `process_uploaded_files()`

**Step 1 — Save to disk:**
```python
content = await uploaded_file.read()
with open(file_path, "wb") as f:
    f.write(content)
```
Reads the raw bytes from the uploaded file and saves it to the `uploads/` directory.

**Step 2 — Process PDF into chunks:**
```python
chunks = process_pdf(file_path)
```
Calls `rag/pdf_processor.py` to extract text and split it into chunks (explained below).

**Step 3 — Add unique IDs:**
```python
chunk["chunk_id"] = f"{filename}_{chunk['chunk_id']}"
```
Prefixes each chunk ID with the filename to avoid ID collisions when multiple PDFs are uploaded.

**Step 4 — Store in ChromaDB:**
```python
num_added = add_documents(chunks)
```
Calls `rag/vector_store.py` which generates embeddings and stores everything in ChromaDB.

### State tracking:
```python
_uploaded_files: list[str] = []
```
An in-memory list that tracks which files have been uploaded. Used by the `get_status()` function to show filenames in the sidebar.

---

## 5. `rag/pdf_processor.py` — PDF Text Extraction & Chunking

### What is it?
Converts a PDF file into small, overlapping text chunks suitable for embedding.

### Why chunk text?
- LLMs have **token limits** — you can't send a 50-page PDF all at once
- Embedding models work best on **short focused passages** (~1000 chars)
- Retrieval is more accurate with **small, specific chunks** than entire documents

### Library: PyPDF2
```python
from PyPDF2 import PdfReader
```
`PdfReader` opens a PDF and extracts text page by page. We use it because it's lightweight, pure Python, and handles most PDF formats.

### Function: `extract_text_from_pdf(pdf_path)`
```python
reader = PdfReader(pdf_path)
for page in reader.pages:
    page_text = page.extract_text()
    text += page_text + "\n"
```
Loops through every page, extracts text, and concatenates it all into one big string.

### Function: `chunk_text(text, chunk_size=1000, overlap=200)`

This is the smart chunking function:

```
Full text:  [==============================================]
Chunk 1:    [==========]
Chunk 2:          [==========]      ← 200 char overlap with chunk 1
Chunk 3:                [==========]
```

**Parameters:**
- `chunk_size=1000` — Each chunk is max 1000 characters
- `overlap=200` — Adjacent chunks share 200 characters of overlap

**Why overlap?** If a concept spans two chunks, the overlap ensures at least one chunk contains the full concept. Without overlap, a sentence could be split right in the middle.

**Sentence boundary detection:**
```python
for sep in ['. ', '.\n', '? ', '?\n', '! ', '!\n', '\n\n']:
    last_sep = text[start:end].rfind(sep)
```
Instead of cutting at exactly 1000 characters (which might split a word), we look backwards for the nearest sentence-ending character (period, question mark, paragraph break) and cut there. This keeps chunks semantically coherent.

**Output:** Each chunk is a dict:
```python
{"text": "chunk content...", "chunk_id": "chunk_0", "source": "filename.pdf"}
```

---

## 6. `rag/embeddings.py` — Vector Embedding Generation

### What are embeddings?
An embedding is a **list of numbers (a vector)** that represents the meaning of a text. Texts with similar meaning have vectors that are close together in mathematical space.

```
"What is photosynthesis?"  →  [0.12, -0.45, 0.78, 0.33, ...]  (896 numbers)
"How do plants make food?" →  [0.11, -0.44, 0.79, 0.31, ...]  (very similar!)
"The weather is nice today" → [0.89, 0.22, -0.15, 0.67, ...]  (very different)
```

### Why do we need embeddings?
To find which chunks of your notes are **relevant** to a question. We can't do keyword search because the question might use different words than the notes. Embeddings capture **semantic meaning**, so "photosynthesis" and "how plants make food" are recognized as related.

### Library: Ollama Python Client
```python
from ollama import Client
_client = Client(host="http://localhost:11434")
```
The `ollama` Python library connects to the Ollama server running locally. Ollama is a tool that runs LLM models on your machine.

### Model: `qwen2.5:0.5b`
A small, fast embedding model. We use it (not the larger `llama3.2:3b`) because:
- Embedding models only need to **understand** text, not generate it
- `0.5b` parameters = fast, low memory usage
- Good enough quality for semantic search

### Function: `get_embedding(text)` — Single text
```python
response = _client.embed(model=OLLAMA_MODEL, input=text)
return response["embeddings"][0]
```
Used when converting a **user's question** into a vector for searching ChromaDB.

### Function: `get_embeddings_batch(texts)` — Batch of texts
```python
response = _client.embed(model=OLLAMA_MODEL, input=texts)
return response["embeddings"]
```
Used when processing **all PDF chunks at once** before storing. Batch processing is faster than calling one-by-one.

---

## 7. `rag/vector_store.py` — ChromaDB Vector Database

### What is ChromaDB?
ChromaDB is a **vector database** — a database optimized for storing and searching embedding vectors. Unlike a regular database that searches by exact text match, ChromaDB finds the **most semantically similar** vectors.

### Why ChromaDB?
- **Persistent storage** — data survives server restarts (saved to `chroma_db/` folder)
- **Cosine similarity** — built-in distance metric for comparing vectors
- **Simple Python API** — no external database server needed
- **Lightweight** — runs embedded in the Python process

### How vectors are stored:

```python
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(
    name="revision_notes",
    metadata={"hnsw:space": "cosine"}
)
```

- `PersistentClient` saves data to disk at `./chroma_db`
- `"hnsw:space": "cosine"` tells ChromaDB to use **cosine similarity** for distance. Cosine similarity measures the angle between two vectors — vectors pointing in the same direction (similar meaning) have a small angle (distance close to 0)

### Function: `add_documents(chunks)` — Store chunks

```python
texts = [chunk["text"] for chunk in chunks]
ids = [chunk["chunk_id"] for chunk in chunks]
metadatas = [{"source": chunk["source"]} for chunk in chunks]
embeddings = get_embeddings_batch(texts)

collection.add(
    documents=texts,        # the original text (for retrieval)
    embeddings=embeddings,  # the vectors (for search)
    ids=ids,                # unique identifiers
    metadatas=metadatas     # source filename metadata
)
```

Each chunk is stored with 4 fields:
| Field | Example | Purpose |
|-------|---------|---------|
| `documents` | `"Photosynthesis is the process..."` | Original text returned in search results |
| `embeddings` | `[0.12, -0.45, 0.78, ...]` | Vector used for similarity search |
| `ids` | `"notes.pdf_chunk_3"` | Unique ID to avoid duplicates |
| `metadatas` | `{"source": "notes.pdf"}` | Tracks which file the chunk came from |

### Function: `query_documents(query, n_results=5)` — Search

This is the **retrieval** part of RAG:

```python
query_embedding = get_embedding(query)        # Step 1: embed the question
results = collection.query(
    query_embeddings=[query_embedding],        # Step 2: search by vector similarity
    n_results=min(n_results, collection.count())
)
```

**Step 1:** The user's question is converted to a vector using the same embedding model (`qwen2.5:0.5b`).

**Step 2:** ChromaDB compares this vector against ALL stored chunk vectors using cosine similarity, and returns the top 5 most similar chunks.

**Step 3:** The results are formatted:
```python
{"text": "chunk content", "source": "notes.pdf", "distance": 0.23}
```
`distance` = how far the query is from this chunk. Lower = more relevant.

### Full embedding-to-retrieval flow:

```
STORAGE (when user uploads PDF):
  PDF text → chunk → embed via qwen2.5:0.5b → store vector + text in ChromaDB

RETRIEVAL (when user asks a question):
  Question → embed via qwen2.5:0.5b → cosine search in ChromaDB → top 5 chunks returned
```

---

## 8. `services/agent_service.py` — LLM Orchestration

### What does it do?
This is the brain of the application. It:
1. Detects what the user wants (flashcards? quiz? general question?)
2. Calls the right tool to fetch relevant context from ChromaDB
3. Sends context + user question to Ollama `llama3.2:3b` for generation
4. Maintains conversation history per session

### Two Ollama models used:

| Model | Role | Why this model? |
|-------|------|-----------------|
| `qwen2.5:0.5b` | **Embeddings** — converts text to vectors | Small & fast, good at understanding meaning |
| `llama3.2:3b` | **Chat/generation** — writes answers, flashcards, quizzes | Good at following instructions, generating structured output |

### Intent Detection:
```python
def _detect_intent(user_input: str) -> str:
    text = user_input.lower()
    if any(kw in text for kw in ["flashcard", "flash card", "flip card"]):
        return "flashcards"
    if any(kw in text for kw in ["quiz", "mcq", "multiple choice", "test me"]):
        return "quiz"
    ...
    return "search"
```
Simple keyword matching. If the user says "make flashcards about chapter 3", the word "flashcards" triggers the flashcard tool.

### Tool dispatch:
```python
if intent == "flashcards":
    tool_result = generate_flashcards(user_input)
elif intent == "quiz":
    tool_result = generate_quiz(user_input)
```
Each tool queries ChromaDB for relevant chunks and returns them as context along with formatting instructions.

### Sending to Ollama:
```python
messages = [
    {"role": "system", "content": AGENT_INSTRUCTION},   # system prompt
    *_sessions[session_id][-MAX_HISTORY:],               # last 10 messages
    {"role": "user", "content": user_prompt},            # context + question
]
response = _client.chat(model="llama3.2:3b", messages=messages)
```

The Ollama chat API works like a conversation:
- **system** message = instructions for how the AI should behave
- **previous messages** = conversation history for continuity
- **user** message = the context from notes + user's actual question

### Conversation history:
```python
_sessions: dict[str, list[dict]] = {}
```
A Python dictionary that maps session IDs to message history. Each session stores the last 10 messages so the AI remembers what was discussed earlier in the conversation.

---

## 9. Agent Tools — What Each Tool Does

All 4 tools share the same pattern:
1. Take the user's input as a topic
2. Query ChromaDB for relevant chunks
3. Return the chunks as context + formatting instructions

### `search_notes(query)` — General search
- Queries ChromaDB with `n_results=5`
- Returns context with source attribution: `[Source: notes.pdf]`
- Used for any general question about the notes

### `generate_flashcards(topic)` — Flashcard context
- Queries ChromaDB with `n_results=7` (more context for better cards)
- Returns instruction: *"Create exactly 4 flashcards, format as Q: / A:"*
- The frontend parses Q:/A: format and renders interactive flip cards

### `generate_quiz(topic)` — Quiz context
- Queries ChromaDB with `n_results=7`
- Returns instruction: *"Create 5 MCQ questions with A/B/C/D options, write Answer: X after each"*
- The frontend parses questions + inline answers and renders clickable quiz

### `generate_revision_notes(topic)` — Summary context
- Queries ChromaDB with `n_results=7`
- Returns instruction: *"Create a structured revision summary with bullet points"*
- Rendered as standard markdown in the chat

---

## 10. `agent_prompt.py` — System Prompt

The system prompt tells the LLM **how to behave**. Key rules:
- Use ONLY information from the provided context (no hallucination)
- Format flashcards strictly as `Q:` / `A:` (so frontend can parse them)
- Format quizzes with `Answer: X` after each question (so frontend knows the correct answer)
- Be encouraging and use emojis

The strict formatting rules are essential — the React frontend **parses the text** to detect flashcard/quiz patterns and render interactive components.

---

# FRONTEND ↔ BACKEND Communication

---

## How Data Flows Between Frontend and Backend

The frontend (React) and backend (FastAPI) communicate via **HTTP REST API** using **Axios** as the HTTP client.

### Axios Setup (`api/client.js`):
```javascript
const api = axios.create({
    baseURL: "http://localhost:8000/api",
    headers: { "Content-Type": "application/json" },
});
```
Creates a reusable Axios instance. All requests go to `http://localhost:8000/api/...`.

---

### Flow 1: Chat Message

```
React (user types message)
    │
    ▼
sendMessage("explain photosynthesis", sessionId)
    │
    ▼  Axios POST http://localhost:8000/api/chat
    │  Body: { "message": "explain photosynthesis", "session_id": "revision_session_001" }
    │  Content-Type: application/json
    │
    ▼
FastAPI routes/chat.py receives ChatRequest
    │
    ▼
agent_service.run_agent() → detect intent → call search_notes() → query ChromaDB
    │                                                                    │
    │                        returns top 5 relevant chunks ◄─────────────┘
    │
    ▼
Build prompt: system instruction + history + context + user question
    │
    ▼
Ollama llama3.2:3b generates response
    │
    ▼
FastAPI returns: { "response": "📝 According to your notes..." }
    │
    ▼
React receives response → MessageBubble renders as markdown
(or detects Q:/A: patterns → renders FlashcardGrid)
(or detects MCQ patterns → renders QuizBlock)
```

### Flow 2: PDF Upload

```
React (user selects PDF files + clicks Process)
    │
    ▼
uploadFiles([file1, file2])
    │
    ▼  Axios POST http://localhost:8000/api/upload
    │  Body: FormData with files (multipart/form-data, NOT JSON)
    │  Content-Type: multipart/form-data
    │
    ▼
FastAPI routes/documents.py receives List[UploadFile]
    │
    ▼
document_service.process_uploaded_files()
    │
    ├──► Save each PDF to uploads/ directory
    ├──► pdf_processor.process_pdf() → extract text → chunk into ~1000 char pieces
    ├──► embeddings.get_embeddings_batch() → convert chunks to vectors via Ollama qwen2.5
    └──► vector_store.add_documents() → store vectors + text in ChromaDB
    │
    ▼
FastAPI returns: { "chunks_stored": 42, "files_processed": ["notes.pdf"] }
    │
    ▼
React updates sidebar status card (shows "42 chunks in knowledge base")
```

### Flow 3: Document Status Check

```
React (on page load)
    │
    ▼
getDocumentStatus()
    │
    ▼  Axios GET http://localhost:8000/api/documents/status
    │
    ▼
FastAPI returns: { "chunk_count": 42, "files": ["notes.pdf"] }
    │
    ▼
React displays chunk count in sidebar status card
```

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

---

## API Endpoints Summary

| Method | Endpoint | Request Body | Response | Purpose |
|--------|----------|-------------|----------|---------|
| `POST` | `/api/chat` | `{ message, session_id }` (JSON) | `{ response }` | Send message to AI |
| `POST` | `/api/upload` | `FormData` with PDF files | `{ chunks_stored, files_processed }` | Upload & process PDFs |
| `GET` | `/api/documents/status` | — | `{ chunk_count, files }` | Check KB status |
| `DELETE` | `/api/documents` | — | `{ message, chunk_count, files }` | Clear all documents |

---

## Dependencies Summary

### Backend (`requirements.txt`):

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | Latest | Web framework for REST API |
| `uvicorn[standard]` | Latest | ASGI server to run FastAPI |
| `python-multipart` | Latest | Required for file upload (`UploadFile`) |
| `ollama` | Latest | Python client for Ollama (embeddings + chat) |
| `chromadb` | Latest | Vector database for storing/searching embeddings |
| `PyPDF2` | Latest | PDF text extraction |
| `python-dotenv` | Latest | Load `.env` file |

### Frontend (`package.json`):

| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `axios` | HTTP client for API calls |
| `react-markdown` | Render markdown in chat messages |
| `remark-gfm` | GitHub-flavored markdown (tables, strikethrough) |

---

## How to Run

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
