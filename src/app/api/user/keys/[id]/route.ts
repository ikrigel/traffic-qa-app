import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { deleteApiKey, setDefaultApiKey, updateKeyPriority } from '@/lib/apiKeys';
import { apiError } from '@/lib/apiErrors';

export const dynamic = 'force-dynamic';

// DELETE /api/user/keys/[id] - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return apiError('NOT_AUTHENTICATED', 'Not authenticated', 401);
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

    if (msg.includes('Unauthorized')) {
      return apiError('UNAUTHORIZED_KEY_ACCESS', msg, 403);
    }

    return apiError('INTERNAL_ERROR', msg, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return apiError('NOT_AUTHENTICATED', 'Not authenticated', 401);
    }

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'setDefault';

    if (action === 'setPriority') {
      const priority = body.priority;
      if (priority === undefined || priority === null) {
        return apiError('MISSING_FIELDS', 'Priority is required', 400);
      }

      const success = await updateKeyPriority(id, user.id, priority);
      if (!success) {
        throw new Error('Failed to update priority');
      }

      return NextResponse.json({
        success: true,
        message: 'Key priority updated successfully',
      });
    }

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

    if (msg.includes('Unauthorized')) {
      return apiError('UNAUTHORIZED_KEY_ACCESS', msg, 403);
    }

    return apiError('INTERNAL_ERROR', msg, 500);
  }
}
