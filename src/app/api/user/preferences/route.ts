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

    await appLog({ source: 'user/preferences', message: `📋 Fetching preferences for user ${user.id}` });

    const supabase = getServiceSupabase();

    // Try to fetch existing preferences
    let data = null;
    let error: any = null;
    try {
      const result = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      data = result.data;
      error = result.error;
    } catch (err) {
      console.error('[PREFS] Query error:', err);
      error = err;
    }

    // If no record exists (PGRST116) or any other error, return defaults
    if (!data) {
      const errorCode = error?.code || (error instanceof Error ? error.message : 'unknown');
      await appLog({
        source: 'user/preferences',
        message: `📝 No preferences found, returning defaults`,
        context: { userId: user.id, errorCode }
      });

      const defaultPrefs = {
        user_id: user.id,
        theme: 'auto' as const,
        language: 'he' as const,
        show_answers: false,
        notification_email: true,
        show_onboarding: true,
        compact_mode: false,
        high_contrast: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json(defaultPrefs);
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch preferences';
    await logError({ source: 'user/preferences', message: `❌ GET error: ${message}`, level: 'error' });

    // Return defaults on error to prevent modal crash
    const user = await getSessionUser(request);
    if (user) {
      return NextResponse.json({
        user_id: user.id,
        theme: 'auto',
        language: 'he',
        show_answers: false,
        notification_email: true,
        show_onboarding: true,
        compact_mode: false,
        high_contrast: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return apiError('INTERNAL_ERROR', message, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return apiError('NOT_AUTHENTICATED', 'Not authenticated', 401);
    }

    const body = await request.json();

    await appLog({
      source: 'user/preferences',
      message: `💾 Updating preferences for user ${user.id}`,
      context: { updates: Object.keys(body) },
    });

    const supabase = getServiceSupabase();

    const preferenceData = {
      user_id: user.id,
      theme: body.theme || 'auto',
      language: body.language || 'he',
      show_answers: body.show_answers ?? false,
      notification_email: body.notification_email ?? true,
      show_onboarding: body.show_onboarding ?? false,
      compact_mode: body.compact_mode ?? false,
      high_contrast: body.high_contrast ?? false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(preferenceData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await appLog({ source: 'user/preferences', message: `✅ Preferences updated successfully` });

    return NextResponse.json({
      success: true,
      preferences: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update preferences';
    await logError({ source: 'user/preferences', message: `❌ PUT error: ${message}`, level: 'error' });
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
