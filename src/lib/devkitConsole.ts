'use client';

import { createDebugManager, installWindowGlobal } from 'devkit-console-core';

let debugManagerInstance: ReturnType<typeof createDebugManager> | null = null;

export function initDebugManager() {
  if (typeof window === 'undefined') return null;
  if (debugManagerInstance) return debugManagerInstance;

  debugManagerInstance = createDebugManager(undefined, 'DEBUG');
  installWindowGlobal(debugManagerInstance);
  return debugManagerInstance;
}

export function getDebugManagerInstance() {
  if (typeof window === 'undefined') return null;
  if (!debugManagerInstance) initDebugManager();
  return debugManagerInstance;
}

export const appLogger = {
  trace: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('app').trace(msg, data),
  debug: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('app').debug(msg, data),
  info: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('app').info(msg, data),
  warn: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('app').warn(msg, data),
  error: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('app').error(msg, data),
};

export const authLogger = {
  trace: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('auth').trace(msg, data),
  debug: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('auth').debug(msg, data),
  info: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('auth').info(msg, data),
  warn: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('auth').warn(msg, data),
  error: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('auth').error(msg, data),
};

export const ragLogger = {
  trace: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('rag').trace(msg, data),
  debug: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('rag').debug(msg, data),
  info: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('rag').info(msg, data),
  warn: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('rag').warn(msg, data),
  error: (msg: string, data?: unknown) => getDebugManagerInstance()?.ns('rag').error(msg, data),
};
