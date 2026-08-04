'use client';

import { useState } from 'react';
import { useAdminEvaluations } from '@/hooks/useAdminEvaluations';
import { useAdminTestAttempts } from '@/hooks/useAdminTestAttempts';

export default function RagEvaluationPanel() {
  const { evaluations, loading: evalLoading, error: evalError, runEvaluation } = useAdminEvaluations();
  const { attempts, loading: attemptsLoading } = useAdminTestAttempts();

  const [question, setQuestion] = useState('');
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEvaluate = async () => {
    if (!question.trim() || !expectedAnswer.trim()) {
      setMessage({ type: 'error', text: 'Please fill in question and expected answer' });
      return;
    }

    setRunning(true);
    setMessage(null);
    const evalResult = await runEvaluation(question, expectedAnswer);

    if (evalResult) {
      setResult(evalResult);
      setMessage({ type: 'success', text: '✅ Evaluation completed successfully!' });
      setQuestion('');
      setExpectedAnswer('');
    } else {
      setMessage({ type: 'error', text: '❌ Failed to run evaluation' });
    }
    setRunning(false);
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict === 'correct') return 'bg-green-100 text-green-800 border-l-4 border-green-500';
    if (verdict === 'partial') return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
    return 'bg-red-100 text-red-800 border-l-4 border-red-500';
  };

  const verdictEmoji = { correct: '✅', partial: '⚠️', incorrect: '❌' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
          <p className="text-gray-600">Manual Evaluations</p>
          <p className="text-2xl font-bold text-indigo-600">{evaluations.length}</p>
        </div>
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <p className="text-gray-600">User Test Attempts</p>
          <p className="text-2xl font-bold text-green-600">{attempts.length}</p>
        </div>
      </div>

      {/* Manual Evaluation */}
      <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200 space-y-4">
        <h4 className="font-semibold text-indigo-900">Manual RAG Evaluation Test</h4>

        {message && (
          <div
            className={`p-3 rounded ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Question</label>
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Enter a test question..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={running}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Answer</label>
          <textarea
            value={expectedAnswer}
            onChange={e => setExpectedAnswer(e.target.value)}
            placeholder="Enter the correct answer..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={running}
          />
        </div>

        <button
          onClick={handleEvaluate}
          disabled={running || !question.trim() || !expectedAnswer.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition w-full"
        >
          {running ? '⏳ Evaluating...' : '🤖 Run Evaluation'}
        </button>

        {result && (
          <div className="bg-white rounded-lg p-4 border border-indigo-300 space-y-3">
            <h5 className="font-semibold text-gray-800">Evaluation Results</h5>
            {result.metrics && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(result.metrics).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-semibold">
                      {typeof value === 'number' ? value.toFixed(3) : value}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {result.ai_answer && (
              <div>
                <p className="text-xs text-gray-600 mb-1">AI-Generated Answer:</p>
                <p className="text-sm bg-gray-50 p-2 rounded">{result.ai_answer}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Evaluations */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800">Recent Manual Evaluations ({evaluations.length})</h4>
        {evalError && <div className="text-red-600">Error: {evalError}</div>}
        {evalLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : evaluations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded text-gray-500">
            <p>No manual evaluations yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {evaluations.slice().reverse().map(evaluation => (
              <div key={evaluation.id} className="border border-gray-200 rounded p-3 text-sm">
                <p className="font-semibold text-gray-800 mb-1">{evaluation.question}</p>
                <p className="text-gray-600 text-xs mb-2">Created: {new Date(evaluation.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Test Attempts */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800">Recent User Test Attempts ({attempts.length})</h4>
        {attemptsLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : attempts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded text-gray-500">
            <p>No test attempts yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {attempts.slice().reverse().map(attempt => (
              <div key={attempt.id} className={`rounded p-3 ${getVerdictColor(attempt.verdict)}`}>
                <div className="flex gap-2 items-start mb-2">
                  <span className="text-lg">{verdictEmoji[attempt.verdict as keyof typeof verdictEmoji]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Q{attempt.question_id}: {attempt.question_text}</p>
                    <p className="text-xs opacity-75 mt-1">User: {attempt.user_answer}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs opacity-75">
                  <span>{attempt.input_method === 'voice' ? '🎤 Voice' : '📝 Typed'}</span>
                  <span>{new Date(attempt.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
