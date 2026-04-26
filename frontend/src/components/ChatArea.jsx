import { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

/**
 * ChatArea — Main chat interface with message list, input bar, and welcome screen.
 */
export default function ChatArea({
  messages,
  loading,
  docCount,
  onSendMessage,
}) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const input = inputRef.current;
    const value = input.value.trim();
    if (!value || loading) return;
    onSendMessage(value);
    input.value = "";
  };

  return (
    <div className="chat-area">
      {/* Header */}
      <div className="chat-header">
        <h1>RevisionAI</h1>
        <p>Upload your notes, ask questions, ace your exams.</p>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            {docCount > 0 ? (
              <>
                <h2>Welcome back</h2>
                <p>
                  Your notes are loaded and ready. I can help you with revision
                  notes, flashcards, or quizzes. Type what you need or use
                  the Quick Actions in the sidebar.
                </p>
              </>
            ) : (
              <>
                <h2>Welcome to RevisionAI</h2>
                <p>
                  Your AI study companion. Upload your PDF notes using the
                  sidebar, then ask me to create revision notes, flashcards, or
                  quizzes.
                </p>
              </>
            )}
            <div className="welcome-features">
              <div className="welcome-feature">
                <div className="feat-title">Revision Notes</div>
                <div className="feat-desc">Topic summaries</div>
              </div>
              <div className="welcome-feature">
                <div className="feat-title">Flashcards</div>
                <div className="feat-desc">Flip to learn</div>
              </div>
              <div className="welcome-feature">
                <div className="feat-title">Quiz</div>
                <div className="feat-desc">Test yourself</div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="message-row assistant">
            <div className="message-avatar">AI</div>
            <div className="message-bubble">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <form className="chat-input-wrapper" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask me anything about your notes..."
            disabled={loading}
          />
          <button className="btn-send" type="submit" disabled={loading}>
            &#x2192;
          </button>
        </form>
      </div>
    </div>
  );
}
