import { useRef } from "react";

/**
 * Sidebar — PDF upload, document status, quick actions, and settings.
 */
export default function Sidebar({
  docStatus,
  uploading,
  onUploadFiles,
  onQuickAction,
  onClearChat,
  onClearKnowledgeBase,
}) {
  const fileInputRef = useRef(null);
  const selectedFilesRef = useRef([]);

  const handleFileChange = (e) => {
    selectedFilesRef.current = Array.from(e.target.files);
  };

  const handleProcess = () => {
    if (selectedFilesRef.current.length === 0) return;
    onUploadFiles(selectedFilesRef.current);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
    selectedFilesRef.current = [];
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="brand-icon">📚</span>
        <h2>RevisionAI</h2>
        <p>Your Smart Study Companion</p>
      </div>

      {/* Upload Section */}
      <div className="sidebar-section-label">📄 Upload Notes</div>
      <div className="upload-area">
        <span className="upload-icon">📁</span>
        <p>Drop your PDF notes here</p>
        <p className="upload-hint">or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
        />
      </div>

      <button
        className="btn-process"
        onClick={handleProcess}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <span className="spinner"></span> Processing...
          </>
        ) : (
          "🚀 Process Documents"
        )}
      </button>

      {/* Document Status */}
      <div className="sidebar-section-label">📊 Document Status</div>
      <div className="status-card">
        <div className="count">{docStatus.chunk_count}</div>
        <div className="label">chunks in knowledge base</div>
      </div>

      {docStatus.files && docStatus.files.length > 0 && (
        <ul className="file-list">
          {docStatus.files.map((name, i) => (
            <li key={i}>📄 {name}</li>
          ))}
        </ul>
      )}

      {/* Quick Actions */}
      <div className="sidebar-section-label">⚡ Quick Actions</div>
      <div className="quick-actions">
        <button className="btn-action" onClick={() => onQuickAction("revision")}>
          📝 Revision
        </button>
        <button className="btn-action" onClick={() => onQuickAction("flashcards")}>
          🃏 Flashcards
        </button>
        <button className="btn-action" onClick={() => onQuickAction("quiz")}>
          📋 Quiz
        </button>
        <button className="btn-action" onClick={onClearChat}>
          🗑️ Clear Chat
        </button>
      </div>

      {/* Settings */}
      <div className="sidebar-section-label">🔧 Settings</div>
      <button className="btn-action btn-danger" onClick={onClearKnowledgeBase}>
        🗑️ Clear Knowledge Base
      </button>
    </aside>
  );
}
