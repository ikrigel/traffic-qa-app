import { getServiceSupabase } from './supabase';

type LogLevel = 'info' | 'warn' | 'error';

interface LogErrorInput {
  source: string;
  message: string;
  context?: Record<string, unknown>;
  level?: LogLevel;
}

export const logError = async ({
  source,
  message,
  context,
  level = 'error',
}: LogErrorInput): Promise<void> => {
  try {
    const supabase = getServiceSupabase();
    await supabase.from('debug_logs').insert({
      level,
      source,
      message,
      context: context ?? null,
    });
  } catch (loggingError) {
    console.error('Failed to write debug log:', loggingError);
  }
};
