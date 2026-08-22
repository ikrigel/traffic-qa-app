import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const url = new URL(request.url);
    const level = url.searchParams.get('level');
    const limitParam = url.searchParams.get('limit');

    let limit = Math.min(parseInt(limitParam || '100'), 500);
    if (isNaN(limit)) limit = 100;

    const supabase = getServiceSupabase();
    let query = supabase
      .from('debug_logs')
      .select('id, level, source, message, context, created_at')
      .order('created_at', { ascending: false });

    if (level && level !== 'all') {
      query = query.eq('level', level);
    }

    const { data, error } = await query.limit(limit);

    if (error) throw error;

    return NextResponse.json({
      logs: (data || []).map(log => ({
        id: log.id,
        level: log.level,
        source: log.source,
        message: log.message,
        context: log.context,
        created_at: log.created_at,
      })),
    });
  } catch (error) {
    console.error('Logs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
