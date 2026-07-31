'use client';

import { useState } from 'react';

interface QuestionCardProps {
  id: number;
  question: string;
  answer: string;
  isPriority?: boolean;
  showAnswers?: boolean;
}

export default function QuestionCard({
  id,
  question,
  answer,
  isPriority = false,
  showAnswers = false,
}: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border-2 p-6 transition-all ${
        isPriority
          ? 'border-red-400 bg-red-50 hover:shadow-md'
          : 'border-gray-300 bg-white hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-lg text-gray-800">Q{id}</span>
            {isPriority && (
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded">
                PRIORITY
              </span>
            )}
          </div>
          <p className="text-gray-800 font-semibold text-base leading-relaxed">
            {question}
          </p>
        </div>
      </div>

      {/* Answer Section */}
      {(showAnswers || isExpanded) && (
        <div className="mt-4 pt-4 border-t-2 border-gray-200">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-gray-800 text-base leading-relaxed">{answer}</p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!showAnswers && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
        >
          {isExpanded ? '🔼 Hide Answer' : '🔽 Show Answer'}
        </button>
      )}
    </div>
  );
}
