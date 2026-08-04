'use client';

import { useState } from 'react';

export default function RagEvaluationPanel() {
  const [question, setQuestion] = useState('');
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleEvaluate = async () => {
    if (!question.trim() || !expectedAnswer.trim()) {
      alert('Please fill in question and expected answer');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/admin/evaluations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, expectedAnswer }),
      });
      if (!response.ok) throw new Error('Failed to evaluate');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">RAG Evaluation Test</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Question</label>
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Enter test question..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Answer</label>
          <textarea
            value={expectedAnswer}
            onChange={e => setExpectedAnswer(e.target.value)}
            placeholder="Enter the correct answer..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleEvaluate}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition"
        >
          {loading ? '⏳ Evaluating...' : '🤖 Run Evaluation'}
        </button>
      </div>

      {result && (
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h4 className="font-semibold text-indigo-900 mb-3">Results</h4>
          <pre className="text-xs bg-white p-3 rounded border border-indigo-200 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
