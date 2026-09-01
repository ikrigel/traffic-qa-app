/* eslint-disable no-console */
'use client';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'network';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  source: string;
  message: string;
  data?: any;
  stack?: string;
}

type ConsoleListener = (entry: LogEntry) => void;

class ConsoleInterceptor {
  private listeners: Set<ConsoleListener> = new Set();
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private currentLevel: LogLevel = 'debug';
  private originalConsole = { ...console };
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupInterceptors();
      this.initialized = true;
    }
  }

  private setupInterceptors() {
    // Intercept console.log
    console.log = (...args: any[]) => {
      this.originalConsole.log(...args);
      this.addLog('info', 'console', args);
    };

    // Intercept console.debug
    console.debug = (...args: any[]) => {
      this.originalConsole.debug(...args);
      this.addLog('debug', 'console', args);
    };

    // Intercept console.trace
    console.trace = (...args: any[]) => {
      this.originalConsole.trace(...args);
      const stack = new Error().stack || '';
      this.addLog('trace', 'console', args, { stack });
    };

    // Intercept console.info
    console.info = (...args: any[]) => {
      this.originalConsole.info(...args);
      this.addLog('info', 'console', args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      this.originalConsole.warn(...args);
      this.addLog('warn', 'console', args);
    };

    // Intercept console.error
    console.error = (...args: any[]) => {
      this.originalConsole.error(...args);
      this.addLog('error', 'console', args);
    };

    // Intercept global errors
    window.addEventListener('error', (event) => {
      this.addLog('error', 'global', [event.message], { filename: event.filename, lineno: event.lineno });
    });

    // Intercept unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.addLog('error', 'promise', [event.reason], { reason: event.reason });
    });

    // Intercept fetch/network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args: any[]) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
      const startTime = performance.now();
      try {
        const response = await originalFetch.apply(window, args as Parameters<typeof fetch>);
        const duration = performance.now() - startTime;
        this.addLog('network', 'fetch', [`${response.status} ${response.statusText}`], {
          url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: `${duration.toFixed(0)}ms`,
        });
        return response;
      } catch (err) {
        this.addLog('error', 'fetch', [String(err)], { url });
        throw err;
      }
    };
  }

  private addLog(level: LogLevel, source: string, args: any[], extra?: any) {
    const message = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
      return String(arg);
    }).join(' ');

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      source,
      message,
      data: extra,
    };

    // Only add if it meets the current level threshold
    if (this.meetsLevelThreshold(level)) {
      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      this.notifyListeners(entry);
    }
  }

  private meetsLevelThreshold(level: LogLevel): boolean {
    const levelOrder: LogLevel[] = ['error', 'warn', 'info', 'debug', 'trace', 'network'];
    const currentIndex = levelOrder.indexOf(this.currentLevel);
    const logIndex = levelOrder.indexOf(level);
    return logIndex <= currentIndex;
  }

  private notifyListeners(entry: LogEntry) {
    this.listeners.forEach(listener => listener(entry));
  }

  subscribe(listener: ConsoleListener): () => void {
    if (!this.initialized) return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!this.initialized) return [];
    if (!level) return [...this.logs];
    return this.logs.filter(log => log.level === level || this.meetsLevelThreshold(log.level));
  }

  setLevel(level: LogLevel) {
    if (!this.initialized) return;
    this.currentLevel = level;
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  clear() {
    if (!this.initialized) return;
    this.logs = [];
    this.notifyListeners({ timestamp: new Date(), level: 'info', source: 'system', message: 'Logs cleared' });
  }
}

export const consoleInterceptor = new ConsoleInterceptor();
