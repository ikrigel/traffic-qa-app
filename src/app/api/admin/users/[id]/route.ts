import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getServiceSupabase } from '@/lib/supabase';
import { SUPER_ADMIN_EMAIL, ROLES } from '@/lib/constants';
import type { Role } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ['super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const { role } = await request.json();
    const targetId = params.id;

    if (!role || !ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .eq('id', targetId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Cannot change role of the protected super admin account' },
        { status: 400 }
      );
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: role as Role })
      .eq('id', targetId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('User role update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(request, ['admin', 'super_admin']);
  if (!auth.authorized) return auth.response;

  try {
    const targetId = params.id;

    if (targetId === auth.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .eq('id', targetId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Cannot delete the protected super admin account' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', targetId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
