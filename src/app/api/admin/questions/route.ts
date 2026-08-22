import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { data: questions, error: qError } = await supabase
      .from('admin_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (qError) throw qError;

    const { data: options, error: oError } = await supabase
      .from('question_options')
      .select('*');

    if (oError) throw oError;

    const enriched = questions?.map(q => ({
      ...q,
      options: options?.filter(o => o.question_id === q.id) || [],
    })) || [];

    return NextResponse.json({ questions: enriched });
  } catch (error) {
    console.error('Questions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { question_text, question_type, category, difficulty, options } = await request.json();

    if (!question_text) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data: question, error: qError } = await supabase
      .from('admin_questions')
      .insert({
        question_text,
        question_type: question_type || 'free_text',
        category: category || null,
        difficulty: difficulty || null,
        created_by: auth.user?.id,
      })
      .select()
      .single();

    if (qError) throw qError;

    let createdOptions = [];
    if (question_type === 'multiple_choice' && options && Array.isArray(options)) {
      const { data: opts, error: oError } = await supabase
        .from('question_options')
        .insert(
          options.map((opt: any, idx: number) => ({
            question_id: question.id,
            option_text: opt.text,
            is_correct: opt.is_correct || false,
            order_index: idx,
          }))
        )
        .select();

      if (oError) throw oError;
      createdOptions = opts || [];
    }

    return NextResponse.json({
      question: { ...question, options: createdOptions },
    });
  } catch (error) {
    console.error('Question creation error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
