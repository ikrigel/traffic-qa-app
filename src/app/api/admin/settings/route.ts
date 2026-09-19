/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value, description, updated_at');

    if (error) throw error;

    const settings: Record<string, string> = {};
    data.forEach(({ key, value }) => {
      settings[key] = value;
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Failed to fetch app settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(request, ['super_admin']);

    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('app_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Setting not found' },
        { status: 404 }
      );
    }

    console.log(`[ADMIN] Updated app setting: ${key}`);
    return NextResponse.json({ success: true, setting: data[0] });
  } catch (error) {
    console.error('Failed to update app settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
