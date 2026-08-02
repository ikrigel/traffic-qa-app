import { logError } from './logger';
import type { RagasMetrics } from '@/types';

// TODO: Integrate @ikrigel/ragas-lib-typescript once it's properly published on npm
// For now, using fallback evaluation metrics implementation
// The real RAGAS library can be installed from: https://github.com/ikrigel/ragas-lib-typescript

const computeFallbackMetrics = (
  answer: string,
  context: string,
  groundTruth?: string
): RagasMetrics => {
  const answerWords = answer.toLowerCase().split(/\s+/).filter(w => w);
  const contextWords = context.toLowerCase().split(/\s+/).filter(w => w);
  const truthWords = (groundTruth || '').toLowerCase().split(/\s+/).filter(w => w);

  // Faithfulness: word overlap with context
  const faithfulnessScore = contextWords.length > 0
    ? answerWords.filter(w => contextWords.includes(w)).length / Math.max(answerWords.length, 1)
    : 0;

  // Relevance: word overlap with ground truth
  const relevanceScore = truthWords.length > 0
    ? answerWords.filter(w => truthWords.includes(w)).length / Math.max(answerWords.length, 1)
    : 0;

  return {
    faithfulness: Math.min(Math.max(faithfulnessScore, 0), 1),
    relevance: Math.min(Math.max(relevanceScore, 0), 1),
    coherence: 0.8,
    contextPrecision: Math.min(Math.max(faithfulnessScore, 0), 1),
    contextRecall: Math.min(Math.max(relevanceScore, 0), 1),
  };
};

export const evaluateAnswer = async (
  _question: string,
  answer: string,
  context: string,
  groundTruth?: string
): Promise<RagasMetrics> => {
  try {
    // Use fallback metric computation until RAGAS library is published
    return computeFallbackMetrics(answer, context, groundTruth);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Evaluation failed';
    await logError({ source: 'ragasClient.evaluateAnswer', message });
    // Return safe default metrics
    return {
      faithfulness: 0.5,
      relevance: 0.5,
      coherence: 0.5,
      contextPrecision: 0.5,
      contextRecall: 0.5,
    };
  }
};
