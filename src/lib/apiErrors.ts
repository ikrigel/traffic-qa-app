import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'INVALID_PROVIDER'
  | 'INVALID_REQUEST'
  | 'KEY_ALREADY_EXISTS'
  | 'KEY_NOT_FOUND'
  | 'UNAUTHORIZED_KEY_ACCESS'
  | 'MISSING_FIELDS'
  | 'NO_API_KEY'
  | 'ALL_KEYS_FAILED'
  | 'VALIDATION_FAILED'
  | 'INTERNAL_ERROR';

const statusMap: Record<ApiErrorCode, number> = {
  NOT_AUTHENTICATED: 401,
  INVALID_PROVIDER: 400,
  INVALID_REQUEST: 400,
  KEY_ALREADY_EXISTS: 409,
  KEY_NOT_FOUND: 404,
  UNAUTHORIZED_KEY_ACCESS: 403,
  MISSING_FIELDS: 400,
  NO_API_KEY: 400,
  ALL_KEYS_FAILED: 502,
  VALIDATION_FAILED: 400,
  INTERNAL_ERROR: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  status?: number,
  extra?: Record<string, unknown>
): NextResponse {
  const statusCode = status || statusMap[code] || 500;
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...extra,
      },
    },
    { status: statusCode }
  );
}
