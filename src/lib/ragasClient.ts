import { RAGAssessment, Faithfulness, Relevance, Coherence, ContextPrecision, ContextRecall, GeminiProvider } from '@ikrigel/ragas-lib-typescript';
import { logError } from './logger';
import type { RagasMetrics } from '@/types';

let ragassessment: RAGAssessment | null = null;

const initRAGAssessment = () => {
  if (!ragassessment) {
    const config = {
      provider: new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY || '',
      }),
    };
    ragassessment = new RAGAssessment(config);
    ragassessment.registerMetric(new Faithfulness());
    ragassessment.registerMetric(new Relevance());
    ragassessment.registerMetric(new Coherence());
    ragassessment.registerMetric(new ContextPrecision());
    ragassessment.registerMetric(new ContextRecall());
  }
  return ragassessment;
};

export const evaluateAnswer = async (
  question: string,
  answer: string,
  context: string,
  groundTruth?: string
): Promise<RagasMetrics> => {
  try {
    const rag = initRAGAssessment();
    const results = await rag.evaluate({
      question,
      answer,
      contexts: [context],
      groundTruth: groundTruth || undefined,
    });

    return {
      faithfulness: results.score?.faithfulness ?? 0.5,
      relevance: results.score?.relevance ?? 0.5,
      coherence: results.score?.coherence ?? 0.5,
      contextPrecision: results.score?.contextPrecision ?? 0.5,
      contextRecall: results.score?.contextRecall ?? 0.5,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'RAGAS evaluation failed';
    console.error('[RAGAS]', message);
    await logError({ source: 'ragasClient.evaluateAnswer', message });
    // Return safe default metrics on error
    return {
      faithfulness: 0.5,
      relevance: 0.5,
      coherence: 0.5,
      contextPrecision: 0.5,
      contextRecall: 0.5,
    };
  }
};
