'use server';

import { logError } from './logger';
import type { RagasMetrics } from '@/types';

// Lazy load RAGAS only on server side to avoid importing Node.js modules in browser
let ragassessment: any = null;

const initRAGAssessment = async () => {
  if (!ragassessment) {
    try {
      const { RAGAssessment, Faithfulness, Relevance, Coherence, ContextPrecision, ContextRecall, GeminiProvider } = await import('@ikrigel/ragas-lib-typescript');
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
    } catch (importError) {
      console.error('[RAGAS] Import failed:', importError);
      throw importError;
    }
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
    const rag = await initRAGAssessment();
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
    return {
      faithfulness: 0.5,
      relevance: 0.5,
      coherence: 0.5,
      contextPrecision: 0.5,
      contextRecall: 0.5,
    };
  }
};
