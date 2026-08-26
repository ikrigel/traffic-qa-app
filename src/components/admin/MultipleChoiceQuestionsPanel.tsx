'use client';

import { useState, useEffect } from 'react';
import { useAdminQuestions, type AdminQuestion, type QuestionOption } from '@/hooks/useAdminQuestions';

interface Course {
  id: string;
  title: string;
}

export default function MultipleChoiceQuestionsPanel() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'free_text'>('multiple_choice');
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<QuestionOption[]>([
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ]);
  const { fetchQuestions, createQuestion, deleteQuestion, loading, error } = useAdminQuestions();

  useEffect(() => {
    const load = async () => {
      const data = await fetchQuestions();
      setQuestions(data);
    };
    load();
  }, [fetchQuestions]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch('/api/admin/courses', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    };
    loadCourses();
  }, []);

  const handleAddOption = () => {
    setOptions([...options, { text: '', is_correct: false }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, field: 'text' | 'is_correct', value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleCreateQuestion = async () => {
    if (!questionText.trim()) {
      alert('Question text is required');
      return;
    }

    if (questionType === 'multiple_choice') {
      const validOptions = options.filter(o => o.text.trim());
      if (validOptions.length < 2) {
        alert('At least 2 options are required for multiple choice');
        return;
      }
      if (!validOptions.some(o => o.is_correct)) {
        alert('At least one option must be marked as correct');
        return;
      }
    }

    const q = await createQuestion(
      questionText,
      questionType,
      questionType === 'multiple_choice' ? options.filter(o => o.text.trim()) : undefined,
      category,
      difficulty,
      Array.from(selectedCourses)
    );

    if (q) {
      setQuestions([q, ...questions]);
      setQuestionText('');
      setCategory('');
      setDifficulty('medium');
      setSelectedCourses(new Set());
      setOptions([{ text: '', is_correct: false }, { text: '', is_correct: false }]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    const success = await deleteQuestion(id);
    if (success) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-purple-50 border border-purple-300 rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-purple-900">Create Question</h4>

        <select
          value={questionType}
          onChange={e => setQuestionType(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
        >
          <option value="multiple_choice">❓ Multiple Choice</option>
          <option value="free_text">📝 Free Text</option>
        </select>

        <textarea
          placeholder="Question text"
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
        />

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Category (optional)"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="bg-white rounded p-3 border border-purple-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">🎓 Available in Courses (Select one or more)</p>
          <p className="text-xs text-gray-500 mb-3">Questions can be assigned to multiple courses at once</p>
          {courses.length === 0 ? (
            <p className="text-xs text-red-600">⚠️ No courses available. Create courses first in the Courses tab.</p>
          ) : (
            <div className="space-y-2">
              {courses.map(course => (
                <label key={course.id} className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedCourses.has(course.id)}
                    onChange={e => {
                      const newSelected = new Set(selectedCourses);
                      if (e.target.checked) {
                        newSelected.add(course.id);
                      } else {
                        newSelected.delete(course.id);
                      }
                      setSelectedCourses(newSelected);
                    }}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <span className="text-sm text-gray-700 font-medium">{course.title}</span>
                  {selectedCourses.has(course.id) && <span className="text-xs text-green-600 ml-auto">✅ Selected</span>}
                </label>
              ))}
            </div>
          )}
        </div>

        {questionType === 'multiple_choice' && (
          <div className="space-y-3 bg-white rounded p-3 border border-purple-200">
            <p className="text-sm font-semibold text-gray-700">Answer Options</p>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt.text}
                  onChange={e => handleOptionChange(idx, 'text', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                />
                <label className="flex items-center gap-2 whitespace-nowrap cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opt.is_correct}
                    onChange={e => handleOptionChange(idx, 'is_correct', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Correct</span>
                </label>
                {options.length > 2 && (
                  <button
                    onClick={() => handleRemoveOption(idx)}
                    className="px-2 py-2 text-red-600 hover:bg-red-50 rounded text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddOption}
              className="w-full px-3 py-2 border border-dashed border-purple-400 rounded text-purple-700 hover:bg-purple-50 text-sm font-semibold"
            >
              ➕ Add Option
            </button>
          </div>
        )}

        <button
          onClick={handleCreateQuestion}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-semibold"
        >
          ✅ Create Question
        </button>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800">All Questions ({questions.length})</h4>
        {questions.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No questions created yet</p>
        ) : (
          questions.map(q => (
            <div key={q.id} className="bg-white border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{q.question_text}</p>
                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {q.question_type === 'multiple_choice' ? '❓ Multiple Choice' : '📝 Free Text'}
                    </span>
                    {q.category && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{q.category}</span>}
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{q.difficulty}</span>
                    {q.is_published && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ Published</span>}
                  </div>
                  {q.courses && q.courses.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-xs text-gray-600 font-semibold">🎓 Courses:</span>
                      {q.courses.map(c => (
                        <span key={c.id} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded">
                          {c.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={loading}
                  className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  🗑️
                </button>
              </div>

              {q.question_type === 'multiple_choice' && q.options && q.options.length > 0 && (
                <div className="mt-3 space-y-1 bg-gray-50 p-3 rounded text-sm">
                  {q.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span>{opt.is_correct ? '✅' : '○'}</span>
                      <span className={opt.is_correct ? 'font-semibold text-green-700' : 'text-gray-700'}>
                        {opt.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
