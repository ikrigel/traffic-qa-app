import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { retrieveRelevantDocuments } from '@/lib/rag';
import { generateWithFallback } from '@/lib/generation/dispatcher';
import { apiError } from '@/lib/apiErrors';
import { appLog, logError } from '@/lib/logger';
import { DRIVING_TUTOR_SYSTEM_PROMPT } from '@/lib/ai/drivingTutorPrompt';
import type { TutorRequest, TutorResponse } from '@/lib/rag/tutorTypes';

export const dynamic = 'force-dynamic';

function formatSourcesForPrompt(chunks: any[]) {
  return chunks
    .map((chunk, index) => {
      const { page, section, sourceType } = chunk.citation;
      const location = [page ? `עמ׳ ${page}` : null, section].filter(Boolean).join(', ');
      return [
        `<source id="S${index + 1}" type="${sourceType}" location="${location}">`,
        chunk.text,
        '</source>',
      ].join('\n');
    })
    .join('\n\n');
}

function extractCitations(answer: string, chunks: any[]) {
  const citations = [];
  for (let i = 0; i < chunks.length; i++) {
    const sourceId = `S${i + 1}`;
    if (answer.includes(`[מקור: S${i + 1}]`) || answer.includes(sourceId)) {
      const { page, section, sourceType, documentId } = chunks[i].citation;
      citations.push({
        label: `S${i + 1}`,
        documentId,
        page,
        section,
        sourceType,
      });
    }
  }
  return citations;
}

export async function POST(request: NextRequest) {
  try {
    await appLog({ source: 'tutor/chat', message: '📚 Tutor chat request received' });

    const user = await getSessionUser(request);
    if (!user) {
      await logError({ source: 'tutor/chat', message: 'User not authenticated', level: 'warn' });
      return apiError('NOT_AUTHENTICATED', 'Not authenticated', 401);
    }

    const body = (await request.json()) as TutorRequest;
    const { message, mode = 'tutor' } = body;

    if (!message || message.trim().length === 0) {
      return apiError('MISSING_FIELDS', 'Message is required', 400);
    }

    if (message.length > 4000) {
      return apiError('INVALID_REQUEST', 'Message too long (max 4000 characters)', 400);
    }

    await appLog({
      source: 'tutor/chat',
      message: `💬 Processing tutor message (mode: ${mode})`,
      context: { messageLength: message.length, mode },
    });

    // Safety check: if user is driving, tell them to stop
    if (message.toLowerCase().includes('נוהג') || message.toLowerCase().includes('driving')) {
      const safetyCheck =
        'אם אתה נוהג עכשיו, בבקשה הפסק ולהתמקד בנהיגה בטוחה. אוכל להמשיך כשתחנה בבטחה.';
      return NextResponse.json({
        answer: safetyCheck,
        citations: [],
        evidenceStatus: 'insufficient',
        suggestedAction: 'continue',
        mode,
      } as TutorResponse);
    }

    // Retrieve documents with metadata
    const documents = await retrieveRelevantDocuments(message, 7);
    await appLog({
      source: 'tutor/chat',
      message: `🔍 Retrieved ${documents.length} relevant documents`,
      context: { documentCount: documents.length },
    });

    const insufficientEvidence = documents.length === 0;
    const sources = documents.length > 0 ? formatSourcesForPrompt(documents.slice(0, 6)) : '';

    const userPrompt = `מצב לימוד: ${mode}
מצב ראיות: ${insufficientEvidence ? 'INSUFFICIENT' : 'AVAILABLE'}

שאלת התלמיד:
${message}

${documents.length > 0 ? `מקורות שאוחזרו:\n${sources}` : 'לא הוחזרו מקורות.'}

כללי ציטוט בתוך התשובה:
- לכל טענה עובדתית, צרף את תג המקור המתאים בפורמט [מקור: כותרת, מיקום].
- אל תצטט מקור שאינו תומך ישירות בטענה.
- אם מצב הראיות INSUFFICIENT, אמור שלא נמצא מקור מספיק בחומר הקורס.`;

    const result = await generateWithFallback(user.id, DRIVING_TUTOR_SYSTEM_PROMPT, userPrompt, 'generation');

    if (!result.ok) {
      await logError({
        source: 'tutor/chat',
        message: `Generation failed: ${result.code}`,
        level: 'error',
      });
      return apiError(result.code, 'Failed to generate answer', 502);
    }

    const citations = extractCitations(result.text, documents);

    await appLog({
      source: 'tutor/chat',
      message: `✅ Generated tutor response with ${citations.length} citations`,
      context: { citationCount: citations.length, mode },
    });

    const response: TutorResponse = {
      answer: result.text,
      citations,
      evidenceStatus: insufficientEvidence ? 'insufficient' : 'available',
      suggestedAction: mode === 'quiz' ? 'continue' : undefined,
      mode,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process tutor chat';
    await logError({ source: 'tutor/chat', message: `❌ Tutor error: ${message}`, level: 'error' });
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
