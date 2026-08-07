/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check all environment variables
    const envVars: Record<string, any> = {};
    const criticalVars = [
      'GEMINI_API_KEY',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'JWT_SECRET',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_APP_URL',
    ];

    for (const key of criticalVars) {
      const value = process.env[key];
      envVars[key] = {
        defined: !!value,
        length: value ? value.length : 0,
        firstChars: value ? value.substring(0, 10) : null,
        startsWithAI: value ? value.startsWith('AIza') : false,
      };
    }

    // Log detailed env var status
    console.log('[ENV-CHECK] Environment Variables:');
    Object.entries(envVars).forEach(([key, info]) => {
      console.log(`[ENV-CHECK] ${key}: defined=${info.defined}, length=${info.length}`);
    });

    // Try to test Gemini
    let geminiTest = null;
    try {
      console.log('[ENV-CHECK] Attempting to import and test Gemini module...');
      const { embedText } = await import('@/lib/gemini');
      console.log('[ENV-CHECK] Gemini module imported successfully');

      console.log('[ENV-CHECK] Testing embedText with short string...');
      const result = await embedText('test');
      geminiTest = {
        success: true,
        embeddingLength: result.length,
      };
      console.log('[ENV-CHECK] ✅ Gemini embedText successful');
    } catch (geminiError) {
      console.log('[ENV-CHECK] ❌ Gemini test failed:', geminiError instanceof Error ? geminiError.message : String(geminiError));
      geminiTest = {
        success: false,
        error: geminiError instanceof Error ? geminiError.message : String(geminiError),
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      user: { id: user.id, email: user.email, role: user.role },
      environmentVariables: envVars,
      geminiTest,
      allEnvCount: Object.keys(process.env).length,
    });
  } catch (error) {
    console.error('[ENV-CHECK] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
