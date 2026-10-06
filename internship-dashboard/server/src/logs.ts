type LogLevel = 'info' | 'warn' | 'error' | 'stdout' | 'stderr' | 'system';

export type LogEntry = {
  id: number;
  ts: string;
  weekId: string;
  stream: LogLevel;
  text: string;
};

type Listener = (entry: LogEntry) => void;

const MAX = 2000;
const buffer: LogEntry[] = [];
let seq = 0;
const listeners = new Set<Listener>();

export function appendLog(weekId: string, stream: LogLevel, text: string): void {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (const line of lines) {
    if (!line && lines.length > 1) continue;
    const entry: LogEntry = {
      id: ++seq,
      ts: new Date().toISOString(),
      weekId,
      stream,
      text: line,
    };
    buffer.push(entry);
    if (buffer.length > MAX) buffer.shift();
    for (const listener of listeners) listener(entry);
  }
}

export function getLogs(weekId?: string, afterId = 0): LogEntry[] {
  return buffer.filter((e) => e.id > afterId && (!weekId || e.weekId === weekId));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
