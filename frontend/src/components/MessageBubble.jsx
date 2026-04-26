import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FlashcardGrid from "./FlashcardGrid";
import QuizBlock from "./QuizBlock";

/**
 * Parse flashcard Q:/A: pairs from text using line-by-line approach.
 * Returns { cards: [{ question, answer }], remainingText } or null.
 */
function parseFlashcards(text) {
  const lines = text.split("\n");
  const cards = [];
  let currentQ = null;
  let currentA = null;
  const usedLineIndices = new Set();

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Match Q: or Q1: or **Q:** etc.
    const qMatch = trimmed.match(
      /^(?:\*{0,2})Q\d*(?:\*{0,2})[:\.\-]\s*(.+)/i
    );
    if (qMatch) {
      // Save previous card
      if (currentQ && currentA) {
        cards.push({ question: currentQ, answer: currentA });
      }
      currentQ = qMatch[1].trim();
      currentA = null;
      usedLineIndices.add(i);
      continue;
    }

    // Match A: or A1: or **A:** etc. — but NOT "A." which is a quiz option
    const aMatch = trimmed.match(
      /^(?:\*{0,2})A\d*(?:\*{0,2})[:\-]\s*(.+)/i
    );
    if (aMatch && currentQ) {
      currentA = aMatch[1].trim();
      usedLineIndices.add(i);
      continue;
    }

    // Continuation line for a multi-line answer
    if (currentA && trimmed && !trimmed.match(/^(?:\*{0,2})Q/i)) {
      currentA += " " + trimmed;
      usedLineIndices.add(i);
    }
  }

  // Push last card
  if (currentQ && currentA) {
    cards.push({ question: currentQ, answer: currentA });
  }

  if (cards.length < 2) return null;

  // Build remaining text from unused lines
  const remaining = lines
    .filter((_, i) => !usedLineIndices.has(i))
    .join("\n")
    .replace(/#{1,3}\s*.*flashcard.*/gi, "")
    .trim();

  return { cards, remainingText: remaining };
}

/**
 * Parse MCQ quiz from text using line-by-line approach.
 * Looks for inline "Answer: X" after each question's options.
 * Returns { questions: [...], remainingText } or null.
 */
function parseQuiz(text) {
  const lines = text.split("\n");
  const questions = [];
  let current = null;
  const usedLineIndices = new Set();

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Check for question start: "1. Question text" or "1) Question text"
    // Must NOT start with A-D (those are options)
    const qMatch = trimmed.match(
      /^(?:\*{0,2})(\d+)[\.\)]\s*(?:\*{0,2})(.*?)(?:\*{0,2})$/
    );
    if (qMatch && !trimmed.match(/^[A-D][\.\)]/i)) {
      // Save previous question
      if (current && current.options.length >= 2 && current.answer) {
        questions.push(current);
      }
      current = {
        question: qMatch[2].trim(),
        options: [],
        answer: null,
      };
      usedLineIndices.add(i);
      continue;
    }

    if (current) {
      // Check for option: "A. text" or "A) text"
      const optMatch = trimmed.match(/^([A-D])[\.\)]\s*(.+)/i);
      if (optMatch) {
        current.options.push({
          letter: optMatch[1].toUpperCase(),
          text: optMatch[2].trim(),
        });
        usedLineIndices.add(i);
        continue;
      }

      // Check for inline answer: "Answer: B" or "**Answer:** B" or "Correct: B"
      const ansMatch = trimmed.match(
        /^(?:\*{0,2})(?:Answer|Correct)(?:\*{0,2})\s*:\s*(?:\*{0,2})([A-D])(?:\*{0,2})/i
      );
      if (ansMatch) {
        current.answer = ansMatch[1].toUpperCase();
        usedLineIndices.add(i);
        continue;
      }
    }
  }

  // Push last question
  if (current && current.options.length >= 2 && current.answer) {
    questions.push(current);
  }

  if (questions.length < 2) return null;

  // Build remaining text from unused lines
  const remaining = lines
    .filter((_, i) => !usedLineIndices.has(i))
    .join("\n")
    .replace(/#{1,3}\s*.*(?:quiz|mcq|question).*/gi, "")
    .replace(/(?:\*{0,2})(?:answer\s*key|answers?)(?:\*{0,2})\s*:.*/gi, "")
    .trim();

  return { questions, remainingText: remaining };
}

/**
 * MessageBubble — Renders a single chat message.
 * Detects flashcard/quiz patterns and renders interactive components.
 */
export default function MessageBubble({ role, content }) {
  const isUser = role === "user";

  // Only parse assistant messages for interactive content
  if (!isUser) {
    // Try quiz first (more specific pattern)
    const quizData = parseQuiz(content);
    if (quizData && quizData.questions.length >= 2) {
      return (
        <div className={`message-row ${role}`}>
          <div className="message-avatar">{isUser ? "🧑‍🎓" : "🤖"}</div>
          <div className="message-bubble">
            {quizData.remainingText && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {quizData.remainingText}
              </ReactMarkdown>
            )}
            <QuizBlock questions={quizData.questions} />
          </div>
        </div>
      );
    }

    // Try flashcards
    const flashcardData = parseFlashcards(content);
    if (flashcardData && flashcardData.cards.length >= 2) {
      // Show 4 cards at a time
      const cardGroups = [];
      for (let i = 0; i < flashcardData.cards.length; i += 4) {
        cardGroups.push(flashcardData.cards.slice(i, i + 4));
      }

      return (
        <div className={`message-row ${role}`}>
          <div className="message-avatar">{isUser ? "🧑‍🎓" : "🤖"}</div>
          <div className="message-bubble">
            {flashcardData.remainingText && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {flashcardData.remainingText}
              </ReactMarkdown>
            )}
            {cardGroups.map((group, i) => (
              <FlashcardGrid key={i} cards={group} />
            ))}
          </div>
        </div>
      );
    }
  }

  // Default: render as markdown
  return (
    <div className={`message-row ${role}`}>
      <div className="message-avatar">{isUser ? "🧑‍🎓" : "🤖"}</div>
      <div className="message-bubble">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
