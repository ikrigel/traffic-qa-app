import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';
import { gradeUserAnswer } from '@/lib/grading';

export const dynamic = 'force-dynamic';

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

    let grading;
    try {
      grading = await gradeUserAnswer({
        question: questionText,
        correctAnswer,
        userAnswer,
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to grade answer' },
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
    console.error('Test evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate test' },
      { status: 500 }
    );
  }
}
