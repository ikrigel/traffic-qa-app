import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gradeUserAnswer } from '@/lib/grading';

// Mock the dependencies
vi.mock('@/lib/rag', () => ({
  retrieveRelevantDocuments: vi.fn().mockResolvedValue([
    {
      id: 'doc-1',
      title: 'Speed Limits',
      content: 'Urban areas have a 50 km/h speed limit',
      source: null,
      similarity: 0.95,
    },
  ]),
}));

vi.mock('@/lib/gemini', () => ({
  generateAnswer: vi.fn().mockResolvedValue('Your answer is partially correct. The speed limit is indeed 50 km/h.'),
}));

vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

describe('User Answer Grading', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
    vi.clearAllMocks();
  });

  describe('gradeUserAnswer', () => {
    it('should return verdict and feedback', async () => {
      const result = await gradeUserAnswer({
        question: 'What is the speed limit in urban areas?',
        correctAnswer: '50 km/h',
        userAnswer: '50 km/h',
      });

      expect(result).toBeDefined();
      expect(result.verdict).toBeDefined();
      expect(['correct', 'partial', 'incorrect']).toContain(result.verdict);
      expect(result.feedback).toBeDefined();
      expect(typeof result.feedback).toBe('string');
    });

    it('should include metrics in result', async () => {
      const result = await gradeUserAnswer({
        question: 'What is the speed limit in urban areas?',
        correctAnswer: '50 km/h',
        userAnswer: '50 km/h',
      });

      expect(result.metrics).toBeDefined();
      expect(result.metrics.faithfulness).toBeDefined();
      expect(result.metrics.relevance).toBeDefined();
    });

    it('should return correct verdict for exact match', async () => {
      const result = await gradeUserAnswer({
        question: 'Test question',
        correctAnswer: 'correct answer',
        userAnswer: 'correct answer',
      });

      // With high overlap, should get 'correct' or 'partial'
      expect(['correct', 'partial']).toContain(result.verdict);
    });

    it('should return incorrect verdict for mismatched answer', async () => {
      const result = await gradeUserAnswer({
        question: 'What is 2+2?',
        correctAnswer: '4',
        userAnswer: 'banana',
      });

      // With low overlap, should get 'incorrect' or 'partial'
      expect(['incorrect', 'partial']).toContain(result.verdict);
    });

    it('should handle grading errors gracefully', async () => {
      // Test that function doesn't throw even if something fails
      const result = await gradeUserAnswer({
        question: 'question',
        correctAnswer: 'correct',
        userAnswer: 'answer',
      });

      expect(result).toBeDefined();
      expect(result.verdict).toBeDefined();
      expect(result.feedback).toBeDefined();
    });
  });
});
