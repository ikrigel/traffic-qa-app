import { NextRequest, NextResponse } from 'next/server';
import { gradeUserAnswer } from '@/lib/grading';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswer, userAnswer } = await request.json();

    if (!question || !correctAnswer || !userAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields: question, correctAnswer, userAnswer' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    try {
      const result = await gradeUserAnswer({
        question,
        correctAnswer,
        userAnswer,
      });

      const duration = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        duration: `${duration}ms`,
        result,
      });
    } catch (gradingError) {
      const duration = Date.now() - startTime;

      return NextResponse.json(
        {
          success: false,
          duration: `${duration}ms`,
          error: gradingError instanceof Error ? gradingError.message : 'Unknown error',
          stack: gradingError instanceof Error ? gradingError.stack : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
