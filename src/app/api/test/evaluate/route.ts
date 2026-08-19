/* eslint-disable no-console */
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
  const startTime = Date.now();

  try {
    console.log('[EVALUATE] Starting evaluation request');

    const user = await getSessionUser(request);
    if (!user) {
      console.error('[EVALUATE] Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.log('[EVALUATE] User authenticated:', user.id);

    const { questionId, questionText, correctAnswer, userAnswer, inputMethod } = await request.json();

    if (!questionId || !questionText || !correctAnswer || !userAnswer) {
      console.error('[EVALUATE] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[EVALUATE] Validating environment variables...');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[EVALUATE] SUPABASE_SERVICE_ROLE_KEY not set');
      return NextResponse.json(
        { error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    let grading: GradingResult;
    try {
      console.log('[EVALUATE] Starting grading process...');
      const gradingPromise = gradeUserAnswer({
        userId: user.id,
        question: questionText,
        correctAnswer,
        userAnswer,
      });

      const timeoutPromise = new Promise<GradingResult>((_, reject) =>
        setTimeout(() => reject(new Error('Grading timeout after 25 seconds')), 25000)
      );

      grading = await Promise.race([gradingPromise, timeoutPromise]);
      console.log('[EVALUATE] Grading completed, verdict:', grading.verdict);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to grade answer';
      console.error('[EVALUATE] Grading error:', msg, error);
      return NextResponse.json(
        { error: msg || 'Failed to grade answer' },
        { status: 500 }
      );
    }

    console.log('[EVALUATE] Saving test attempt to database...');
    const supabase = getServiceSupabase();
    const { error: insertError, data } = await supabase
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
      })
      .select();

    if (insertError) {
      console.error('[EVALUATE] Test attempt insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save test attempt: ' + insertError.message },
        { status: 500 }
      );
    }

    // Update user progress
    try {
      console.log('[EVALUATE] Updating user progress...');
      await fetch(new URL('/api/user/progress', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
        body: JSON.stringify({ questionId, verdict: grading.verdict }),
      });
    } catch (progressError) {
      console.error('[EVALUATE] Progress update failed (non-fatal):', progressError);
    }

    const duration = Date.now() - startTime;
    console.log(`[EVALUATE] Success! Completed in ${duration}ms. ID:`, data?.[0]?.id);

    return NextResponse.json({
      verdict: grading.verdict,
      feedback: grading.feedback,
      metrics: grading.metrics,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const msg = error instanceof Error ? error.message : 'Failed to evaluate test';
    console.error(`[EVALUATE] Error after ${duration}ms:`, msg, error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
