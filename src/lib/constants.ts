export const APP_NAME = 'Traffic Laws Q&A';
export const APP_DESCRIPTION = 'Learn Israeli traffic laws with interactive Q&A';
export const APP_VERSION = '1.6.0';
export const AUTHOR = 'Traffic Laws Community';

export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

export const SESSION_EXPIRY_DAYS = 90;
export const SESSION_CHECK_INTERVAL = 3600000; // 1 hour
export const DEVICE_ID_STORAGE_KEY = 'app_device_id';
export const SESSION_TOKEN_STORAGE_KEY = 'app_session_token';
export const USER_STORAGE_KEY = 'app_user';
export const THEME_STORAGE_KEY = 'app_theme';

export const IMPORTANT_QUESTION_IDS = [3, 6, 7, 10, 11, 20];

export const TOAST_DURATION = 3000;

export const SUPER_ADMIN_EMAIL = 'ikrigel@gmail.com';
export const ROLES = ['user', 'admin', 'super_admin'] as const;
export const ADMIN_ROLES = ['admin', 'super_admin'] as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  AUTH_CALLBACK: '/auth/callback',
  API_AUTH: '/api/auth',
  API_QUESTIONS: '/api/questions'
};

export const ERROR_MESSAGES = {
  AUTH_FAILED: 'Authentication failed. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_DEVICE: 'Unrecognized device. Please login again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  FORBIDDEN: 'You do not have permission to perform this action.'
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.'
};

export const THEMES = ['light', 'dark', 'auto'] as const;

export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 1024,
  DESKTOP: 1280
};

export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
};
