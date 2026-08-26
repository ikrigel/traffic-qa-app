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

    const { data: coursesData, error: cError } = await supabase
      .from('course_admin_questions')
      .select('admin_question_id, courses(id, title)');

    if (cError) throw cError;

    const coursesByQuestion = new Map<string, any[]>();
    coursesData?.forEach(cq => {
      const courses = coursesByQuestion.get(cq.admin_question_id) || [];
      if (cq.courses) {
        courses.push(cq.courses);
      }
      coursesByQuestion.set(cq.admin_question_id, courses);
    });

    const enriched = questions?.map(q => ({
      ...q,
      options: options?.filter(o => o.question_id === q.id) || [],
      courses: coursesByQuestion.get(q.id) || [],
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
    const { question_text, question_type, category, difficulty, options, course_ids } = await request.json();

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

    // Link to courses if provided
    if (Array.isArray(course_ids) && course_ids.length > 0) {
      const { error: courseError } = await supabase
        .from('course_admin_questions')
        .insert(
          course_ids.map((course_id: string) => ({
            course_id,
            admin_question_id: question.id,
          }))
        );

      if (courseError) throw courseError;
    }

    return NextResponse.json({
      question: { ...question, options: createdOptions },
    });
  } catch (error) {
    console.error('Question creation error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
