let loggingEnabled = true;

export function isLoggingEnabled(): boolean {
  return loggingEnabled;
}

export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled;
}
