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
}

export default function QuestionList({
  questions,
  showAnswers = false,
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
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="🔍 Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowPriorityOnly(!showPriorityOnly)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              showPriorityOnly
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            🔴 Priority Only
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Showing {filteredQuestions.length} of {questions.length} questions
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              id={q.id}
              question={q.question}
              answer={q.answer}
              isPriority={q.priority}
              showAnswers={showAnswers}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg">No questions found</p>
            <p className="text-sm mt-2">Try adjusting your search filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
