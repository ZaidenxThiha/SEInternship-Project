import fs from 'node:fs';
import path from 'node:path';
import { WEEKS } from './weeks.js';

export type LlmProvider = 'qwen' | 'openai' | 'gemini' | 'ollama';

export type LlmSettingsPublic = {
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
  qwen?: {
    baseUrl?: string;
    chatModel?: string;
    apiKey?: string;
  };
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
  ollama?: {
    baseUrl?: string;
    chatModel?: string;
    embeddingModel?: string;
  };
  clearQwenApiKey?: boolean;
  clearOpenaiApiKey?: boolean;
  clearGeminiApiKey?: boolean;
};

const DEFAULTS = {
  provider: 'qwen' as LlmProvider,
  qwenBaseUrl: 'https://203.55.176.215.sslip.io/v1',
  qwenChatModel: 'qwen3-chat',
  openaiBaseUrl: 'https://api.openai.com/v1',
  openaiChatModel: 'gpt-4o-mini',
  openaiEmbeddingModel: 'text-embedding-3-small',
  geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
  geminiChatModel: 'gemini-3.5-flash-lite',
  geminiEmbeddingModel: 'gemini-embedding-001',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaChatModel: 'llama3.2',
  ollamaEmbeddingModel: 'nomic-embed-text',
};

const RESTART_HINT =
  'Stop and Start Week 2 after changing provider or chat API key/URL/model so Vite reloads the proxy. After switching embedding models, re-ingest Week 3/4 data.';

const PROVIDERS: LlmProvider[] = ['qwen', 'openai', 'gemini', 'ollama'];

function envPath(weekDir: string): string {
  return path.join(weekDir, '.env');
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function escapeEnvValue(value: string): string {
  if (/[\s#"']/.test(value) || value.includes('\n') || value.includes('=')) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

/** Upsert known keys; preserve unrelated lines and comments. */
function upsertEnvFile(filePath: string, updates: Record<string, string | null>): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    throw new Error(`Week directory missing: ${dir}`);
  }

  const keys = Object.keys(updates);
  const seen = new Set<string>();
  const lines: string[] = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
    : [];

  const next = lines.map((rawLine) => {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) return rawLine;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) return rawLine;
    const key = trimmed.slice(0, eq).trim();
    if (!(key in updates)) return rawLine;
    seen.add(key);
    const value = updates[key];
    if (value === null) return `${key}=`;
    return `${key}=${escapeEnvValue(value)}`;
  });

  for (const key of keys) {
    if (seen.has(key)) continue;
    const value = updates[key];
    if (value === null) continue;
    if (next.length && next[next.length - 1] !== '') next.push('');
    next.push(`${key}=${escapeEnvValue(value)}`);
  }

  while (next.length > 0 && next[next.length - 1] === '') next.pop();
  fs.writeFileSync(filePath, `${next.join('\n')}\n`, 'utf8');
}

function maskKey(key: string | undefined): { set: boolean; hint: string | null } {
  if (!key) return { set: false, hint: null };
  const hint = key.length <= 4 ? '••••' : `••••${key.slice(-4)}`;
  return { set: true, hint };
}

function readCanonical(): Record<string, string> {
  // Prefer week4, then week3, then week2. Do NOT use Array.reverse() — it mutates.
  const week2 = parseEnvFile(envPath(WEEKS.week2.dir));
  const week3 = parseEnvFile(envPath(WEEKS.week3.dir));
  const week4 = parseEnvFile(envPath(WEEKS.week4.dir));
  return { ...week2, ...week3, ...week4 };
}

function asProvider(value: string | undefined): LlmProvider {
  if (value && PROVIDERS.includes(value as LlmProvider)) return value as LlmProvider;
  return DEFAULTS.provider;
}

function normalizeQwenUrls(raw: string): { origin: string; api: string } {
  const origin = raw.replace(/\/v1\/?$/, '').replace(/\/$/, '');
  return { origin, api: `${origin}/v1` };
}

function normalizeGeminiUrl(raw: string): string {
  const trimmed = raw.replace(/\/$/, '');
  if (trimmed.endsWith('/v1beta/openai')) return trimmed;
  if (trimmed.includes('generativelanguage.googleapis.com')) {
    return `${trimmed.replace(/\/v1beta\/openai\/?$/, '').replace(/\/$/, '')}/v1beta/openai`;
  }
  return trimmed || DEFAULTS.geminiBaseUrl;
}

export function getLlmSettings(): LlmSettingsPublic {
  const env = readCanonical();
  const qwenKey = maskKey(env.QWEN_API_KEY);
  const openaiKey = maskKey(env.OPENAI_API_KEY);
  const geminiKey = maskKey(env.GEMINI_API_KEY);
  return {
    provider: asProvider(env.LLM_PROVIDER || env.VITE_LLM_PROVIDER),
    qwen: {
      // Always expose the API base (.../v1) in Settings / playground env
      baseUrl: normalizeQwenUrls(env.QWEN_BASE_URL || DEFAULTS.qwenBaseUrl).api,
      chatModel: env.QWEN_CHAT_MODEL || env.VITE_QWEN_CHAT_MODEL || DEFAULTS.qwenChatModel,
      apiKeySet: qwenKey.set,
      apiKeyHint: qwenKey.hint,
    },
    openai: {
      baseUrl: env.OPENAI_BASE_URL || DEFAULTS.openaiBaseUrl,
      chatModel: env.OPENAI_CHAT_MODEL || DEFAULTS.openaiChatModel,
      embeddingModel: env.OPENAI_EMBEDDING_MODEL || DEFAULTS.openaiEmbeddingModel,
      apiKeySet: openaiKey.set,
      apiKeyHint: openaiKey.hint,
    },
    gemini: {
      baseUrl: env.GEMINI_BASE_URL || DEFAULTS.geminiBaseUrl,
      chatModel: env.GEMINI_CHAT_MODEL || env.VITE_GEMINI_CHAT_MODEL || DEFAULTS.geminiChatModel,
      embeddingModel: env.GEMINI_EMBEDDING_MODEL || DEFAULTS.geminiEmbeddingModel,
      apiKeySet: geminiKey.set,
      apiKeyHint: geminiKey.hint,
    },
    ollama: {
      baseUrl: env.OLLAMA_BASE_URL || DEFAULTS.ollamaBaseUrl,
      chatModel: env.OLLAMA_CHAT_MODEL || DEFAULTS.ollamaChatModel,
      embeddingModel: env.OLLAMA_EMBEDDING_MODEL || DEFAULTS.ollamaEmbeddingModel,
    },
    restartHint: RESTART_HINT,
  };
}

export function putLlmSettings(body: LlmSettingsPut): LlmSettingsPublic {
  if (body.provider !== undefined && !PROVIDERS.includes(body.provider)) {
    throw Object.assign(new Error('provider must be qwen|openai|gemini|ollama'), {
      status: 400,
    });
  }

  const current = readCanonical();

  let qwenKey = current.QWEN_API_KEY || '';
  if (body.clearQwenApiKey) qwenKey = '';
  else if (body.qwen?.apiKey !== undefined && body.qwen.apiKey !== '') {
    qwenKey = body.qwen.apiKey;
  }

  let openaiKey = current.OPENAI_API_KEY || '';
  if (body.clearOpenaiApiKey) openaiKey = '';
  else if (body.openai?.apiKey !== undefined && body.openai.apiKey !== '') {
    openaiKey = body.openai.apiKey;
  }

  let geminiKey = current.GEMINI_API_KEY || '';
  if (body.clearGeminiApiKey) geminiKey = '';
  else if (body.gemini?.apiKey !== undefined && body.gemini.apiKey !== '') {
    geminiKey = body.gemini.apiKey;
  }

  const provider = body.provider ?? asProvider(current.LLM_PROVIDER);
  const qwenUrls = normalizeQwenUrls(
    body.qwen?.baseUrl?.trim() || current.QWEN_BASE_URL || DEFAULTS.qwenBaseUrl,
  );
  const qwenChatModel =
    body.qwen?.chatModel?.trim() || current.QWEN_CHAT_MODEL || DEFAULTS.qwenChatModel;
  const openaiBaseUrl =
    body.openai?.baseUrl?.trim() || current.OPENAI_BASE_URL || DEFAULTS.openaiBaseUrl;
  const openaiChatModel =
    body.openai?.chatModel?.trim() || current.OPENAI_CHAT_MODEL || DEFAULTS.openaiChatModel;
  const openaiEmbeddingModel =
    body.openai?.embeddingModel?.trim() ||
    current.OPENAI_EMBEDDING_MODEL ||
    DEFAULTS.openaiEmbeddingModel;
  const geminiBaseUrl = normalizeGeminiUrl(
    body.gemini?.baseUrl?.trim() || current.GEMINI_BASE_URL || DEFAULTS.geminiBaseUrl,
  );
  const geminiChatModel =
    body.gemini?.chatModel?.trim() || current.GEMINI_CHAT_MODEL || DEFAULTS.geminiChatModel;
  const geminiEmbeddingModel =
    body.gemini?.embeddingModel?.trim() ||
    current.GEMINI_EMBEDDING_MODEL ||
    DEFAULTS.geminiEmbeddingModel;
  const ollamaBaseUrl =
    body.ollama?.baseUrl?.trim() || current.OLLAMA_BASE_URL || DEFAULTS.ollamaBaseUrl;
  const ollamaChatModel =
    body.ollama?.chatModel?.trim() || current.OLLAMA_CHAT_MODEL || DEFAULTS.ollamaChatModel;
  const ollamaEmbeddingModel =
    body.ollama?.embeddingModel?.trim() ||
    current.OLLAMA_EMBEDDING_MODEL ||
    DEFAULTS.ollamaEmbeddingModel;

  const week34Updates: Record<string, string | null> = {
    LLM_PROVIDER: provider,
    QWEN_BASE_URL: qwenUrls.api,
    QWEN_API_KEY: qwenKey || null,
    QWEN_CHAT_MODEL: qwenChatModel,
    OPENAI_BASE_URL: openaiBaseUrl,
    OPENAI_API_KEY: openaiKey || null,
    OPENAI_CHAT_MODEL: openaiChatModel,
    OPENAI_EMBEDDING_MODEL: openaiEmbeddingModel,
    GEMINI_BASE_URL: geminiBaseUrl,
    GEMINI_API_KEY: geminiKey || null,
    GEMINI_CHAT_MODEL: geminiChatModel,
    GEMINI_EMBEDDING_MODEL: geminiEmbeddingModel,
    OLLAMA_BASE_URL: ollamaBaseUrl,
    OLLAMA_CHAT_MODEL: ollamaChatModel,
    OLLAMA_EMBEDDING_MODEL: ollamaEmbeddingModel,
  };

  const week2Updates: Record<string, string | null> = {
    LLM_PROVIDER: provider,
    VITE_LLM_PROVIDER: provider,
    QWEN_BASE_URL: qwenUrls.origin,
    QWEN_API_KEY: qwenKey || null,
    QWEN_CHAT_MODEL: qwenChatModel,
    VITE_QWEN_CHAT_MODEL: qwenChatModel,
    OPENAI_BASE_URL: openaiBaseUrl,
    OPENAI_API_KEY: openaiKey || null,
    OPENAI_CHAT_MODEL: openaiChatModel,
    VITE_OPENAI_CHAT_MODEL: openaiChatModel,
    GEMINI_BASE_URL: geminiBaseUrl,
    GEMINI_API_KEY: geminiKey || null,
    GEMINI_CHAT_MODEL: geminiChatModel,
    VITE_GEMINI_CHAT_MODEL: geminiChatModel,
  };

  upsertEnvFile(envPath(WEEKS.week3.dir), week34Updates);
  upsertEnvFile(envPath(WEEKS.week4.dir), week34Updates);
  upsertEnvFile(envPath(WEEKS.week2.dir), week2Updates);

  return getLlmSettings();
}

/** Flat env overlay for playground / process spawns (includes secrets). */
export function llmEnvForProcess(): Record<string, string> {
  const s = getLlmSettings();
  const env = readCanonical();
  const qwenApi = normalizeQwenUrls(s.qwen.baseUrl).api;
  const out: Record<string, string> = {
    LLM_PROVIDER: s.provider,
    QWEN_BASE_URL: qwenApi,
    QWEN_CHAT_MODEL: s.qwen.chatModel,
    OPENAI_BASE_URL: s.openai.baseUrl,
    OPENAI_CHAT_MODEL: s.openai.chatModel,
    OPENAI_EMBEDDING_MODEL: s.openai.embeddingModel,
    GEMINI_BASE_URL: s.gemini.baseUrl,
    GEMINI_CHAT_MODEL: s.gemini.chatModel,
    GEMINI_EMBEDDING_MODEL: s.gemini.embeddingModel,
    OLLAMA_BASE_URL: s.ollama.baseUrl,
    OLLAMA_CHAT_MODEL: s.ollama.chatModel,
    OLLAMA_EMBEDDING_MODEL: s.ollama.embeddingModel,
  };
  if (env.QWEN_API_KEY) out.QWEN_API_KEY = env.QWEN_API_KEY;
  if (env.OPENAI_API_KEY) out.OPENAI_API_KEY = env.OPENAI_API_KEY;
  if (env.GEMINI_API_KEY) out.GEMINI_API_KEY = env.GEMINI_API_KEY;
  return out;
}
