import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('course_questions')
      .delete()
      .eq('id', params.questionId)
      .eq('course_id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Course question deletion error:', error);
    return NextResponse.json({ error: 'Failed to remove question from course' }, { status: 500 });
  }
}
