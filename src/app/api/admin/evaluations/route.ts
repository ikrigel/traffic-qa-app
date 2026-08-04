import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { retrieveRelevantDocuments } from '@/lib/rag';
import { generateAnswer } from '@/lib/gemini';
import { evaluateAnswer } from '@/lib/ragasClient';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('rag_evaluations')
      .select('id, question, expected_answer, ai_answer, retrieved_document_ids, metrics, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({
      evaluations: data || [],
    });
  } catch (error) {
    console.error('Evaluations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { question, expectedAnswer } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const documents = await retrieveRelevantDocuments(question, 5);
    const context = documents.map(doc => `**${doc.title}**\n${doc.content}`).join('\n\n');
    const docIds = documents.map(d => d.id);

    const systemPrompt = `You are an expert in Israeli traffic laws. Answer the following question based on the provided context. If the context doesn't contain relevant information, say "I don't have enough information to answer this question."`;

    const aiAnswer = await generateAnswer(systemPrompt, question);

    const metrics = expectedAnswer
      ? await evaluateAnswer(question, aiAnswer, context, expectedAnswer)
      : await evaluateAnswer(question, aiAnswer, context);

    const supabase = getServiceSupabase();
    const { data: evaluation, error: insertError } = await supabase
      .from('rag_evaluations')
      .insert({
        question,
        expected_answer: expectedAnswer || null,
        ai_answer: aiAnswer,
        retrieved_document_ids: docIds,
        metrics,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      evaluation: {
        id: evaluation.id,
        question: evaluation.question,
        expectedAnswer: evaluation.expected_answer,
        aiAnswer: evaluation.ai_answer,
        retrievedDocuments: documents.map(d => ({
          id: d.id,
          title: d.title,
          similarity: d.similarity,
        })),
        metrics,
      },
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    );
  }
}
