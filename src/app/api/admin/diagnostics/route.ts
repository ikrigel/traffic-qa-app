import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';
import { apiError } from '@/lib/apiErrors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return apiError('UNAUTHORIZED_KEY_ACCESS', 'Only super_admin can access diagnostics', 403);
    }

    const supabase = getServiceSupabase();
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      tables: {},
      endpoints: {},
    };

    // Test user_preferences table
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('count(*)', { count: 'exact' })
        .limit(1);

      diagnostics.tables.user_preferences = {
        status: error ? 'ERROR' : 'OK',
        error: error?.message || null,
        errorCode: error?.code || null,
      };
    } catch (err) {
      diagnostics.tables.user_preferences = {
        status: 'ERROR',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Test user_progress table
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('count(*)', { count: 'exact' })
        .limit(1);

      diagnostics.tables.user_progress = {
        status: error ? 'ERROR' : 'OK',
        error: error?.message || null,
        errorCode: error?.code || null,
      };
    } catch (err) {
      diagnostics.tables.user_progress = {
        status: 'ERROR',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Test user_statistics table
    try {
      const { data, error } = await supabase
        .from('user_statistics')
        .select('count(*)', { count: 'exact' })
        .limit(1);

      diagnostics.tables.user_statistics = {
        status: error ? 'ERROR' : 'OK',
        error: error?.message || null,
        errorCode: error?.code || null,
      };
    } catch (err) {
      diagnostics.tables.user_statistics = {
        status: 'ERROR',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Test fetch preferences for current user
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      diagnostics.endpoints.fetch_preferences = {
        status: !error || error.code === 'PGRST116' ? 'OK' : 'ERROR',
        hasData: !!data,
        error: error?.message || null,
        errorCode: error?.code || null,
      };
    } catch (err) {
      diagnostics.endpoints.fetch_preferences = {
        status: 'ERROR',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Test insert preferences
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          theme: 'auto',
          language: 'he',
          show_answers: false,
          notification_email: true,
          show_onboarding: true,
          compact_mode: false,
          high_contrast: false,
        })
        .select()
        .single();

      diagnostics.endpoints.upsert_preferences = {
        status: error ? 'ERROR' : 'OK',
        error: error?.message || null,
        errorCode: error?.code || null,
      };
    } catch (err) {
      diagnostics.endpoints.upsert_preferences = {
        status: 'ERROR',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Summary
    const allOk = Object.values(diagnostics.tables).every((t: any) => t.status === 'OK') &&
                  Object.values(diagnostics.endpoints).every((e: any) => e.status === 'OK');

    diagnostics.summary = {
      allSystemsOperational: allOk,
      issues: allOk ? [] : [
        ...Object.entries(diagnostics.tables)
          .filter(([, t]: any) => t.status !== 'OK')
          .map(([name, t]: any) => `Table ${name}: ${t.error || 'Unknown error'}`),
        ...Object.entries(diagnostics.endpoints)
          .filter(([, e]: any) => e.status !== 'OK')
          .map(([name, e]: any) => `Endpoint ${name}: ${e.error || 'Unknown error'}`),
      ],
      recommendations: allOk ? [
        'All systems operational',
        'Try clearing browser cache and reloading',
        'If issues persist, check Vercel logs',
      ] : [
        'Check that all SQL migrations have been applied',
        'Verify SUPABASE_SERVICE_ROLE_KEY is set in environment',
        'Check Supabase Row Level Security policies',
        'Look at Supabase query logs for detailed errors',
      ],
    };

    return NextResponse.json(diagnostics);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Diagnostics failed';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
