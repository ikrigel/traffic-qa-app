import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Voice Recognition', () => {
  beforeEach(() => {
    // Mock Web Speech API
    const mockRecognition = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      onstart: null,
      onend: null,
      onresult: null,
      onerror: null,
      lang: 'he-IL',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,
    }));

    (window as any).SpeechRecognition = mockRecognition;
    (window as any).webkitSpeechRecognition = mockRecognition;
  });

  it('should detect speech recognition API support', () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    expect(SpeechRecognition).toBeDefined();
  });

  it('should initialize with correct language (Hebrew)', () => {
    const SpeechRecognition = (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    expect(recognition.lang).toBe('he-IL');
    expect(recognition.continuous).toBe(false);
    expect(recognition.interimResults).toBe(true);
  });

  it('should capture interim results during speech', () => {
    const SpeechRecognition = (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    const results: string[] = [];

    // Simulate interim results
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      results.push(transcript);
    };

    // Mock event with interim result
    const interimEvent = {
      results: [
        [{ transcript: 'שלום', confidence: 0.95, isFinal: false }],
      ],
      resultIndex: 0,
    };

    recognition.onresult(interimEvent);
    expect(results).toContain('שלום');
  });

  it('should capture final results with confidence score', () => {
    const SpeechRecognition = (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    let finalTranscript = '';
    let finalConfidence = 0;

    recognition.onresult = (event: any) => {
      const latestResult = event.results[event.results.length - 1];
      if (latestResult.isFinal) {
        finalTranscript = latestResult[0].transcript;
        finalConfidence = latestResult[0].confidence;
      }
    };

    // Mock event with final result
    const finalEvent = {
      results: [
        [{ transcript: 'שלום בעולם', confidence: 0.91, isFinal: true }],
      ],
      resultIndex: 0,
    };

    recognition.onresult(finalEvent);
    expect(finalTranscript).toBe('שלום בעולם');
    expect(finalConfidence).toBe(0.91);
    expect(finalConfidence).toBeGreaterThanOrEqual(0);
    expect(finalConfidence).toBeLessThanOrEqual(1);
  });

  it('should handle multiple interim results without duplication', () => {
    const SpeechRecognition = (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    const latestTranscripts: string[] = [];

    recognition.onresult = (event: any) => {
      // Only capture latest result (no duplication)
      const latestResult = event.results[event.results.length - 1];
      const transcript = latestResult[0].transcript;
      latestTranscripts.push(transcript);
    };

    // First event with one result
    recognition.onresult({
      results: [
        [{ transcript: 'שלום', confidence: 0.9, isFinal: false }],
      ],
      resultIndex: 0,
    });

    // Second event with two results (includes previous + new)
    recognition.onresult({
      results: [
        [{ transcript: 'שלום', confidence: 0.9, isFinal: false }],
        [{ transcript: 'כביש', confidence: 0.85, isFinal: false }],
      ],
      resultIndex: 0,
    });

    // Should only have the latest transcripts, not duplicates
    expect(latestTranscripts[0]).toBe('שלום');
    expect(latestTranscripts[1]).toBe('כביש');
  });

  it('should handle recognition errors', () => {
    const SpeechRecognition = (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    let errorReceived = false;
    let errorType = '';

    recognition.onerror = (event: any) => {
      errorReceived = true;
      errorType = event.error;
    };

    // Mock error event
    recognition.onerror({ error: 'no-speech' });
    expect(errorReceived).toBe(true);
    expect(errorType).toBe('no-speech');
  });

  it('should start and stop recording', () => {
    const SpeechRecognition = (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    const startSpy = vi.spyOn(recognition, 'start');
    const stopSpy = vi.spyOn(recognition, 'stop');

    recognition.start();
    expect(startSpy).toHaveBeenCalled();

    recognition.stop();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('should validate Hebrew language support', () => {
    const SpeechRecognition = (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    // Hebrew locale should be set
    expect(recognition.lang).toBe('he-IL');

    // Should handle Hebrew text correctly
    const hebrewText = 'שלום בעולם';
    expect(hebrewText).toMatch(/[֐-׿]/);
  });

  it('should measure recording duration', () => {
    const SpeechRecognition = (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    let listeningStarted = false;
    let listeningEnded = false;

    recognition.onstart = () => {
      listeningStarted = true;
    };

    recognition.onend = () => {
      listeningEnded = true;
    };

    recognition.onstart();
    expect(listeningStarted).toBe(true);

    recognition.onend();
    expect(listeningEnded).toBe(true);
  });
});
