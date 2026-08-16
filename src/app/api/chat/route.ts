import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { retrieveRelevantDocuments } from '@/lib/rag';
import { generateWithFallback } from '@/lib/generation/dispatcher';
import { apiError } from '@/lib/apiErrors';
import { appLog, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await appLog({ source: 'chat/route', message: '📨 Chat request received' });

    const user = await getSessionUser(request);
    if (!user) {
      await logError({ source: 'chat/route', message: 'User not authenticated', level: 'warn' });
      return apiError('NOT_AUTHENTICATED', 'Not authenticated', 401);
    }

    const { message } = await request.json();
    if (!message) {
      await logError({ source: 'chat/route', message: 'Missing message field', level: 'warn' });
      return apiError('MISSING_FIELDS', 'Message is required', 400);
    }

    await appLog({ source: 'chat/route', message: `💬 Processing message from user ${user.id}`, context: { messageLength: message.length } });

    const documents = await retrieveRelevantDocuments(message, 5);
    await appLog({ source: 'chat/route', message: `🔍 Retrieved ${documents.length} relevant documents` });

    let systemPrompt: string;
    if (documents.length > 0) {
      systemPrompt = `You are a helpful assistant specializing in Israeli traffic laws. Answer the user's question based on the provided context. If the context doesn't contain relevant information, say "I don't have enough information to answer this question." Respond in Hebrew.\n\nContext:\n${documents.map(doc => `**${doc.title}**\n${doc.content}`).join('\n\n')}`;
    } else {
      systemPrompt = `You are a helpful assistant specializing in Israeli traffic laws. Answer the user's question to the best of your knowledge. If you cannot answer, say "I don't have enough information to answer this question." Respond in Hebrew.\n\nNote: No reference documents are currently available.`;
    }

    const result = await generateWithFallback(user.id, systemPrompt, message, 'generation');

    if (!result.ok) {
      const errorDetails = {
        code: result.code,
        attemptCount: result.attempts.length,
        attempts: result.attempts.map(a => ({
          provider: a.provider,
          source: a.source,
          error: a.errorMessage,
        })),
      };
      await logError({
        source: 'chat/route',
        message: `Generation failed: ${result.code}`,
        level: 'error',
        context: errorDetails,
      });
      return apiError(result.code, `Failed to generate answer: ${result.attempts[0]?.errorMessage || result.code}`, 502);
    }

    await appLog({ source: 'chat/route', message: `✅ Generated response via ${result.provider}`, context: { keySource: result.keySource } });

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
    await logError({ source: 'chat/route', message: `❌ Chat error: ${message}`, level: 'error' });
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
