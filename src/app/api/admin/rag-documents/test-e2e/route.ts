/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { retrieveRelevantDocuments } from '@/lib/rag';
import { generateWithFallback } from '@/lib/generation/dispatcher';

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

    console.log('[E2E-TEST] Testing full RAG pipeline for query:', query);

    // Step 1: Retrieve documents
    console.log('[E2E-TEST] Step 1: Calling retrieveRelevantDocuments...');
    const docs = await retrieveRelevantDocuments(query, 5);
    console.log(`[E2E-TEST] Step 2: Retrieved ${docs.length} documents`);

    if (docs.length > 0) {
      docs.forEach((doc, i) => {
        console.log(`[E2E-TEST] Doc ${i}: "${doc.title}" (similarity: ${doc.similarity?.toFixed(3)})`);
      });
    }

    // Step 2: Generate answer with RAG context
    console.log('[E2E-TEST] Step 3: Generating answer with RAG context...');
    const systemPrompt = docs.length > 0
      ? `You are a helpful assistant. Answer based on this context:\n${docs.map(d => d.content).join('\n\n')}`
      : 'You are a helpful assistant.';

    const result = await generateWithFallback(user.id, systemPrompt, query, 'generation');

    console.log('[E2E-TEST] Step 4: Generation result:', result.ok ? '✅ OK' : '❌ FAILED');

    if (!result.ok) {
      return NextResponse.json({
        success: false,
        retrievedDocs: docs.length,
        generationError: result.code,
      });
    }

    return NextResponse.json({
      success: true,
      query,
      retrievedDocuments: docs.length,
      topDocument: docs[0]
        ? {
            title: docs[0].title,
            similarity: docs[0].similarity,
            contentPreview: docs[0].content.substring(0, 100),
          }
        : null,
      generatedAnswer: result.text.substring(0, 200),
      provider: result.provider,
      keySource: result.keySource,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[E2E-TEST] Error:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
