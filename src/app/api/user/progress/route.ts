import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';
import { apiError } from '@/lib/apiErrors';
import { appLog, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return apiError('NOT_AUTHENTICATED', 'Not authenticated', 401);
    }

    await appLog({ source: 'user/progress', message: `📊 Fetching progress for user ${user.id}` });

    const supabase = getServiceSupabase();

    // Fetch user statistics
    const { data: stats, error: statsError } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      throw statsError;
    }

    // Fetch question-level progress
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('last_attempted_at', { ascending: false });

    if (progressError) {
      throw progressError;
    }

    const defaultStats = {
      user_id: user.id,
      total_attempts: 0,
      total_correct: 0,
      accuracy_percentage: 0,
      questions_mastered: 0,
      streak_current: 0,
      streak_longest: 0,
      last_activity_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      statistics: stats || defaultStats,
      progress: progress || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch progress';
    await logError({ source: 'user/progress', message: `❌ GET error: ${message}`, level: 'error' });
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return apiError('NOT_AUTHENTICATED', 'Not authenticated', 401);
    }

    const body = await request.json();
    const { questionId, isCorrect } = body;

    if (!questionId || typeof isCorrect !== 'boolean') {
      return apiError('MISSING_FIELDS', 'questionId and isCorrect are required', 400);
    }

    await appLog({
      source: 'user/progress',
      message: `📝 Recording progress for Q${questionId}`,
      context: { isCorrect, userId: user.id },
    });

    const supabase = getServiceSupabase();

    // Update user_progress
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .single();

    if (existingProgress) {
      // Update existing
      const { error: updateError } = await supabase
        .from('user_progress')
        .update({
          attempts: existingProgress.attempts + 1,
          correct_attempts: isCorrect ? existingProgress.correct_attempts + 1 : existingProgress.correct_attempts,
          last_attempted_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('question_id', questionId);

      if (updateError) throw updateError;
    } else {
      // Create new
      const { error: insertError } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          question_id: questionId,
          attempts: 1,
          correct_attempts: isCorrect ? 1 : 0,
          last_attempted_at: new Date().toISOString(),
          first_attempted_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }

    // Update user_statistics
    const { data: stats } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (stats) {
      const newTotal = stats.total_attempts + 1;
      const newCorrect = isCorrect ? stats.total_correct + 1 : stats.total_correct;
      const accuracy = (newCorrect / newTotal) * 100;

      const { error: statsError } = await supabase
        .from('user_statistics')
        .update({
          total_attempts: newTotal,
          total_correct: newCorrect,
          accuracy_percentage: accuracy,
          last_activity_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (statsError) throw statsError;
    } else {
      const { error: insertError } = await supabase
        .from('user_statistics')
        .insert({
          user_id: user.id,
          total_attempts: 1,
          total_correct: isCorrect ? 1 : 0,
          accuracy_percentage: isCorrect ? 100 : 0,
          last_activity_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }

    await appLog({ source: 'user/progress', message: `✅ Progress recorded successfully` });

    return NextResponse.json({
      success: true,
      message: 'Progress recorded',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record progress';
    await logError({ source: 'user/progress', message: `❌ POST error: ${message}`, level: 'error' });
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
