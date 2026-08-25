/* eslint-disable no-console */
import { retrieveRelevantDocuments } from './rag';
import { generateWithFallback } from './generation/dispatcher';
import { evaluateAnswer } from './ragasClient';
import { logError } from './logger';
import type { RagasMetrics } from '@/types';

interface GradingInput {
  userId: string;
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

    console.log('[GRADING] Starting with question:', question.substring(0, 50));

    let context = '';
    try {
      console.log('[GRADING] Retrieving relevant documents...');
      const documents = await retrieveRelevantDocuments(question, 3);
      console.log('[GRADING] Retrieved', documents.length, 'documents');
      if (documents.length > 0) {
        context = documents.map(doc => `Title: ${doc.title}\n${doc.content}`).join('\n\n');
      }
    } catch (ragError) {
      console.error('[GRADING] RAG retrieval failed, using empty context:', ragError);
      await logError({
        source: 'grading.retrieveRelevantDocuments',
        message: ragError instanceof Error ? ragError.message : 'RAG retrieval failed',
      });
    }

    console.log('[GRADING] Evaluating answer...');
    const metrics = await evaluateAnswer(question, userAnswer, context, correctAnswer);
    console.log('[GRADING] Metrics computed:', metrics);

    const faithfulness = metrics.faithfulness ?? 0;
    const relevance = metrics.relevance ?? 0;
    const coherence = metrics.coherence ?? 0;
    const avgScore = (faithfulness + relevance + coherence) / 3;

    console.log('[GRADING] Scores - faith:', faithfulness, 'rel:', relevance, 'coh:', coherence, 'avg:', avgScore);

    let verdict: 'correct' | 'partial' | 'incorrect' = 'incorrect';

    // CORRECT: High scores overall
    if (faithfulness >= 0.9 || relevance >= 0.9) {
      // Excellent on main metrics
      verdict = 'correct';
    } else if (faithfulness >= 0.75 && relevance >= 0.75 && coherence >= 0.7) {
      // Good scores across the board
      verdict = 'correct';
    } else if (avgScore >= 0.8) {
      // Strong average score
      verdict = 'correct';
    }
    // PARTIAL: Medium scores - shows understanding but missing details
    else if (avgScore >= 0.6) {
      verdict = 'partial';
    } else if ((faithfulness >= 0.55 || relevance >= 0.55) && coherence >= 0.5) {
      verdict = 'partial';
    } else if (faithfulness >= 0.5 || relevance >= 0.5) {
      // Any main metric above 0.5 means some correct content
      verdict = 'partial';
    }

    console.log('[GRADING] Verdict determined:', verdict, '(avg score:', avgScore.toFixed(2), ')');

    let feedback = 'לא ניתן ליצור משוב כרגע';
    try {
      const feedbackPrompt = `
אתה מעריך תשובות של משתמשים לשאלות על דיני תעבורה בישראל.
כל תקנות התעבורה נמצאות בקובץ תקנות התעבורה.
הקונטקסט שלהלן מכיל את המידע הרלוונטי.

בהינתן השאלה: "${question}"
התשובה הנכונה: "${correctAnswer}"
התשובה של המשתמש: "${userAnswer}"

תן משוב קצר וחכם (שורה אחת בעברית) על התשובה של המשתמש.
      `;

      const feedbackResult = await generateWithFallback(input.userId, '', feedbackPrompt, 'grading');
      if (feedbackResult.ok) {
        feedback = feedbackResult.text;
      }
    } catch (feedbackError) {
      console.error('Feedback generation failed:', feedbackError);
      await logError({
        source: 'grading.generateAnswer',
        message: feedbackError instanceof Error ? feedbackError.message : 'Feedback generation failed',
      });
    }

    if (feedback === 'לא ניתן ליצור משוב כרגע') {
      if (verdict === 'correct') {
        feedback = 'תשובה נכונה! כל הכבוד.';
      } else if (verdict === 'partial') {
        feedback = 'תשובה חלקית. קרוב, אך יש עוד מקום לשיפור.';
      }
    }

    return {
      verdict,
      feedback,
      metrics,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Grading failed';
    await logError({ source: 'grading.gradeUserAnswer', message });
    throw error;
  }
};
