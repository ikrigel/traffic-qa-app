import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { regulations_to_verify } = await request.json();

    if (!Array.isArray(regulations_to_verify) || regulations_to_verify.length === 0) {
      return NextResponse.json({ error: 'regulations_to_verify array required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const results = await Promise.all(
      regulations_to_verify.map(async (regNum: number) => {
        const { data, error } = await supabase
          .from('rag_documents')
          .select('id, content, chunk_index, regulation_numbers')
          .or(`regulation_numbers.cs.{${regNum}},content.ilike.%תקנה ${regNum}%,content.ilike.%תקנה ${regNum}א%`)
          .limit(5);

        if (error) {
          return { regulation: regNum, found: false, chunks: 0, error: error.message };
        }

        const foundChunks = data || [];

        return {
          regulation: regNum,
          found: foundChunks.length > 0,
          chunks: foundChunks.length,
          sample_content: foundChunks[0]?.content?.substring(0, 200) || '',
        };
      })
    );

    const allFound = results.every(r => r.found);
    const summary = `Found ${results.filter(r => r.found).length}/${results.length} regulations`;

    return NextResponse.json({
      summary,
      all_found: allFound,
      results,
      total_documents: (
        await supabase.from('rag_documents').select('id', { count: 'exact' })
      ).count,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
