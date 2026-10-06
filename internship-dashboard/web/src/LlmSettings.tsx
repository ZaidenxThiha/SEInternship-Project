import { useEffect, useState } from 'react'
import { Save, KeyRound } from 'lucide-react'
import { client, type LlmProvider, type LlmSettings } from './api'

type Props = {
  busy: boolean
  setBusy: (v: boolean) => void
  setError: (v: string | null) => void
}

const PROVIDERS: LlmProvider[] = ['qwen', 'openai', 'gemini', 'ollama']

export function LlmSettingsPanel({ busy, setBusy, setError }: Props) {
  const [settings, setSettings] = useState<LlmSettings | null>(null)
  const [provider, setProvider] = useState<LlmProvider>('qwen')
  const [qwenBaseUrl, setQwenBaseUrl] = useState('')
  const [qwenChatModel, setQwenChatModel] = useState('')
  const [qwenApiKey, setQwenApiKey] = useState('')
  const [clearQwen, setClearQwen] = useState(false)
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('')
  const [openaiChatModel, setOpenaiChatModel] = useState('')
  const [openaiEmbeddingModel, setOpenaiEmbeddingModel] = useState('')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [clearOpenai, setClearOpenai] = useState(false)
  const [geminiBaseUrl, setGeminiBaseUrl] = useState('')
  const [geminiChatModel, setGeminiChatModel] = useState('')
  const [geminiEmbeddingModel, setGeminiEmbeddingModel] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [clearGemini, setClearGemini] = useState(false)
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('')
  const [ollamaChatModel, setOllamaChatModel] = useState('')
  const [ollamaEmbeddingModel, setOllamaEmbeddingModel] = useState('')
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  async function load() {
    setBusy(true)
    setError(null)
    try {
      const data = await client.getLlmSettings()
      apply(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  function apply(data: LlmSettings) {
    setSettings(data)
    setProvider(data.provider)
    setQwenBaseUrl(data.qwen.baseUrl)
    setQwenChatModel(data.qwen.chatModel)
    setOpenaiBaseUrl(data.openai.baseUrl)
    setOpenaiChatModel(data.openai.chatModel)
    setOpenaiEmbeddingModel(data.openai.embeddingModel)
    setGeminiBaseUrl(data.gemini.baseUrl)
    setGeminiChatModel(data.gemini.chatModel)
    setGeminiEmbeddingModel(data.gemini.embeddingModel)
    setOllamaBaseUrl(data.ollama.baseUrl)
    setOllamaChatModel(data.ollama.chatModel)
    setOllamaEmbeddingModel(data.ollama.embeddingModel)
    setQwenApiKey('')
    setOpenaiApiKey('')
    setGeminiApiKey('')
    setClearQwen(false)
    setClearOpenai(false)
    setClearGemini(false)
  }

  useEffect(() => {
    load().catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    setBusy(true)
    setError(null)
    setSavedMsg(null)
    try {
      const data = await client.putLlmSettings({
        provider,
        qwen: {
          baseUrl: qwenBaseUrl,
          chatModel: qwenChatModel,
          ...(qwenApiKey.trim() ? { apiKey: qwenApiKey.trim() } : {}),
        },
        openai: {
          baseUrl: openaiBaseUrl,
          chatModel: openaiChatModel,
          embeddingModel: openaiEmbeddingModel,
          ...(openaiApiKey.trim() ? { apiKey: openaiApiKey.trim() } : {}),
        },
        gemini: {
          baseUrl: geminiBaseUrl,
          chatModel: geminiChatModel,
          embeddingModel: geminiEmbeddingModel,
          ...(geminiApiKey.trim() ? { apiKey: geminiApiKey.trim() } : {}),
        },
        ollama: {
          baseUrl: ollamaBaseUrl,
          chatModel: ollamaChatModel,
          embeddingModel: ollamaEmbeddingModel,
        },
        clearQwenApiKey: clearQwen || undefined,
        clearOpenaiApiKey: clearOpenai || undefined,
        clearGeminiApiKey: clearGemini || undefined,
      })
      apply(data)
      setSavedMsg('Saved to week2 / week3 / week4 .env files.')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-white'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <KeyRound size={14} className="text-[var(--accent-2)]" />
            Shared LLM settings (Weeks 2–4)
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            One provider, keys, and models for the React chat and both RAG demos. Keys stay on the
            server and are never returned in full.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => save()}
          className="inline-flex items-center gap-2 rounded bg-[var(--accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-40"
        >
          <Save size={14} /> Save
        </button>
      </div>

      {settings?.restartHint && (
        <div className="rounded border border-[var(--accent-2)]/30 bg-[var(--accent-2)]/10 px-3 py-2 text-xs text-[var(--accent-2)]">
          {settings.restartHint}
        </div>
      )}

      {savedMsg && (
        <div className="rounded border border-[var(--ok)]/40 bg-[var(--ok)]/10 px-3 py-2 text-xs text-[var(--ok)]">
          {savedMsg}
        </div>
      )}

      <label className="text-sm">
        <span className="text-[var(--muted)]">Provider</span>
        <select
          className={inputClass}
          value={provider}
          disabled={busy}
          onChange={(e) => setProvider(e.target.value as LlmProvider)}
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="rounded-lg border border-[var(--border)] p-3">
        <legend className="px-1 text-xs text-[var(--muted)]">Qwen (VPS)</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            <span className="text-[var(--muted)]">Base URL</span>
            <input
              className={inputClass}
              value={qwenBaseUrl}
              disabled={busy}
              onChange={(e) => setQwenBaseUrl(e.target.value)}
              placeholder="https://host/v1"
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--muted)]">Chat model</span>
            <input
              className={inputClass}
              value={qwenChatModel}
              disabled={busy}
              onChange={(e) => setQwenChatModel(e.target.value)}
              placeholder="qwen3-chat"
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--muted)]">
              API key{' '}
              {settings?.qwen.apiKeySet ? (
                <span className="text-[var(--ok)]">({settings.qwen.apiKeyHint} set)</span>
              ) : (
                <span>(not set)</span>
              )}
            </span>
            <input
              type="password"
              autoComplete="off"
              className={inputClass}
              value={qwenApiKey}
              disabled={busy || clearQwen}
              onChange={(e) => setQwenApiKey(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </label>
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
          <input
            type="checkbox"
            checked={clearQwen}
            disabled={busy}
            onChange={(e) => setClearQwen(e.target.checked)}
          />
          Clear Qwen API key
        </label>
      </fieldset>

      <fieldset className="rounded-lg border border-[var(--border)] p-3">
        <legend className="px-1 text-xs text-[var(--muted)]">Gemini</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            <span className="text-[var(--muted)]">Base URL (OpenAI-compatible)</span>
            <input
              className={inputClass}
              value={geminiBaseUrl}
              disabled={busy}
              onChange={(e) => setGeminiBaseUrl(e.target.value)}
              placeholder="https://generativelanguage.googleapis.com/v1beta/openai"
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--muted)]">Chat model</span>
            <input
              className={inputClass}
              value={geminiChatModel}
              disabled={busy}
              onChange={(e) => setGeminiChatModel(e.target.value)}
              placeholder="gemini-3.5-flash-lite"
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--muted)]">Embedding model</span>
            <input
              className={inputClass}
              value={geminiEmbeddingModel}
              disabled={busy}
              onChange={(e) => setGeminiEmbeddingModel(e.target.value)}
              placeholder="gemini-embedding-001"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-[var(--muted)]">
              API key{' '}
              {settings?.gemini.apiKeySet ? (
                <span className="text-[var(--ok)]">({settings.gemini.apiKeyHint} set)</span>
              ) : (
                <span>(not set)</span>
              )}
            </span>
            <input
              type="password"
              autoComplete="off"
              className={inputClass}
              value={geminiApiKey}
              disabled={busy || clearGemini}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </label>
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
          <input
            type="checkbox"
            checked={clearGemini}
            disabled={busy}
            onChange={(e) => setClearGemini(e.target.checked)}
          />
          Clear Gemini API key
        </label>
      </fieldset>

      <fieldset className="rounded-lg border border-[var(--border)] p-3">
        <legend className="px-1 text-xs text-[var(--muted)]">OpenAI</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            <span className="text-[var(--muted)]">Base URL</span>
            <input
              className={inputClass}
              value={openaiBaseUrl}
              disabled={busy}
              onChange={(e) => setOpenaiBaseUrl(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--muted)]">Chat model</span>
            <input
              className={inputClass}
              value={openaiChatModel}
              disabled={busy}
              onChange={(e) => setOpenaiChatModel(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--muted)]">Embedding model</span>
            <input
              className={inputClass}
              value={openaiEmbeddingModel}
              disabled={busy}
              onChange={(e) => setOpenaiEmbeddingModel(e.target.value)}
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-[var(--muted)]">
              API key{' '}
              {settings?.openai.apiKeySet ? (
                <span className="text-[var(--ok)]">({settings.openai.apiKeyHint} set)</span>
              ) : (
                <span>(not set)</span>
              )}
            </span>
            <input
              type="password"
              autoComplete="off"
              className={inputClass}
              value={openaiApiKey}
              disabled={busy || clearOpenai}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </label>
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
          <input
            type="checkbox"
            checked={clearOpenai}
            disabled={busy}
            onChange={(e) => setClearOpenai(e.target.checked)}
          />
          Clear OpenAI API key
        </label>
      </fieldset>

      <fieldset className="rounded-lg border border-[var(--border)] p-3">
        <legend className="px-1 text-xs text-[var(--muted)]">Ollama (local embeddings / fallback)</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            <span className="text-[var(--muted)]">Base URL</span>
            <input
              className={inputClass}
              value={ollamaBaseUrl}
              disabled={busy}
              onChange={(e) => setOllamaBaseUrl(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--muted)]">Chat model</span>
            <input
              className={inputClass}
              value={ollamaChatModel}
              disabled={busy}
              onChange={(e) => setOllamaChatModel(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--muted)]">Embedding model</span>
            <input
              className={inputClass}
              value={ollamaEmbeddingModel}
              disabled={busy}
              onChange={(e) => setOllamaEmbeddingModel(e.target.value)}
            />
          </label>
        </div>
      </fieldset>
    </div>
  )
}
