type LogLevel = 'info' | 'warn' | 'error';

export function log(level: LogLevel, scope: string, message: string, detail?: unknown): void {
  const prefix = `${new Date().toISOString()} [${level.toUpperCase()}] [${scope}]`;
  if (detail === undefined) console[level](`${prefix} ${message}`);
  else console[level](`${prefix} ${message}`, detail);
}
