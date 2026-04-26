import { useState } from "react";

/**
 * QuizBlock — Renders MCQ questions with clickable options.
 * Highlights correct/wrong answers. Score tracked at bottom.
 *
 * Props:
 *   questions: Array of { question, options: [{ letter, text }], answer: "A"|"B"|"C"|"D" }
 */
export default function QuizBlock({ questions }) {
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const handleOptionClick = (qIndex, letter) => {
    // Already answered this question
    if (answers[qIndex] !== undefined) return;

    const isCorrect = letter === questions[qIndex].answer;

    setAnswers((prev) => ({ ...prev, [qIndex]: letter }));
    setTotalAnswered((prev) => prev + 1);
    if (isCorrect) setScore((prev) => prev + 1);
  };

  const getOptionClass = (qIndex, letter) => {
    const selected = answers[qIndex];
    if (selected === undefined) return "";

    const isLocked = "locked";
    const correctAnswer = questions[qIndex].answer;

    if (letter === correctAnswer) return `correct ${isLocked}`;
    if (letter === selected && letter !== correctAnswer) return `wrong ${isLocked}`;
    return isLocked;
  };

  if (!questions || questions.length === 0) return null;

  return (
    <div className="quiz-block">
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="quiz-question">
          <p className="quiz-question-text">
            {qIndex + 1}. {q.question}
          </p>
          <div className="quiz-options">
            {q.options.map((opt) => (
              <div
                key={opt.letter}
                className={`quiz-option ${getOptionClass(qIndex, opt.letter)}`}
                onClick={() => handleOptionClick(qIndex, opt.letter)}
              >
                <span className="option-letter">{opt.letter}</span>
                <span>{opt.text}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {totalAnswered > 0 && (
        <div className="quiz-score">
          <span className="score-number">
            {score}/{questions.length}
          </span>
          <p>
            {totalAnswered === questions.length
              ? "Quiz complete"
              : `${questions.length - totalAnswered} question(s) remaining`}
          </p>
        </div>
      )}
    </div>
  );
}
