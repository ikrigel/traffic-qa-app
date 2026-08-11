/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getServiceSupabase();

    // Check if RPC function exists
    console.log('[RPC-VERIFY] Checking if match_rag_documents RPC exists...');

    try {
      // Try calling it with empty vector
      const testVector = new Array(768).fill(0);
      const { data, error } = await supabase.rpc('match_rag_documents', {
        query_embedding: testVector,
        match_count: 1,
      });

      console.log('[RPC-VERIFY] RPC call result:', {
        hasError: !!error,
        errorMessage: error?.message,
        dataLength: data?.length,
        dataExists: !!data
      });

      if (error) {
        // RPC doesn't exist or has error
        return NextResponse.json({
          rpcExists: false,
          error: error.message,
          suggestion: 'Migration 20260802000001_add_rag_vector_and_evaluations.sql may not be applied',
          fix: 'Apply the migration in Supabase SQL Editor'
        });
      }

      // RPC exists
      return NextResponse.json({
        rpcExists: true,
        rpcFunctionName: 'match_rag_documents',
        testCallResult: {
          returnedRows: data?.length || 0,
          success: true
        },
        troubleshooting: 'RPC exists but may not be returning documents. Check if embeddings are stored.'
      });

    } catch (rpcError) {
      console.error('[RPC-VERIFY] RPC call failed:', rpcError);
      return NextResponse.json({
        rpcExists: false,
        error: rpcError instanceof Error ? rpcError.message : String(rpcError),
        suggestion: 'RPC function match_rag_documents does not exist or Supabase connection failed',
        action: 'URGENT: Apply migration 20260802000001_add_rag_vector_and_evaluations.sql to Supabase'
      });
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
