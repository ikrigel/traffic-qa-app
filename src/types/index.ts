export type Theme = 'light' | 'dark' | 'auto';
export type Role = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  theme?: Theme;
  showAnswers?: boolean;
  location?: string | null;
  country?: string | null;
  city?: string | null;
  created_at?: string;
  last_login?: string | null;
  createdAt?: string;
  lastLogin?: string;
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

export interface RagDocument {
  id: string;
  title: string;
  source: string | null;
  content: string;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

export interface DebugLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  context: Record<string, unknown> | null;
  createdAt: string;
}

export interface RagEvaluation {
  id: string;
  question: string;
  expectedAnswer: string | null;
  aiAnswer: string;
  retrievedDocumentIds: string[] | null;
  metrics: Record<string, number> | null;
  createdBy: string | null;
  createdAt: string;
}

export interface TestAttempt {
  id: string;
  userId: string;
  questionId: number;
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  inputMethod: 'typed' | 'voice';
  verdict: string | null;
  metrics: Record<string, number> | null;
  feedback: string | null;
  createdAt: string;
}

export interface RagasMetrics {
  faithfulness?: number;
  relevance?: number;
  coherence?: number;
  contextPrecision?: number;
  contextRecall?: number;
  [key: string]: number | undefined;
}

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'ollama' | 'huggingface';

export interface APIKey {
  id: string;
  userId: string;
  provider: AIProvider;
  displayName?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  lastUsedAt?: string;
  rotatedAt?: string;
}

export interface ProviderConfig {
  id: string;
  provider: AIProvider;
  isEnabled: boolean;
  defaultModel?: string;
  rateLimitPerMinute?: number;
  costPerRequest?: number;
  createdAt: string;
  updatedAt: string;
}

export interface APIKeyUsage {
  id: string;
  apiKeyId: string;
  userId: string;
  provider: AIProvider;
  operation: 'embedding' | 'generation' | 'grading';
  tokensUsed?: number;
  costIncurred?: number;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}
