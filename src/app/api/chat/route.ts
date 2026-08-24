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
      const contextString = documents
        .map((doc, idx) => `[Source ${idx + 1}: ${doc.title}]\n${doc.content}`)
        .join('\n\n---\n\n');

      systemPrompt = `You are an expert assistant specializing in Israeli traffic laws (דיני תעבורה).

DOCUMENT STRUCTURE:
Regulations are formatted as:
תקנה [NUMBER]. [TITLE]
[CONTENT - may span multiple lines]

Example:
בקיאות ברכב
25. לא ינהג אדם רכב אלא אם הוא בקי בהפעלתו ובשימוש בו.

INSTRUCTIONS:
1. Answer ONLY based on the provided context documents
2. When user asks about a specific regulation (e.g., "תקנה 25"):
   - Search for the EXACT regulation number in the documents
   - Quote the COMPLETE text under that regulation number
   - Include both the title and full content
3. If user asks a general question (e.g., "מהי הכרת רכב"):
   - Search documents for related regulations
   - Cite exact regulation numbers and text that answer the question
4. NEVER give general knowledge when the answer exists in documents
5. If information is NOT in documents, respond: "לא מצאתי מידע זה במסמכים הזמינים"
6. Always cite the regulation number when answering
7. Respond in Hebrew

CONTEXT DOCUMENTS:
${contextString}

Now answer the user's question based ONLY on the above context. Always cite regulation numbers and exact text.`;
    } else {
      systemPrompt = `You are a helpful assistant specializing in Israeli traffic laws. Answer the user's question to the best of your knowledge. If you cannot answer, say "I don't have enough information to answer this question." Respond in Hebrew.\n\nNote: No reference documents are currently available.`;
    }

    const result = await generateWithFallback(user.id, systemPrompt, message, 'generation');

    if (!result.ok) {
      const firstError = result.attempts[0];
      const errorDetails = {
        code: result.code,
        attemptCount: result.attempts.length,
        firstAttempt: {
          provider: firstError?.provider,
          source: firstError?.source,
          error: firstError?.errorMessage,
        },
        allAttempts: result.attempts.map(a => ({
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
      console.error('[CHAT-ROUTE] Generation failed:', errorDetails);
      return apiError(result.code, `Failed to generate answer: ${firstError?.errorMessage || result.code}`, 502);
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
