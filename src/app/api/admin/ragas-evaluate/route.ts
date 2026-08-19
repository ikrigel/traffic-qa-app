import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { evaluateAnswer } from '@/lib/ragasClient';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['super_admin']);
    if (!auth.authorized) return auth.response;

    const { question, userAnswer, context, correctAnswer } = await request.json();

    if (!question || !userAnswer) {
      return NextResponse.json({ error: 'Missing question or userAnswer' }, { status: 400 });
    }

    const metrics = await evaluateAnswer(question, userAnswer, context || '', correctAnswer);

    let verdict = 'incorrect';
    if ((metrics.faithfulness ?? 0) >= 0.95 || (metrics.relevance ?? 0) >= 0.95) {
      verdict = 'correct';
    } else if ((metrics.faithfulness ?? 0) > 0.8 && (metrics.relevance ?? 0) > 0.75 && (metrics.coherence ?? 0) > 0.75) {
      verdict = 'correct';
    } else if (((metrics.faithfulness ?? 0) > 0.65 || (metrics.relevance ?? 0) > 0.65) && (metrics.coherence ?? 0) > 0.6) {
      verdict = 'partial';
    }

    return NextResponse.json({ metrics, verdict });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Evaluation failed';
    console.error('[RAGAS-EVAL] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
