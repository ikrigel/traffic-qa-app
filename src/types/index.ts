export type Theme = 'light' | 'dark' | 'auto';

export interface User {
  id: string;
  email: string;
  name: string;
  theme: Theme;
  showAnswers: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface Question {
  id: number;
  hebrew: string;
  english: string;
  answer: string;
  category: string;
  important: boolean;
  examFrequency: number;
}

export interface GoogleOAuthResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}
