import { getServiceSupabase } from './supabase';

type LogLevel = 'info' | 'warn' | 'error';

interface LogInput {
  source: string;
  message: string;
  context?: Record<string, unknown>;
  level?: LogLevel;
}

let logQueue: LogInput[] = [];
let isProcessing = false;

const processLogQueue = async (): Promise<void> => {
  if (isProcessing || logQueue.length === 0) return;

  isProcessing = true;
  const logsToProcess = [...logQueue];
  logQueue = [];

  try {
    const supabase = getServiceSupabase();
    for (const log of logsToProcess) {
      try {
        await supabase.from('debug_logs').insert({
          level: log.level || 'info',
          source: log.source,
          message: log.message,
          context: log.context ?? null,
        });
      } catch (err) {
        console.error(`[LOGGER] Failed to log: ${log.message}`, err);
      }
    }
  } finally {
    isProcessing = false;
    if (logQueue.length > 0) {
      setTimeout(processLogQueue, 100);
    }
  }
};

export const appLog = async ({
  source,
  message,
  context,
  level = 'info',
}: LogInput): Promise<void> => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${source}]`;
  console.log(`${prefix} ${message}`, context ? context : '');

  logQueue.push({ source, message, context, level });
  processLogQueue().catch(err => console.error('[LOGGER] Queue processing failed:', err));
};

export const logError = async ({
  source,
  message,
  context,
  level = 'error',
}: LogInput): Promise<void> => {
  return appLog({ source, message, context, level });
};

export const logInfo = async (source: string, message: string, context?: Record<string, unknown>): Promise<void> => {
  return appLog({ source, message, context, level: 'info' });
};

export const logWarn = async (source: string, message: string, context?: Record<string, unknown>): Promise<void> => {
  return appLog({ source, message, context, level: 'warn' });
};
