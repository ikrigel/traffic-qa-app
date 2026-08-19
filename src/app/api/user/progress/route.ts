import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { questionId, verdict } = await request.json();
    if (!questionId || !verdict) {
      return NextResponse.json({ error: 'Missing questionId or verdict' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Update or insert user_progress
    const { data: existing } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .single();

    const updates: any = {
      times_attempted: (existing?.times_attempted || 0) + 1,
      times_correct: existing?.times_correct || 0,
      times_partial: existing?.times_partial || 0,
      times_incorrect: existing?.times_incorrect || 0,
      last_attempted_at: new Date().toISOString(),
      first_correct_at: existing?.first_correct_at,
      mastery_level: existing?.mastery_level || 'unstarted',
    };

    if (verdict === 'correct') {
      updates.times_correct += 1;
      updates.first_correct_at = updates.first_correct_at || new Date().toISOString();
    } else if (verdict === 'partial') {
      updates.times_partial += 1;
    } else {
      updates.times_incorrect += 1;
    }

    const accuracy = updates.times_correct / updates.times_attempted;
    if (accuracy >= 0.9 && updates.times_attempted >= 3) {
      updates.mastery_level = 'mastered';
    } else if (accuracy >= 0.7 && updates.times_attempted >= 2) {
      updates.mastery_level = 'proficient';
    } else if (updates.times_attempted >= 1) {
      updates.mastery_level = 'learning';
    }

    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          question_id: questionId,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,question_id' }
      );

    if (progressError) throw progressError;

    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id);

    if (allProgress) {
      const stats = {
        total_attempts: allProgress.reduce((sum: number, p: any) => sum + (p.times_attempted || 0), 0),
        total_correct: allProgress.reduce((sum: number, p: any) => sum + (p.times_correct || 0), 0),
        total_partial: allProgress.reduce((sum: number, p: any) => sum + (p.times_partial || 0), 0),
        total_incorrect: allProgress.reduce((sum: number, p: any) => sum + (p.times_incorrect || 0), 0),
        questions_mastered: allProgress.filter((p: any) => p.mastery_level === 'mastered').length,
        questions_proficient: allProgress.filter((p: any) => p.mastery_level === 'proficient').length,
        questions_learning: allProgress.filter((p: any) => p.mastery_level === 'learning').length,
        questions_unstarted: allProgress.filter((p: any) => p.mastery_level === 'unstarted').length,
        last_activity_at: new Date().toISOString(),
      };

      (stats as any).overall_accuracy =
        stats.total_attempts > 0 ? (stats.total_correct / stats.total_attempts) * 100 : 0;

      const { error: statsError } = await supabase
        .from('user_stats')
        .upsert(
          {
            user_id: user.id,
            ...stats,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (statsError) throw statsError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update progress';
    console.error('[PROGRESS] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const supabase = getServiceSupabase();

    const { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();

    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('mastery_level', { ascending: false })
      .order('last_attempted_at', { ascending: false });

    return NextResponse.json({
      stats: stats || {
        total_attempts: 0,
        total_correct: 0,
        overall_accuracy: 0,
        questions_mastered: 0,
        questions_proficient: 0,
      },
      progress: progress || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch progress';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
