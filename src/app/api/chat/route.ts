import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { retrieveRelevantDocuments } from '@/lib/rag';
import { generateWithFallback } from '@/lib/generation/dispatcher';
import { apiError } from '@/lib/apiErrors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return apiError('NOT_AUTHENTICATED', 'Not authenticated', 401);
    }

    const { message } = await request.json();
    if (!message) {
      return apiError('MISSING_FIELDS', 'Message is required', 400);
    }

    const documents = await retrieveRelevantDocuments(message, 5);

    let systemPrompt: string;
    if (documents.length > 0) {
      systemPrompt = `You are a helpful assistant specializing in Israeli traffic laws. Answer the user's question based on the provided context. If the context doesn't contain relevant information, say "I don't have enough information to answer this question." Respond in Hebrew.\n\nContext:\n${documents.map(doc => `**${doc.title}**\n${doc.content}`).join('\n\n')}`;
    } else {
      systemPrompt = `You are a helpful assistant specializing in Israeli traffic laws. Answer the user's question to the best of your knowledge. If you cannot answer, say "I don't have enough information to answer this question." Respond in Hebrew.\n\nNote: No reference documents are currently available.`;
    }

    const result = await generateWithFallback(user.id, systemPrompt, message, 'generation');

    if (!result.ok) {
      return apiError(result.code, 'Failed to generate answer', 502, {
        code: result.code,
      });
    }

    return NextResponse.json({
      answer: result.text,
      keySource: result.keySource,
      sources: documents.map(d => ({
        id: d.id,
        title: d.title,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process chat message';
    console.error('Chat error:', message);
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
