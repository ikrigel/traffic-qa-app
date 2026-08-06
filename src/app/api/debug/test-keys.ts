/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { listCandidateKeys } from '@/lib/apiKeys';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log(`[DEBUG] Testing listCandidateKeys for user ${user.id}`);

    const supabase = getServiceSupabase();
    const { data: rawKeys, error: queryError } = await supabase
      .from('api_keys')
      .select('id, provider, key_encrypted, is_default, priority, is_active')
      .eq('user_id', user.id);

    console.log('[DEBUG] Raw query result:', { queryError, count: rawKeys?.length });

    const candidates = await listCandidateKeys(user.id);

    console.log('[DEBUG] Candidates:', { count: candidates.length, providers: candidates.map(c => c.provider) });

    return NextResponse.json({
      userId: user.id,
      rawKeysCount: rawKeys?.length || 0,
      rawKeys: rawKeys?.map(k => ({ id: k.id, provider: k.provider, is_active: k.is_active })),
      queryError,
      candidatesCount: candidates.length,
      candidates: candidates.map(c => ({ provider: c.provider, source: c.source, priority: c.priority })),
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
