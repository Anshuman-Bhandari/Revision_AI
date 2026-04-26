/**
 * API Client — Axios instance and helper functions for backend communication.
 */
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

/**
 * Send a chat message to the revision agent.
 */
export async function sendMessage(message, sessionId = "revision_session_001") {
  const { data } = await api.post("/chat", {
    message,
    session_id: sessionId,
  });
  return data.response;
}

/**
 * Upload PDF files to the knowledge base.
 */
export async function uploadFiles(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Get the current document/knowledge base status.
 */
export async function getDocumentStatus() {
  const { data } = await api.get("/documents/status");
  return data;
}

/**
 * Clear all documents from the knowledge base.
 */
export async function clearDocuments() {
  const { data } = await api.delete("/documents");
  return data;
}
