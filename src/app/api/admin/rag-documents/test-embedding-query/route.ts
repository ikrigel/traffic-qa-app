/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { embedText } from '@/lib/gemini';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    console.log('[TEST-EMBEDDING] Query:', query);

    // Step 1: Generate embedding
    console.log('[TEST-EMBEDDING] Step 1: Generating embedding...');
    let embedding: number[] = [];
    try {
      embedding = await embedText(query);
      console.log('[TEST-EMBEDDING] ✅ Embedding generated');
      console.log('[TEST-EMBEDDING] Type:', typeof embedding, 'Is array:', Array.isArray(embedding));
      console.log('[TEST-EMBEDDING] Length:', embedding.length);
      console.log('[TEST-EMBEDDING] First 5 values:', embedding.slice(0, 5));
    } catch (embedError) {
      console.error('[TEST-EMBEDDING] ❌ Embedding failed:', embedError);
      return NextResponse.json({
        success: false,
        step: 'embedding',
        error: embedError instanceof Error ? embedError.message : String(embedError)
      });
    }

    // Step 2: Call RPC directly
    console.log('[TEST-EMBEDDING] Step 2: Calling RPC with embedding...');
    const supabase = getServiceSupabase();

    console.log('[TEST-EMBEDDING] RPC call params:');
    console.log('[TEST-EMBEDDING]   - query_embedding type:', typeof embedding);
    console.log('[TEST-EMBEDDING]   - query_embedding length:', embedding.length);
    console.log('[TEST-EMBEDDING]   - match_count: 5');

    const { data, error } = await supabase.rpc('match_rag_documents', {
      query_embedding: embedding,
      match_count: 5,
    });

    console.log('[TEST-EMBEDDING] RPC response:');
    console.log('[TEST-EMBEDDING]   - Error:', error?.message || 'none');
    console.log('[TEST-EMBEDDING]   - Data length:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('[TEST-EMBEDDING]   - Top result:', data[0].title, '(similarity:', data[0].similarity, ')');
    }

    return NextResponse.json({
      success: true,
      query,
      embedding: {
        type: typeof embedding,
        isArray: Array.isArray(embedding),
        length: embedding.length,
        firstValues: embedding.slice(0, 5)
      },
      rpc: {
        error: error?.message || null,
        resultsCount: data?.length || 0,
        topResult: data && data.length > 0 ? {
          title: data[0].title,
          similarity: data[0].similarity
        } : null
      }
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[TEST-EMBEDDING] Unexpected error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
