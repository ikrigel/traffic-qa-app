import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { logIds } = await request.json();

    if (!Array.isArray(logIds) || logIds.length === 0) {
      return NextResponse.json({ error: 'Invalid logIds array' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase.from('debug_logs').delete().in('id', logIds);

    if (error) throw error;

    return NextResponse.json({ success: true, deleted: logIds.length });
  } catch (error) {
    console.error('Logs delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete logs' },
      { status: 500 }
    );
  }
}
