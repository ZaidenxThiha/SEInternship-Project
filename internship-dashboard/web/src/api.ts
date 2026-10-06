export type WeekId = 'week1' | 'week2' | 'week3' | 'week4';

export type WeekSummary = {
  id: WeekId;
  title: string;
  subtitle: string;
  modeDefault: 'compose' | 'local';
  openUrls: { label: string; url: string }[];
  runtime: Runtime;
};

export type Runtime = {
  weekId: WeekId;
  mode: 'compose' | 'local';
  running: boolean;
  procs: { id: string; label: string; pid?: number; startedAt: string; kind: string }[];
};

export type BulkWeekResult = {
  weekId: WeekId;
  ok: boolean;
  runtime: Runtime;
  error?: string;
};

export type Probe = {
  id: string;
  label: string;
  kind: 'http' | 'tcp';
  ok: boolean;
  detail: string;
};

export type StatusPayload = {
  runtime: Runtime;
  probes: Probe[];
  openUrls: { label: string; url: string }[];
};

export type LogEntry = {
  id: number;
  ts: string;
  weekId: string;
  stream: string;
  text: string;
};

export type LlmProvider = 'qwen' | 'openai' | 'gemini' | 'ollama';

export type LlmSettings = {
  provider: LlmProvider;
  qwen: {
    baseUrl: string;
    chatModel: string;
    apiKeySet: boolean;
    apiKeyHint: string | null;
  };
  openai: {
    baseUrl: string;
    chatModel: string;
    embeddingModel: string;
    apiKeySet: boolean;
    apiKeyHint: string | null;
  };
  gemini: {
    baseUrl: string;
    chatModel: string;
    embeddingModel: string;
    apiKeySet: boolean;
    apiKeyHint: string | null;
  };
  ollama: {
    baseUrl: string;
    chatModel: string;
    embeddingModel: string;
  };
  restartHint: string;
};

export type LlmSettingsPut = {
  provider?: LlmProvider;
  qwen?: { baseUrl?: string; chatModel?: string; apiKey?: string };
  openai?: {
    baseUrl?: string;
    chatModel?: string;
    embeddingModel?: string;
    apiKey?: string;
  };
  gemini?: {
    baseUrl?: string;
    chatModel?: string;
    embeddingModel?: string;
    apiKey?: string;
  };
  ollama?: { baseUrl?: string; chatModel?: string; embeddingModel?: string };
  clearQwenApiKey?: boolean;
  clearOpenaiApiKey?: boolean;
  clearGeminiApiKey?: boolean;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText);
  }
  return data as T;
}

export const client = {
  weeks: () => api<WeekSummary[]>('/api/weeks'),
  status: (id: WeekId) => api<StatusPayload>(`/api/weeks/${id}/status`),
  setMode: (id: WeekId, mode: 'compose' | 'local') =>
    api<Runtime>(`/api/weeks/${id}/mode`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
  start: (id: WeekId) => api<Runtime>(`/api/weeks/${id}/start`, { method: 'POST' }),
  stop: (id: WeekId) => api<Runtime>(`/api/weeks/${id}/stop`, { method: 'POST' }),
  startAll: () =>
    api<{ ok: boolean; results: BulkWeekResult[] }>('/api/weeks/start-all', {
      method: 'POST',
    }),
  stopAll: () =>
    api<{ ok: boolean; results: BulkWeekResult[] }>('/api/weeks/stop-all', {
      method: 'POST',
    }),
  playground: (id: WeekId, action: string, payload: Record<string, unknown> = {}) =>
    api<{ ok: boolean; result: unknown }>(`/api/weeks/${id}/playground`, {
      method: 'POST',
      body: JSON.stringify({ action, payload }),
    }),
  logs: (id: WeekId, after = 0) =>
    api<{ entries: LogEntry[] }>(`/api/weeks/${id}/logs?after=${after}`),
  getLlmSettings: () => api<LlmSettings>('/api/llm-settings'),
  putLlmSettings: (body: LlmSettingsPut) =>
    api<LlmSettings>('/api/llm-settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};
