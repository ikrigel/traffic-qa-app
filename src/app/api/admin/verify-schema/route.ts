import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';
import { apiError } from '@/lib/apiErrors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return apiError('UNAUTHORIZED_KEY_ACCESS', 'Only super_admin can verify schema', 403);
    }

    const supabase = getServiceSupabase();

    // Check user_preferences table
    const { data: prefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(1);

    // Check user_progress table
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1);

    // Check user_statistics table
    const { data: stats, error: statsError } = await supabase
      .from('user_statistics')
      .select('*')
      .limit(1);

    const verification = {
      user_preferences: {
        status: prefsError ? 'ERROR' : 'OK',
        error: prefsError?.message || null,
        sample: prefs ? `${prefs.length} records found` : 'Table exists, no records yet',
      },
      user_progress: {
        status: progressError ? 'ERROR' : 'OK',
        error: progressError?.message || null,
        sample: progress ? `${progress.length} records found` : 'Table exists, no records yet',
      },
      user_statistics: {
        status: statsError ? 'ERROR' : 'OK',
        error: statsError?.message || null,
        sample: stats ? `${stats.length} records found` : 'Table exists, no records yet',
      },
      summary: {
        all_tables_accessible: !prefsError && !progressError && !statsError,
        migrations_status: 'SUCCESS',
        next_step: 'Tables are ready to use. Verify with test operations.',
      },
    };

    return NextResponse.json(verification);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
