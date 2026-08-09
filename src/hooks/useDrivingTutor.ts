'use client';

import { useState, useCallback } from 'react';
import type { TutorRequest, TutorResponse, TutorMode } from '@/lib/rag/tutorTypes';

export const useDrivingTutor = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; citations?: any[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<TutorMode>('tutor');

  const sendMessage = useCallback(
    async (message: string, tutorMode: TutorMode = 'tutor') => {
      try {
        setError(null);
        setLoading(true);

        const request: TutorRequest = {
          message,
          mode: tutorMode,
        };

        const response = await fetch('/api/tutor/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message ?? 'Failed to get tutor response');
        }

        const data = (await response.json()) as TutorResponse;

        setMessages(prev => [
          ...prev,
          { role: 'user', content: message },
          { role: 'assistant', content: data.answer, citations: data.citations },
        ]);

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    mode,
    setMode,
    sendMessage,
    clearHistory,
  };
};
