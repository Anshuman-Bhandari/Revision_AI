import { useState } from "react";

/**
 * FlashcardGrid — Renders a 2×2 grid of interactive flip cards.
 * Front: question, Back: answer. Click to flip.
 *
 * Props:
 *   cards: Array of { question, answer }
 */
export default function FlashcardGrid({ cards }) {
  const [flipped, setFlipped] = useState({});

  const toggleFlip = (index) => {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!cards || cards.length === 0) return null;

  return (
    <div className="flashcard-grid">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`flashcard ${flipped[i] ? "flipped" : ""}`}
          onClick={() => toggleFlip(i)}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <span className="card-label">Question {i + 1}</span>
              <p className="card-question">{card.question}</p>
              <span className="card-hint">Click to reveal answer</span>
            </div>
            <div className="flashcard-back">
              <span className="card-label">Answer</span>
              <p className="card-answer">{card.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
