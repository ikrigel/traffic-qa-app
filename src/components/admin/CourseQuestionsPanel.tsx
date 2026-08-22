'use client';

import { useState, useEffect } from 'react';
import { useAdminCourseQuestions, type CourseQuestion } from '@/hooks/useAdminCourseQuestions';
import { TRAFFIC_LAWS_QUESTIONS } from '@/lib/traffic-law-questions';

interface Props {
  courseId: string;
}

export default function CourseQuestionsPanel({ courseId }: Props) {
  const [courseQuestions, setCourseQuestions] = useState<CourseQuestion[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | ''>('');
  const [isRequired, setIsRequired] = useState(false);
  const { fetchCourseQuestions, addQuestion, removeQuestion, loading, error } =
    useAdminCourseQuestions(courseId);

  useEffect(() => {
    const load = async () => {
      const data = await fetchCourseQuestions();
      setCourseQuestions(data);
    };
    load();
  }, [fetchCourseQuestions]);

  const handleAdd = async () => {
    if (!selectedQuestionId) {
      alert('Select a question');
      return;
    }
    const cq = await addQuestion(selectedQuestionId, isRequired);
    if (cq) {
      setCourseQuestions([...courseQuestions, cq]);
      setSelectedQuestionId('');
      setIsRequired(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Remove this question from the course?')) return;
    const success = await removeQuestion(id);
    if (success) {
      setCourseQuestions(courseQuestions.filter(cq => cq.id !== id));
    }
  };

  const addedQuestionIds = new Set(courseQuestions.map(cq => cq.question_id));
  const availableQuestions = TRAFFIC_LAWS_QUESTIONS.filter(q => !addedQuestionIds.has(q.id));

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-blue-900">Add Question</h4>
        <select
          value={selectedQuestionId}
          onChange={e => setSelectedQuestionId(e.target.value ? Number(e.target.value) : '')}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a question --</option>
          {availableQuestions.map(q => (
            <option key={q.id} value={q.id}>
              Q{q.id}: {q.hebrew}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={e => setIsRequired(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">Required for completion</span>
        </label>
        <button
          onClick={handleAdd}
          disabled={loading || !selectedQuestionId}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-semibold"
        >
          ➕ Add Question
        </button>
      </div>

      <div className="space-y-2">
        {courseQuestions.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No questions added yet</p>
        ) : (
          courseQuestions.map(cq => (
            <div key={cq.id} className="bg-white border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    Q{cq.question_id}: {cq.question?.hebrew || 'Unknown'}
                  </p>
                  {cq.question?.answer && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{cq.question.answer}</p>
                  )}
                  {cq.is_required && (
                    <p className="text-xs text-red-600 mt-2 font-semibold">⭐ Required</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(cq.id)}
                  disabled={loading}
                  className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
