import { useState, type ReactNode } from 'react'
import { client, type WeekId } from './api'

type Props = {
  weekId: WeekId
  busy: boolean
  setBusy: (v: boolean) => void
  setError: (v: string | null) => void
}

export function Playground({ weekId, busy, setBusy, setError }: Props) {
  const [out, setOut] = useState<string>('')

  async function run(action: string, payload: Record<string, unknown> = {}) {
    setBusy(true)
    setError(null)
    try {
      const res = await client.playground(weekId, action, payload)
      setOut(formatPlaygroundResult(weekId, action, res.result))
      return res.result
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return null
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-3">
        {weekId === 'week1' && <Week1Form busy={busy} run={run} />}
        {weekId === 'week2' && <Week2Form busy={busy} run={run} />}
        {weekId === 'week3' && <Week3Form busy={busy} run={run} />}
        {weekId === 'week4' && <Week4Form busy={busy} run={run} />}
      </div>
      <pre className="mono max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[#0b1016] p-3 text-[11px] text-[var(--text)]">
        {out || 'Playground responses appear here.'}
      </pre>
    </div>
  )
}

function formatPlaygroundResult(weekId: WeekId, action: string, result: unknown): string {
  if (
    weekId === 'week4' &&
    action === 'ask' &&
    result &&
    typeof result === 'object' &&
    'stdout' in result
  ) {
    const r = result as { ok?: boolean; mode?: string; stdout?: string; stderr?: string }
    const stdout = r.stdout || ''
    const answerMatch = stdout.match(/\nAnswer:\n([\s\S]*?)(?:\n\nSources:|\n\([a-z]+ mode,|\n*$)/)
    const answer = answerMatch?.[1]?.trim()
    const lines: string[] = []
    if (answer) {
      lines.push(`Mode: ${r.mode || 'graph'}`)
      lines.push('')
      lines.push('Answer:')
      lines.push(answer)
      lines.push('')
      lines.push('--- full trace ---')
      lines.push(stdout.trim())
    } else {
      lines.push(stdout.trim() || JSON.stringify(result, null, 2))
    }
    if (r.stderr?.trim()) {
      lines.push('')
      lines.push('--- stderr ---')
      lines.push(r.stderr.trim())
    }
    return lines.join('\n')
  }
  return JSON.stringify(result, null, 2)
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block text-xs text-[var(--muted)]">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}

function inputClass() {
  return 'w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-white'
}

function Btn({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-1.5 text-sm hover:border-[var(--accent)] disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function Week1Form({
  busy,
  run,
}: {
  busy: boolean
  run: (a: string, p?: Record<string, unknown>) => Promise<unknown>
}) {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('Admin123!')
  const [name, setName] = useState('Demo User')
  const [token, setToken] = useState('')

  async function login() {
    const result = (await run('login', { email, password })) as
      | { status?: number; data?: { token?: string } }
      | null
    const next = result?.data?.token
    if (next) setToken(next)
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3">
      <p className="text-sm text-[var(--muted)]">
        Hit the Week 1 API directly (API must be running on :3000).
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Email">
          <input className={inputClass()} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input
            className={inputClass()}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Name (register)">
        <input className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Bearer token">
        <input className={inputClass()} value={token} onChange={(e) => setToken(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Btn disabled={busy} onClick={() => run('health')}>
          Health
        </Btn>
        <Btn disabled={busy} onClick={() => void login()}>
          Login
        </Btn>
        <Btn
          disabled={busy}
          onClick={() => run('register', { email, password, name })}
        >
          Register
        </Btn>
        <Btn disabled={busy || !token} onClick={() => run('me', { token })}>
          GET /me
        </Btn>
        <Btn disabled={busy || !token} onClick={() => run('listUsers', { token })}>
          List users
        </Btn>
      </div>
      <p className="text-[11px] text-[var(--muted)]">
        Tip: after Login, copy <code className="mono">token</code> from the JSON into the token field.
      </p>
    </div>
  )
}

function Week2Form({
  busy,
  run,
}: {
  busy: boolean
  run: (a: string, p?: Record<string, unknown>) => Promise<unknown>
}) {
  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3">
      <p className="text-sm text-[var(--muted)]">
        Week 2 is a full React UI. Ping services here, then open the app for login/chat/CRUD.
      </p>
      <div className="flex flex-wrap gap-2">
        <Btn disabled={busy} onClick={() => run('pingUi')}>
          Ping UI :5173
        </Btn>
        <Btn disabled={busy} onClick={() => run('pingApi')}>
          Ping API :3000
        </Btn>
        <a
          href="http://localhost:5173/login"
          target="_blank"
          rel="noreferrer"
          className="rounded border border-[var(--accent)]/40 px-3 py-1.5 text-sm text-[var(--accent)]"
        >
          Open login
        </a>
        <a
          href="http://localhost:5173/chat"
          target="_blank"
          rel="noreferrer"
          className="rounded border border-[var(--accent)]/40 px-3 py-1.5 text-sm text-[var(--accent)]"
        >
          Open chat
        </a>
      </div>
    </div>
  )
}

function Week3Form({
  busy,
  run,
}: {
  busy: boolean
  run: (a: string, p?: Record<string, unknown>) => Promise<unknown>
}) {
  const [question, setQuestion] = useState('What is RAG?')
  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3">
      <p className="text-sm text-[var(--muted)]">
        Requires pgvector (:5434) and embeddings (Ollama / Gemini / OpenAI). Start DB from Controls
        first. Ingest loads every <code className="mono">.txt</code> / <code className="mono">.md</code>{' '}
        file in <code className="mono">week3-rag-demo/data/</code> (e.g. sample.txt, wata_software.txt).
      </p>
      <div className="flex flex-wrap gap-2">
        <Btn disabled={busy} onClick={() => run('ingest')}>
          Ingest data/
        </Btn>
        <Btn disabled={busy} onClick={() => run('stats')}>
          Stats
        </Btn>
        <Btn
          disabled={busy}
          onClick={() => {
            if (window.confirm('Delete ALL ingested chunks from Week 3 pgvector?')) {
              void run('clear')
            }
          }}
        >
          Clear all
        </Btn>
        <Btn
          disabled={busy}
          onClick={() => {
            const source = window.prompt(
              'Delete chunks for which source filename?',
              'wata_software.txt',
            )
            if (source?.trim()) void run('clear', { source: source.trim() })
          }}
        >
          Clear one file
        </Btn>
      </div>
      <Field label="Question">
        <textarea
          className={inputClass() + ' min-h-20'}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </Field>
      <Btn disabled={busy} onClick={() => run('ask', { question })}>
        Ask
      </Btn>
    </div>
  )
}

function Week4Form({
  busy,
  run,
}: {
  busy: boolean
  run: (a: string, p?: Record<string, unknown>) => Promise<unknown>
}) {
  const [question, setQuestion] = useState('How is LangGraph different from LangChain?')
  const [mode, setMode] = useState<'graph' | 'chain'>('graph')
  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3">
      <p className="text-sm text-[var(--muted)]">
        Runs <code className="mono">python src/main.py -q …</code> in the Week 4 venv. Start DB from
        Controls. After changing LLM/embedding provider in Settings, use{' '}
        <strong className="text-[var(--text)]">Ingest + Ask</strong> once so vectors match the new
        embedding model.
      </p>
      <div className="flex flex-wrap gap-2">
        <Btn disabled={busy} onClick={() => run('pytest')}>
          Run pytest
        </Btn>
        <Btn disabled={busy} onClick={() => run('graph')}>
          Print Mermaid
        </Btn>
      </div>
      <Field label="Mode">
        <select
          className={inputClass()}
          value={mode}
          onChange={(e) => setMode(e.target.value as 'graph' | 'chain')}
        >
          <option value="graph">graph</option>
          <option value="chain">chain</option>
        </select>
      </Field>
      <Field label="Question">
        <textarea
          className={inputClass() + ' min-h-20'}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Btn disabled={busy} onClick={() => run('ask', { question, mode })}>
          Ask
        </Btn>
        <Btn disabled={busy} onClick={() => run('ask', { question, mode, ingest: true })}>
          Ingest + Ask
        </Btn>
      </div>
    </div>
  )
}
