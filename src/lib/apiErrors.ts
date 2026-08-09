import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'INVALID_PROVIDER'
  | 'KEY_ALREADY_EXISTS'
  | 'KEY_NOT_FOUND'
  | 'UNAUTHORIZED_KEY_ACCESS'
  | 'MISSING_FIELDS'
  | 'INVALID_REQUEST'
  | 'NO_API_KEY'
  | 'ALL_KEYS_FAILED'
  | 'VALIDATION_FAILED'
  | 'INTERNAL_ERROR';

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...extra,
      },
    },
    { status }
  );
}
