import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, last_login, location, country, city')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return NextResponse.json({
      users: (data || []).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.created_at,
        lastLogin: u.last_login,
        location: u.location,
        country: u.country,
        city: u.city,
      })),
    });
  } catch (error) {
    console.error('User list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
