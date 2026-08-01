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
      className={`rounded-lg border-2 p-3 sm:p-4 md:p-6 transition-all active:scale-98 ${
        isPriority
          ? 'border-red-400 bg-red-50 hover:shadow-md'
          : 'border-gray-300 bg-white hover:shadow-md'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-bold text-base sm:text-lg text-gray-800">Q{id}</span>
            {isPriority && (
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded whitespace-nowrap">
                חשוב
              </span>
            )}
          </div>
          <p className="text-gray-800 font-semibold text-sm sm:text-base leading-relaxed">
            {question}
          </p>
        </div>
      </div>

      {/* Answer Section */}
      {(showAnswers || isExpanded) && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-gray-200">
          <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 rounded">
            <p className="text-gray-800 text-sm sm:text-base leading-relaxed">{answer}</p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!showAnswers && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition active:scale-95"
        >
          {isExpanded ? '🔼 הסתר תשובה' : '🔽 הצג תשובה'}
        </button>
      )}
    </div>
  );
}
