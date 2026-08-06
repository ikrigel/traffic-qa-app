import { jwtDecode } from 'jwt-decode';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';

export const getGoogleAuthUrl = () => {
  const redirectUri = `${APP_URL}/auth/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

export const exchangeCodeForToken = async (code: string) => {
  const redirectUri = `${APP_URL}/auth/callback`;

  if (!GOOGLE_CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
  }
  if (!GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_SECRET is not set');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AUTH] Token exchange failed:', response.status, errorText);
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  return response.json();
};

export const getUserInfo = (idToken: string) => {
  const decoded = jwtDecode<{
    email: string;
    name: string;
    picture: string;
  }>(idToken);
  return decoded;
};
