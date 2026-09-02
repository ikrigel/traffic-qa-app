/* eslint-disable no-console */
'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  isListening: boolean;
}

export default function VoiceRecordingIndicator({ isListening }: Props) {
  const [amplitude, setAmplitude] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isListening) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAmplitude(0);
      return;
    }

    const initAudioContext = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount) as any;
        dataArrayRef.current = dataArray;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const updateAmplitude = () => {
          if (analyserRef.current && dataArrayRef.current) {
            (analyserRef.current.getByteFrequencyData as any)(dataArrayRef.current);
            const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
            setAmplitude(Math.min(100, (average / 255) * 100));
          }
          animationRef.current = requestAnimationFrame(updateAmplitude);
        };

        updateAmplitude();
      } catch (err) {
        console.error('[VOICE] Failed to initialize audio context:', err);
      }
    };

    initAudioContext();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isListening]);

  if (!isListening) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex-1">
        <p className="text-xs font-semibold text-blue-900 mb-2">🎤 Recording...</p>
        <div className="w-full h-8 bg-blue-100 rounded-lg overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-75"
            style={{ width: `${amplitude}%` }}
          />
        </div>
        <p className="text-xs text-blue-700 mt-1">{Math.round(amplitude)}% volume</p>
      </div>
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-blue-500 rounded transition-all duration-100"
            style={{
              height: `${Math.max(4, (amplitude / 100) * (20 + i * 4))}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
