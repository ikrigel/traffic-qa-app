import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: !!process.env.JWT_SECRET,
    geminiApiKey: !!process.env.GEMINI_API_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
  };

  try {
    const supabase = getServiceSupabase();

    // Test database connectivity
    const { error: dbError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const dbConnected = !dbError;

    // Test tables exist
    const tables = [
      'users',
      'sessions',
      'rag_documents',
      'debug_logs',
      'rag_evaluations',
      'test_attempts',
    ];

    const tableCheck: Record<string, boolean> = {};
    for (const table of tables) {
      try {
        await supabase
          .from(table)
          .select('id', { count: 'exact', head: true })
          .limit(1);
        tableCheck[table] = true;
      } catch {
        tableCheck[table] = false;
      }
    }

    return NextResponse.json({
      status: 'ok',
      environment: checks,
      database: {
        connected: dbConnected,
        error: dbError?.message,
        tables: tableCheck,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        environment: checks,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
