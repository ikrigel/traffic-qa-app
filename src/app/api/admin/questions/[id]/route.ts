import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('admin_questions').delete().eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Question deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { question_text, category, difficulty, is_published } = await request.json();

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('admin_questions')
      .update({
        question_text: question_text || undefined,
        category: category !== undefined ? category : undefined,
        difficulty: difficulty !== undefined ? difficulty : undefined,
        is_published: is_published !== undefined ? is_published : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ question: data });
  } catch (error) {
    console.error('Question update error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}
