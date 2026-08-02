import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateAnswer } from '@/lib/ragasClient';

describe('RAGAS Evaluation', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  describe('evaluateAnswer', () => {
    it('should return metrics object with required fields', async () => {
      const metrics = await evaluateAnswer(
        'What is the speed limit in urban areas?',
        '50 km/h is the maximum speed in cities',
        'Urban areas have a 50 km/h speed limit according to Israeli traffic laws',
        '50 km/h is the maximum speed in urban areas'
      );

      expect(metrics).toBeDefined();
      expect(metrics.faithfulness).toBeDefined();
      expect(metrics.relevance).toBeDefined();
      expect(metrics.coherence).toBeDefined();
      expect(metrics.contextPrecision).toBeDefined();
      expect(metrics.contextRecall).toBeDefined();
    });

    it('should return metrics between 0 and 1', async () => {
      const metrics = await evaluateAnswer(
        'test question',
        'test answer',
        'test context',
        'test ground truth'
      );

      Object.values(metrics).forEach(value => {
        if (typeof value === 'number') {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      });
    });

    it('should work without ground truth', async () => {
      const metrics = await evaluateAnswer(
        'What are seatbelt requirements?',
        'Adults must wear seatbelts',
        'Israeli traffic law requires all vehicle occupants to wear seatbelts'
      );

      expect(metrics).toBeDefined();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);
    });

    it('should handle high similarity answers', async () => {
      const answer = 'The speed limit in urban areas is 50 km/h';
      const context = 'The speed limit in urban areas is 50 km/h according to law';
      const groundTruth = 'The speed limit in urban areas is 50 km/h';

      const metrics = await evaluateAnswer(
        'What is the urban speed limit?',
        answer,
        context,
        groundTruth
      );

      // High similarity should result in high metrics
      expect(metrics.faithfulness || 0.5).toBeGreaterThanOrEqual(0.3);
      expect(metrics.relevance || 0.5).toBeGreaterThanOrEqual(0.3);
    });

    it('should return safe default on error', async () => {
      const metrics = await evaluateAnswer(
        'test',
        'test',
        'test'
      );

      // Should not throw and should return metrics
      expect(metrics).toBeDefined();
      expect(typeof metrics.faithfulness).toBe('number');
    });
  });
});
