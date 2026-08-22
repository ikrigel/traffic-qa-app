import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; materialId: string } }
) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { title, content, material_type, is_published, order_index } = await request.json();

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('course_materials')
      .update({
        title: title || undefined,
        content: content !== undefined ? content : undefined,
        material_type: material_type || undefined,
        is_published: is_published !== undefined ? is_published : undefined,
        order_index: order_index !== undefined ? order_index : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.materialId)
      .eq('course_id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ material: data });
  } catch (error) {
    console.error('Material update error:', error);
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; materialId: string } }
) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('course_materials')
      .delete()
      .eq('id', params.materialId)
      .eq('course_id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Material deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }
}
