import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');

    let limit = Math.min(parseInt(limitParam || '100'), 500);
    if (isNaN(limit)) limit = 100;

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('test_attempts')
      .select('id, user_id, question_id, question_text, user_answer, input_method, verdict, metrics, feedback, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      attempts: (data || []).map(attempt => ({
        id: attempt.id,
        userId: attempt.user_id,
        questionId: attempt.question_id,
        questionText: attempt.question_text,
        userAnswer: attempt.user_answer,
        inputMethod: attempt.input_method,
        verdict: attempt.verdict,
        metrics: attempt.metrics,
        feedback: attempt.feedback,
        createdAt: attempt.created_at,
      })),
    });
  } catch (error) {
    console.error('Test attempts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test attempts' },
      { status: 500 }
    );
  }
}
