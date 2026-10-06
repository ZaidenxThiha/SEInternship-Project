import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Terminal,
} from 'lucide-react'
import {
  client,
  type LogEntry,
  type Probe,
  type Runtime,
  type WeekId,
  type WeekSummary,
} from './api'
import { Playground } from './Playground'
import { LlmSettingsPanel } from './LlmSettings'

const WEEK_ORDER: WeekId[] = ['week1', 'week2', 'week3', 'week4']

export default function App() {
  const [weeks, setWeeks] = useState<WeekSummary[]>([])
  const [active, setActive] = useState<WeekId>('week1')
  const [runtime, setRuntime] = useState<Runtime | null>(null)
  const [probes, setProbes] = useState<Probe[]>([])
  const [openUrls, setOpenUrls] = useState<{ label: string; url: string }[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [section, setSection] = useState<
    'status' | 'controls' | 'settings' | 'playground' | 'logs'
  >('status')
  const logEndRef = useRef<HTMLDivElement>(null)

  const activeWeek = useMemo(
    () => weeks.find((w) => w.id === active) || null,
    [weeks, active],
  )

  const refreshWeeks = useCallback(async () => {
    const data = await client.weeks()
    setWeeks(data)
  }, [])

  const refreshStatus = useCallback(async (id: WeekId) => {
    const data = await client.status(id)
    setRuntime(data.runtime)
    setProbes(data.probes)
    setOpenUrls(data.openUrls)
  }, [])

  useEffect(() => {
    refreshWeeks().catch((e) => setError(String(e.message || e)))
  }, [refreshWeeks])

  useEffect(() => {
    setLogs([])
    setError(null)
    refreshStatus(active).catch((e) => setError(String(e.message || e)))
    const timer = setInterval(() => {
      refreshStatus(active).catch(() => undefined)
      refreshWeeks().catch(() => undefined)
    }, 4000)
    return () => clearInterval(timer)
  }, [active, refreshStatus, refreshWeeks])

  useEffect(() => {
    const es = new EventSource(`/api/weeks/${active}/logs/stream`)
    es.onmessage = (ev) => {
      try {
        const entry = JSON.parse(ev.data) as LogEntry
        setLogs((prev) => {
          if (prev.some((p) => p.id === entry.id)) return prev
          const next = [...prev, entry]
          return next.slice(-800)
        })
      } catch {
        /* ignore */
      }
    }
    es.onerror = () => {
      /* browser will retry */
    }
    return () => es.close()
  }, [active])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await refreshStatus(active)
      await refreshWeeks()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">
            Internship Phase 1
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            Local Control Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Run, probe, playground-test, and stream logs for Weeks 1–4. Compose or local mode per tab.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const res = await client.startAll()
                if (!res.ok) {
                  const failed = res.results.filter((r) => !r.ok)
                  throw new Error(
                    failed.map((r) => `${r.weekId}: ${r.error || 'failed'}`).join('; '),
                  )
                }
              })
            }
            className="inline-flex items-center gap-2 rounded bg-[var(--accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            <Play size={14} /> Start all
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const res = await client.stopAll()
                if (!res.ok) {
                  const failed = res.results.filter((r) => !r.ok)
                  throw new Error(
                    failed.map((r) => `${r.weekId}: ${r.error || 'failed'}`).join('; '),
                  )
                }
              })
            }
            className="inline-flex items-center gap-2 rounded border border-[var(--bad)]/50 px-3 py-2 text-sm text-[var(--bad)] disabled:opacity-40"
          >
            <Square size={14} /> Stop all
          </button>
          <span className="ml-1 inline-flex items-center gap-2 text-xs text-[var(--muted)]">
            <Activity size={14} className="text-[var(--accent-2)]" />
            API :4040 · UI :4041
          </span>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        {WEEK_ORDER.map((id) => {
          const w = weeks.find((x) => x.id === id)
          const selected = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`rounded-md border px-3 py-2 text-left transition ${
                selected
                  ? 'border-[var(--accent)] bg-[var(--bg-panel)] text-white'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-white'
              }`}
            >
              <div className="text-sm font-medium">{w?.title || id}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    w?.runtime.running ? 'bg-[var(--ok)]' : 'bg-[var(--muted)]'
                  }`}
                />
                {w?.runtime.mode || '—'}
              </div>
            </button>
          )
        })}
      </nav>

      {activeWeek && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/80 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{activeWeek.title}</h2>
              <p className="text-sm text-[var(--muted)]">{activeWeek.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['status', 'controls', 'settings', 'playground', 'logs'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSection(s)}
                  className={`rounded border px-3 py-1.5 text-xs capitalize ${
                    section === s
                      ? 'border-[var(--accent-2)] text-[var(--accent-2)]'
                      : 'border-[var(--border)] text-[var(--muted)] hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded border border-[var(--bad)]/40 bg-[var(--bad)]/10 px-3 py-2 text-sm text-[var(--bad)]">
              {error}
            </div>
          )}

          {section === 'status' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>Runtime</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-white"
                    onClick={() => refreshStatus(active)}
                  >
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-[var(--muted)]">Mode</dt>
                  <dd>{runtime?.mode}</dd>
                  <dt className="text-[var(--muted)]">Running</dt>
                  <dd className={runtime?.running ? 'text-[var(--ok)]' : 'text-[var(--muted)]'}>
                    {runtime?.running ? 'yes' : 'no'}
                  </dd>
                  <dt className="text-[var(--muted)]">Processes</dt>
                  <dd>
                    {runtime?.procs.length
                      ? runtime.procs.map((p) => (
                          <div key={p.id} className="mono text-xs">
                            {p.label}
                            {p.pid ? ` · pid ${p.pid}` : ''}
                          </div>
                        ))
                      : '—'}
                  </dd>
                </dl>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3">
                <div className="mb-2 text-xs text-[var(--muted)]">Health probes</div>
                <ul className="space-y-2">
                  {probes.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded border border-[var(--border)] px-2 py-1.5 text-sm"
                    >
                      <span>{p.label}</span>
                      <span className={p.ok ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}>
                        {p.ok ? 'up' : 'down'} · {p.detail}
                      </span>
                    </li>
                  ))}
                </ul>
                {openUrls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {openUrls.map((u) => (
                      <a
                        key={u.url}
                        href={u.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--accent)] hover:border-[var(--accent)]"
                      >
                        <ExternalLink size={12} /> {u.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {section === 'controls' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-[var(--muted)]">
                  Mode{' '}
                  <select
                    className="ml-2 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-white"
                    value={runtime?.mode || 'local'}
                    disabled={busy || runtime?.running}
                    onChange={(e) =>
                      run(() =>
                        client.setMode(active, e.target.value as 'compose' | 'local'),
                      )
                    }
                  >
                    <option value="compose">compose</option>
                    <option value="local">local</option>
                  </select>
                </label>
                <button
                  type="button"
                  disabled={busy || runtime?.running}
                  onClick={() => run(() => client.start(active))}
                  className="inline-flex items-center gap-2 rounded bg-[var(--accent)] px-3 py-2 text-sm font-medium text-black disabled:opacity-40"
                >
                  <Play size={14} /> Start
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => client.stop(active))}
                  className="inline-flex items-center gap-2 rounded border border-[var(--bad)]/50 px-3 py-2 text-sm text-[var(--bad)] disabled:opacity-40"
                >
                  <Square size={14} /> Stop
                </button>
              </div>
              <p className="text-xs text-[var(--muted)]">
                <strong className="text-[var(--text)]">compose</strong> runs the week’s{' '}
                <code className="mono">docker compose up -d</code>.{' '}
                <strong className="text-[var(--text)]">local</strong> starts DB via compose when
                needed, then npm/python processes. Week 2 local expects Week 1 API already up.
                Weeks 3–4 use the playground for ask/ingest (no long-lived REPL process).
              </p>
            </div>
          )}

          {section === 'settings' && (
            <LlmSettingsPanel busy={busy} setBusy={setBusy} setError={setError} />
          )}

          {section === 'playground' && (
            <Playground weekId={active} busy={busy} setBusy={setBusy} setError={setError} />
          )}

          {section === 'logs' && (
            <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[#0b1016]">
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)]">
                <Terminal size={12} /> Live logs · {active}
              </div>
              <div className="mono h-80 overflow-auto p-3 text-[11px] leading-5">
                {logs.length === 0 && (
                  <div className="text-[var(--muted)]">No log lines yet. Start a week or run a playground action.</div>
                )}
                {logs.map((l) => (
                  <div key={l.id} className="whitespace-pre-wrap break-all">
                    <span className="text-[var(--muted)]">
                      {l.ts.slice(11, 19)} [{l.stream}]{' '}
                    </span>
                    <span
                      className={
                        l.stream === 'stderr' || l.stream === 'error'
                          ? 'text-[var(--bad)]'
                          : l.stream === 'system'
                            ? 'text-[var(--accent-2)]'
                            : ''
                      }
                    >
                      {l.text}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
