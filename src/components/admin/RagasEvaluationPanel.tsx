'use client';

import { useState } from 'react';
import type { RagasMetrics } from '@/types';

export default function RagasEvaluationPanel() {
  const [question, setQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ metrics: RagasMetrics; verdict: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!question.trim() || !userAnswer.trim()) {
      setError('Question and user answer are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/ragas-evaluate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userAnswer,
          context: context || '',
          correctAnswer: correctAnswer || undefined,
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  const MetricBar = ({ label, value }: { label: string; value: number }) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-bold ${value > 0.8 ? 'text-green-600' : value > 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${value > 0.8 ? 'bg-green-500' : value > 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">🧪 RAGAS Evaluation Tester</h3>
        <p className="text-sm text-gray-600">Test RAGAS metrics for answer evaluation. Metrics: Faithfulness, Relevance, Coherence, Context Precision, Context Recall</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question *</label>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Enter the question..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">User Answer *</label>
          <textarea
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            placeholder="Enter the user's answer..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer (Optional)</label>
          <textarea
            value={correctAnswer}
            onChange={e => setCorrectAnswer(e.target.value)}
            placeholder="Enter the correct answer (for relevance evaluation)..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Context (Optional)</label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Enter context documents from RAG (for faithfulness evaluation)..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleEvaluate}
          disabled={loading || !question.trim() || !userAnswer.trim()}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition"
        >
          {loading ? '⏳ Evaluating...' : '🧪 Run Evaluation'}
        </button>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      </div>

      {result && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">📊 Results</h4>

          <div
            className={`p-4 rounded-lg font-bold text-white text-center text-xl ${
              result.verdict === 'correct' ? 'bg-green-500' : result.verdict === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          >
            {result.verdict === 'correct' ? '✅ CORRECT' : result.verdict === 'partial' ? '⚠️ PARTIAL' : '❌ INCORRECT'}
          </div>

          <div className="space-y-4">
            <MetricBar label="Faithfulness (matches context)" value={result.metrics.faithfulness ?? 0} />
            <MetricBar label="Relevance (matches correct answer)" value={result.metrics.relevance ?? 0} />
            <MetricBar label="Coherence (answer quality)" value={result.metrics.coherence ?? 0} />
            <MetricBar label="Context Precision" value={result.metrics.contextPrecision ?? 0} />
            <MetricBar label="Context Recall" value={result.metrics.contextRecall ?? 0} />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> Faithfulness checks if answer matches context. Relevance checks if answer matches correct answer. Coherence checks answer quality. Context metrics evaluate RAG retrieval.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
