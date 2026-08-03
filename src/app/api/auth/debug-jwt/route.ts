import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({
        status: 'no_token',
        message: 'No auth_token cookie found',
      });
    }

    try {
      const decoded = jwtDecode<any>(token);
      return NextResponse.json({
        status: 'token_found',
        message: 'JWT token decoded (without verification)',
        decoded,
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        isExpired: decoded.exp * 1000 < Date.now(),
      });
    } catch (decodeError) {
      return NextResponse.json({
        status: 'invalid_jwt',
        message: 'Token is not a valid JWT',
        error: decodeError instanceof Error ? decodeError.message : 'Unknown error',
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
