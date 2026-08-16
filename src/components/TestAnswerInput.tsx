'use client';

import { useState, useRef, useEffect } from 'react';
import MicrophonePermissionGuide from './MicrophonePermissionGuide';

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
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [inputMethod, setInputMethod] = useState<'typed' | 'voice'>('typed');
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for Speech Recognition API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const supported = !!SpeechRecognition;
    setVoiceSupported(supported);

    console.log('[VOICE] Speech Recognition API:', supported ? '✅ Supported' : '❌ Not supported');
    console.log('[VOICE] Browser:', navigator.userAgent);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('[VOICE] Permission guide state changed:', { showPermissionGuide, voiceError });
  }, [showPermissionGuide, voiceError]);

  const startListening = async () => {
    setVoiceError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Speech recognition not supported');
      console.error('[VOICE] Speech Recognition not available');
      return;
    }

    try {
      console.log('[VOICE] Starting speech recognition...');
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'he-IL';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        console.log('[VOICE] 🎤 Listening started');
        setIsListening(true);
        setVoiceError(null);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          console.log('[VOICE] ⏱️ Timeout - stopping listening');
          stopListening();
        }, 30000);
      };

      recognitionRef.current.onend = () => {
        console.log('[VOICE] 🎤 Listening ended');
        setIsListening(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('[VOICE] ❌ Error:', event.error);
        setIsListening(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const permissionErrors = ['permission-denied', 'not-allowed', 'network-error'];
        const isPermissionError = permissionErrors.includes(event.error);

        const errorMessages: Record<string, string> = {
          'no-speech': '🔇 No speech detected. Please try again.',
          'audio-capture': '🎤 Microphone not found or permission denied.',
          'network': '🌐 Network error. Check your connection.',
          'permission-denied': '🔒 Microphone permission denied. Check browser settings.',
          'not-allowed': '🔒 Microphone access not allowed.',
          'service-not-allowed': '🚫 Voice input is not available in this context.',
        };

        const errorMsg = errorMessages[event.error] || `Voice input error: ${event.error}`;
        setVoiceError(errorMsg);

        if (isPermissionError) {
          console.error('[VOICE] 📖 Showing permission guide for error:', event.error);
          setShowPermissionGuide(true);
        } else {
          console.error('[VOICE] Not a permission error, guide will not show');
        }

        console.error('[VOICE] Error message:', errorMsg);
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        console.log('[VOICE] 📝 Processing results, count:', event.results.length);

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            console.log('[VOICE] ✅ Final:', transcript, `(${(confidence * 100).toFixed(0)}%)`);
          } else {
            interimTranscript += transcript;
            console.log('[VOICE] 💬 Interim:', transcript);
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        if (fullTranscript.trim()) {
          setAnswer(prev => (prev ? prev + ' ' + fullTranscript.trim() : fullTranscript.trim()));
          setInputMethod('voice');
          console.log('[VOICE] 📤 Updated answer');
        }
      };

      console.log('[VOICE] 🚀 Starting recognition...');
      recognitionRef.current.start();
    } catch (error) {
      console.error('[VOICE] ❌ Failed to start:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to start voice input';
      setVoiceError(errorMsg);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      console.log('[VOICE] ⏹️ Stopping...');
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('[VOICE] Error stopping:', error);
      }
      setIsListening(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
        throw Object.assign(new Error(errorData.error?.message || `Server error: ${response.status}`), { errorData });
      }

      const data = await response.json();
      if (!data.verdict) {
        throw new Error('Invalid response from server');
      }
      setResult(data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any).errorData?.error?.code;
      console.error('Evaluation error:', errorMsg, errorCode);

      if (errorCode === 'NO_API_KEY') {
        alert('🔑 You need to add an API key to use answer grading!\n\nClick the ⚙️ Settings button at the top, then go to "🔑 API Keys" and add a key from:\n- Groq (free & fast)\n- Google Gemini (free)\n- OpenAI (paid)\n- HuggingFace (free)');
        return;
      }

      if (errorCode === 'ALL_KEYS_FAILED') {
        alert('⚠️ All your API keys failed. Please check your keys in Settings or add a new one.');
        return;
      }

      alert('❌ Error: ' + errorMsg + '\n\nIf this persists, please add an API key in Settings (⚙️) → 🔑 API Keys');
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

          {voiceError && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {voiceError}
            </div>
          )}

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
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  isListening
                    ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
                title={voiceError || (isListening ? 'Stop listening' : 'Click to start voice input (Hebrew)')}
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

      <MicrophonePermissionGuide
        isOpen={showPermissionGuide}
        onClose={() => setShowPermissionGuide(false)}
        onRetry={() => {
          setShowPermissionGuide(false);
          setVoiceError(null);
          startListening();
        }}
      />
    </div>
  );
}
