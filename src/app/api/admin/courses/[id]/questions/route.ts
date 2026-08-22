import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { TRAFFIC_LAWS_QUESTIONS } from '@/lib/traffic-law-questions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('course_questions')
      .select('*')
      .eq('course_id', params.id)
      .order('order_index', { ascending: true });

    if (error) throw error;

    const courseQuestions = data || [];
    const enriched = courseQuestions.map(cq => ({
      ...cq,
      question: TRAFFIC_LAWS_QUESTIONS.find(q => q.id === cq.question_id),
    }));

    return NextResponse.json({ courseQuestions: enriched });
  } catch (error) {
    console.error('Course questions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch course questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { question_id, is_required } = await request.json();

    if (!question_id || typeof question_id !== 'number') {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('course_questions')
      .insert({
        course_id: params.id,
        question_id,
        is_required: is_required || false,
        order_index: 0,
      })
      .select()
      .single();

    if (error) throw error;

    const question = TRAFFIC_LAWS_QUESTIONS.find(q => q.id === question_id);

    return NextResponse.json({ courseQuestion: { ...data, question } });
  } catch (error) {
    console.error('Course question creation error:', error);
    return NextResponse.json({ error: 'Failed to add question to course' }, { status: 500 });
  }
}
