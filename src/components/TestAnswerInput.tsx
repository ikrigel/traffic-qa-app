'use client';

import { useState, useRef, useEffect } from 'react';

interface TestResult {
  verdict: 'correct' | 'partial' | 'incorrect';
  feedback: string;
  metrics?: Record<string, number>;
}

interface Props {
  questionId: number;
  questionText: string;
  correctAnswer: string;
  onClose: () => void;
}

export default function TestAnswerInput({ questionId, questionText, correctAnswer, onClose }: Props) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [inputMethod, setInputMethod] = useState<'typed' | 'voice'>('typed');
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported on your device or browser');
      return;
    }

    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'he-IL';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        if (fullTranscript.trim()) {
          setAnswer(prev => (prev ? prev + ' ' + fullTranscript.trim() : fullTranscript.trim()));
          setInputMethod('voice');
        }
      };
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      alert('Failed to start voice input. Please try again.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) {
      alert('Please provide an answer');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test/evaluate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          questionText,
          correctAnswer,
          userAnswer: answer,
          inputMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Server error: ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!data.verdict) {
        throw new Error('Invalid response from server');
      }
      setResult(data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Evaluation error:', errorMsg);

      // Check if it's a setup/configuration error
      if (
        errorMsg.includes('GEMINI_API_KEY') ||
        errorMsg.includes('Gemini') ||
        errorMsg.toLowerCase().includes('configuration')
      ) {
        window.location.href = '/setup?error=gemini';
        return;
      }

      if (
        errorMsg.includes('SUPABASE') ||
        errorMsg.includes('database') ||
        errorMsg.toLowerCase().includes('configuration')
      ) {
        window.location.href = '/setup?error=supabase';
        return;
      }

      alert('❌ Error: ' + errorMsg + '\n\nTip: If this persists, check the Setup page (/setup)');
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = {
    correct: 'bg-green-100 border-green-300 text-green-800',
    partial: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    incorrect: 'bg-red-100 border-red-300 text-red-800',
  };

  const verdictEmoji = {
    correct: '✅',
    partial: '⚠️',
    incorrect: '❌',
  };

  return (
    <div className="space-y-4 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200" data-testid="test-input-container">
      <h4 className="font-semibold text-indigo-900">בחן אותי (Test Me)</h4>

      {!result ? (
        <div className="space-y-3">
          <textarea
            value={answer}
            onChange={e => { setAnswer(e.target.value); setInputMethod('typed'); }}
            placeholder="Type your answer here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            data-testid="answer-textarea"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !answer.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition"
            >
              {loading ? '⏳ Grading...' : '📝 Submit Answer'}
            </button>

            {voiceSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  isListening
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isListening ? '⏹️ Stop' : '🎤 Voice'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold transition"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className={`rounded-lg p-4 border-2 ${verdictColor[result.verdict]}`} data-testid="verdict-result">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{verdictEmoji[result.verdict]}</span>
            <span className="font-bold text-lg capitalize" data-testid="verdict-text">{result.verdict}</span>
          </div>
          <p className="mb-3">{result.feedback}</p>

          {result.metrics && (
            <div className="text-xs space-y-1 mb-3 opacity-75">
              {Object.entries(result.metrics).map(([key, value]) => (
                <p key={key}>{key}: {typeof value === 'number' ? value.toFixed(2) : value}</p>
              ))}
            </div>
          )}

          <button
            onClick={() => { setResult(null); setAnswer(''); }}
            className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold text-sm transition"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
