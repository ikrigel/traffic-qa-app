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

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    const self = this;

    // Intercept console.log
    console.log = (...args: any[]) => {
      self.originalConsole.log(...args);
      self.addLog('info', 'console', args);
    };

    // Intercept console.debug
    console.debug = (...args: any[]) => {
      self.originalConsole.debug(...args);
      self.addLog('debug', 'console', args);
    };

    // Intercept console.trace
    console.trace = (...args: any[]) => {
      self.originalConsole.trace(...args);
      const stack = new Error().stack || '';
      self.addLog('trace', 'console', args, { stack });
    };

    // Intercept console.info
    console.info = (...args: any[]) => {
      self.originalConsole.info(...args);
      self.addLog('info', 'console', args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      self.originalConsole.warn(...args);
      self.addLog('warn', 'console', args);
    };

    // Intercept console.error
    console.error = (...args: any[]) => {
      self.originalConsole.error(...args);
      self.addLog('error', 'console', args);
    };

    // Intercept global errors
    window.addEventListener('error', (event) => {
      self.addLog('error', 'global', [event.message], { filename: event.filename, lineno: event.lineno });
    });

    // Intercept unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      self.addLog('error', 'promise', [event.reason], { reason: event.reason });
    });

    // Intercept fetch/network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args: any[]) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        self.addLog('network', 'fetch', [`${response.status} ${response.statusText}`], {
          url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: `${duration.toFixed(0)}ms`,
        });
        return response;
      } catch (err) {
        self.addLog('error', 'fetch', [String(err)], { url });
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
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return [...this.logs];
    return this.logs.filter(log => log.level === level || this.meetsLevelThreshold(log.level));
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  clear() {
    this.logs = [];
    this.notifyListeners({ timestamp: new Date(), level: 'info', source: 'system', message: 'Logs cleared' });
  }
}

export const consoleInterceptor = new ConsoleInterceptor();
