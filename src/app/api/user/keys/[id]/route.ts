import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { deleteApiKey, setDefaultApiKey } from '@/lib/apiKeysService';

export const dynamic = 'force-dynamic';

// DELETE /api/user/keys/[id] - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;

    const success = await deleteApiKey(id, user.id);

    if (!success) {
      throw new Error('Failed to delete key');
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete key';
    console.error('[API_KEYS] DELETE error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/user/keys/[id]/default - Set as default
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;

    const success = await setDefaultApiKey(id, user.id);

    if (!success) {
      throw new Error('Failed to set default key');
    }

    return NextResponse.json({
      success: true,
      message: 'Default key updated successfully',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update key';
    console.error('[API_KEYS] PATCH error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
