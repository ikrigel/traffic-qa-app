import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ course: data });
  } catch (error) {
    console.error('Course fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { title, description, category, is_active, order_index } = await request.json();

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('courses')
      .update({
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        category: category !== undefined ? category : undefined,
        is_active: is_active !== undefined ? is_active : undefined,
        order_index: order_index !== undefined ? order_index : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ course: data });
  } catch (error) {
    console.error('Course update error:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Course deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
