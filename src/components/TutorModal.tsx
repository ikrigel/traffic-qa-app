'use client';

import { useState, useEffect, useRef } from 'react';
import { useDrivingTutor } from '@/hooks/useDrivingTutor';
import TutorModeSelector from './tutor/TutorModeSelector';
import SourceCitation from './tutor/SourceCitation';

interface TutorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODE_INFO = {
  tutor: {
    title: '📚 מדריך - שיחה חופשית',
    description: 'שוחח עם מדריך דיני תעבורה בחכם. שאל כל שאלה וקבל הסברים מלאים עם דוגמאות.',
  },
  quiz: {
    title: '🎯 חידון - אימון',
    description: 'בחן את עצמך עם שאלות אחת בכל פעם. מצוין לאימון וחזרה על חומר.',
  },
  exam_answer: {
    title: '✍️ תשובת בחינה - הכנה לבחינה',
    description: 'קבל תשובות בסגנון בחינה רשמי. מתאים להכנה לבחינת הנהיגה.',
  },
  summary: {
    title: '📋 סיכום - סקירה מהירה',
    description: 'קבל סיכום מקוצר של נושא. מתאים לחזרה מהירה.',
  },
};

export default function TutorModal({ isOpen, onClose }: TutorModalProps) {
  const { messages, loading, error, mode, setMode, sendMessage, clearHistory } = useDrivingTutor();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen) return null;

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

  const modeInfo = MODE_INFO[mode as keyof typeof MODE_INFO];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-500 to-indigo-600">
          <div>
            <h2 className="text-xl font-bold text-white">🚗 מדריך דיני תעבורה</h2>
            <p className="text-sm text-blue-100">מדריך בינה מלאכותית לדיני תעבורה בישראל</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-500 p-2 rounded transition text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Mode Information */}
        <div className="px-4 pt-4 bg-blue-50 border-b">
          <p className="font-semibold text-blue-900">{modeInfo.title}</p>
          <p className="text-sm text-blue-700 mt-1">{modeInfo.description}</p>
        </div>

        {/* Mode Selector */}
        <div className="px-4 py-3 bg-white">
          <p className="text-xs text-gray-600 font-semibold mb-2">בחר מצב:</p>
          <TutorModeSelector mode={mode} onModeChange={setMode} />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center mt-12 text-gray-500">
              <p className="text-lg font-semibold mb-2">👋 ברוכים הבאים!</p>
              <p className="text-sm mb-4">בחר מצב למעלה והתחל לשאול שאלות</p>
              <div className="bg-white rounded-lg p-4 text-sm text-gray-700 text-right">
                <p className="font-semibold mb-2">💡 טיפים:</p>
                <ul className="space-y-1 text-xs">
                  <li>• השתמש במדריך לשאלות כלליות והסברים מעמיקים</li>
                  <li>• השתמש בחידון לאימון עם שאלות יחידות</li>
                  <li>• השתמש בתשובת בחינה להכנה לבחינה</li>
                  <li>• השתמש בסיכום לחזרה מהירה</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
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
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg animate-pulse">
                    <p className="text-sm">⏳ מחשבת...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="שאל שאלה..."
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              dir="rtl"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? '⏳' : '📤'}
            </button>
            <button
              type="button"
              onClick={() => clearHistory()}
              disabled={messages.length === 0}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition text-sm"
              title="נקה את ההיסטוריה"
            >
              🗑️
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
