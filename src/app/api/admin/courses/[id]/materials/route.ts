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
      .from('course_materials')
      .select('*')
      .eq('course_id', params.id)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ materials: data || [] });
  } catch (error) {
    console.error('Materials fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { title, content, material_type, is_published } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('course_materials')
      .insert({
        course_id: params.id,
        title,
        content: content || null,
        material_type: material_type || 'lesson',
        is_published: is_published || false,
        created_by: auth.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ material: data });
  } catch (error) {
    console.error('Material creation error:', error);
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
  }
}
