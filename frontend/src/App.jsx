import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import {
  sendMessage,
  uploadFiles,
  getDocumentStatus,
  clearDocuments,
} from "./api/client";

const QUICK_ACTION_PROMPTS = {
  revision:
    "Create revision notes summarizing the key topics from my uploaded notes. Give a brief summary for each major topic.",
  flashcards:
    "Generate flashcards for quick review based on the main concepts in my uploaded notes. Format each flashcard as Q: [question] and A: [answer]. Generate at least 8 flashcards.",
  quiz: "Create an MCQ quiz with 5 questions based on the important topics from my uploaded notes. Format each question with numbered questions and A. B. C. D. options. Provide an Answer Key at the end like: 1. A  2. C  etc.",
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docStatus, setDocStatus] = useState({ chunk_count: 0, files: [] });
  const [toast, setToast] = useState(null);
  const [sessionId, setSessionId] = useState("revision_session_001");

  // Fetch document status on mount
  useEffect(() => {
    getDocumentStatus()
      .then(setDocStatus)
      .catch(() => {});
  }, []);

  // Show toast notification
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Send a chat message
  const handleSendMessage = useCallback(
    async (text) => {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setLoading(true);

      try {
        const response = await sendMessage(text, sessionId);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response },
        ]);
      } catch (err) {
        const detail =
          err.response?.data?.detail || "Failed to get a response. Is the backend running?";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `**Error**: ${detail}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  // Upload & process PDFs
  const handleUploadFiles = useCallback(
    async (files) => {
      setUploading(true);
      try {
        const result = await uploadFiles(files);
        const status = await getDocumentStatus();
        setDocStatus(status);
        showToast(
          `${result.files_processed.length} file(s) processed — ${result.chunks_stored} chunks stored`
        );
      } catch (err) {
        const detail = err.response?.data?.detail || "Upload failed";
        showToast(detail, "error");
      } finally {
        setUploading(false);
      }
    },
    [showToast]
  );

  // Quick actions
  const handleQuickAction = useCallback(
    (action) => {
      const prompt = QUICK_ACTION_PROMPTS[action];
      if (prompt) handleSendMessage(prompt);
    },
    [handleSendMessage]
  );

  // Clear chat
  const handleClearChat = useCallback(() => {
    setMessages([]);
    setSessionId(`revision_session_${Date.now()}`);
  }, []);

  // Clear knowledge base
  const handleClearKnowledgeBase = useCallback(async () => {
    try {
      await clearDocuments();
      setDocStatus({ chunk_count: 0, files: [] });
      showToast("Knowledge base cleared!");
    } catch {
      showToast("Failed to clear knowledge base", "error");
    }
  }, [showToast]);

  return (
    <div className="app-layout">
      <Sidebar
        docStatus={docStatus}
        uploading={uploading}
        onUploadFiles={handleUploadFiles}
        onQuickAction={handleQuickAction}
        onClearChat={handleClearChat}
        onClearKnowledgeBase={handleClearKnowledgeBase}
      />
      <ChatArea
        messages={messages}
        loading={loading}
        docCount={docStatus.chunk_count}
        onSendMessage={handleSendMessage}
      />

      {/* Toast notification */}
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
