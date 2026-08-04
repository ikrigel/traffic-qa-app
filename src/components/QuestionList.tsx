'use client';

import { useState } from 'react';
import QuestionCard from './QuestionCard';

interface Question {
  id: number;
  question: string;
  answer: string;
  priority?: boolean;
}

interface QuestionListProps {
  questions: Question[];
  showAnswers?: boolean;
  enableTesting?: boolean;
}

export default function QuestionList({
  questions,
  showAnswers = false,
  enableTesting = false,
}: QuestionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = !showPriorityOnly || q.priority;

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col gap-2 sm:gap-3">
          <input
            type="text"
            placeholder="🔍 חפש שאלות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowPriorityOnly(!showPriorityOnly)}
            className={`px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base active:scale-95 ${
              showPriorityOnly
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            🔴 שאלות חשובות
          </button>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          {filteredQuestions.length} מתוך {questions.length} שאלות
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-3 sm:space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              id={q.id}
              question={q.question}
              answer={q.answer}
              isPriority={q.priority}
              showAnswers={showAnswers}
              enableTesting={enableTesting}
            />
          ))
        ) : (
          <div className="text-center py-8 sm:py-12 text-gray-600 px-4">
            <p className="text-base sm:text-lg font-semibold">לא נמצאו שאלות</p>
            <p className="text-xs sm:text-sm mt-2">נסה להתאים את מסננים החיפוש שלך</p>
          </div>
        )}
      </div>
    </div>
  );
}
