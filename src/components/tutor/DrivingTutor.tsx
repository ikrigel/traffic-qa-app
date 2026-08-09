'use client';

import { useState } from 'react';
import { useDrivingTutor } from '@/hooks/useDrivingTutor';
import TutorModeSelector from './TutorModeSelector';
import SourceCitation from './SourceCitation';

export default function DrivingTutor() {
  const { messages, loading, error, mode, setMode, sendMessage, clearHistory } = useDrivingTutor();
  const [input, setInput] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    try {
      await sendMessage(userMessage, mode);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">🚗 מדריך דיני תעבורה</h2>
        <button
          onClick={clearHistory}
          className="text-sm px-2 py-1 bg-gray-300 hover:bg-gray-400 rounded transition"
        >
          🗑️ נקה
        </button>
      </div>

      <TutorModeSelector mode={mode} onModeChange={setMode} />

      <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center mt-40">
            <p>ברוכים הבאים למדריך דיני התעבורה!</p>
            <p className="text-sm mt-2">שאלו שאלה או בקשו הסברים על דיני התעבורה</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.citations && msg.role === 'assistant' && (
                    <SourceCitation citations={msg.citations} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                  <p className="text-sm text-gray-600">מחשבת...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="שאלו שאלה..."
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition font-medium"
        >
          {loading ? 'שולח...' : 'שלח'}
        </button>
      </form>
    </div>
  );
}
