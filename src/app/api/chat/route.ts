import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { retrieveRelevantDocuments } from '@/lib/rag';
import { generateAnswer } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const documents = await retrieveRelevantDocuments(message, 5);

    const systemPrompt = `You are a helpful assistant specializing in Israeli traffic laws. Answer the user's question based on the provided context. If the context doesn't contain relevant information, say "I don't have enough information to answer this question." Respond in Hebrew.\n\nContext:\n${documents.map(doc => `**${doc.title}**\n${doc.content}`).join('\n\n')}`;

    let answer: string;
    try {
      answer = await generateAnswer(systemPrompt, message);
    } catch {
      answer = 'מצטער, אני לא יכול לעזור כרגע. אנא נסה שוב מאוחר יותר.';
    }

    return NextResponse.json({
      answer,
      sources: documents.map(d => ({
        id: d.id,
        title: d.title,
      })),
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
