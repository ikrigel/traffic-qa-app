import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ courses: data || [] });
  } catch (error) {
    console.error('Courses fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { title, description, category } = await request.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title,
        description: description || null,
        category: category || null,
        order_index: 0,
        created_by: auth.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ course: data });
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
