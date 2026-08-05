import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';
import { gradeUserAnswer } from '@/lib/grading';
import type { RagasMetrics } from '@/types';

export const dynamic = 'force-dynamic';

interface GradingResult {
  verdict: 'correct' | 'partial' | 'incorrect';
  feedback: string;
  metrics: RagasMetrics;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { questionId, questionText, correctAnswer, userAnswer, inputMethod } = await request.json();

    if (!questionId || !questionText || !correctAnswer || !userAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let grading: GradingResult;
    try {
      const gradingPromise = gradeUserAnswer({
        question: questionText,
        correctAnswer,
        userAnswer,
      });

      const timeoutPromise = new Promise<GradingResult>((_, reject) =>
        setTimeout(() => reject(new Error('Grading timeout after 25 seconds')), 25000)
      );

      grading = await Promise.race([gradingPromise, timeoutPromise]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to grade answer';
      console.error('Grading error:', msg, error);
      return NextResponse.json(
        { error: msg || 'Failed to grade answer' },
        { status: 500 }
      );
    }

    const supabase = getServiceSupabase();
    const { error: insertError } = await supabase
      .from('test_attempts')
      .insert({
        user_id: user.id,
        question_id: questionId,
        question_text: questionText,
        correct_answer: correctAnswer,
        user_answer: userAnswer,
        input_method: inputMethod || 'typed',
        verdict: grading.verdict,
        metrics: grading.metrics,
        feedback: grading.feedback,
      });

    if (insertError) {
      console.error('Test attempt insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save test attempt' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verdict: grading.verdict,
      feedback: grading.feedback,
      metrics: grading.metrics,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to evaluate test';
    console.error('Test evaluation error:', msg, error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
