import { retrieveRelevantDocuments } from './rag';
import { generateAnswer } from './gemini';
import { evaluateAnswer } from './ragasClient';
import { logError } from './logger';
import type { RagasMetrics } from '@/types';

interface GradingInput {
  question: string;
  correctAnswer: string;
  userAnswer: string;
}

interface GradingResult {
  verdict: 'correct' | 'partial' | 'incorrect';
  feedback: string;
  metrics: RagasMetrics;
}

export const gradeUserAnswer = async (input: GradingInput): Promise<GradingResult> => {
  try {
    const { question, correctAnswer, userAnswer } = input;

    const documents = await retrieveRelevantDocuments(question, 3);
    const context = documents.map(doc => `Title: ${doc.title}\n${doc.content}`).join('\n\n');

    const metrics = await evaluateAnswer(question, userAnswer, context, correctAnswer);

    const faithfulness = metrics.faithfulness ?? 0;
    const relevance = metrics.relevance ?? 0;

    let verdict: 'correct' | 'partial' | 'incorrect' = 'incorrect';
    if (faithfulness > 0.8 && relevance > 0.75) {
      verdict = 'correct';
    } else if (faithfulness > 0.6 && relevance > 0.6) {
      verdict = 'partial';
    }

    const feedbackPrompt = `
      בהינתן השאלה: "${question}"
      התשובה הנכונה: "${correctAnswer}"
      התשובה של המשתמש: "${userAnswer}"

      תן משוב קצר וחכם (שורה אחת בעברית) על התשובה של המשתמש.
    `;

    const feedback = await generateAnswer('', feedbackPrompt);

    return {
      verdict,
      feedback: feedback || 'משהו לא עבד בהערכה',
      metrics,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Grading failed';
    await logError({ source: 'grading.gradeUserAnswer', message });
    throw error;
  }
};
