import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import { appendLog } from './logs.js';
import { WEEK_IDS, WEEKS, type RunMode, type WeekId } from './weeks.js';

type ProcRecord = {
  id: string;
  label: string;
  pid?: number;
  child?: ChildProcess;
  startedAt: string;
  kind: 'compose' | 'process';
};

type WeekRuntime = {
  mode: RunMode;
  running: boolean;
  procs: ProcRecord[];
};

const runtime: Record<WeekId, WeekRuntime> = {
  week1: { mode: WEEKS.week1.modeDefault, running: false, procs: [] },
  week2: { mode: WEEKS.week2.modeDefault, running: false, procs: [] },
  week3: { mode: WEEKS.week3.modeDefault, running: false, procs: [] },
  week4: { mode: WEEKS.week4.modeDefault, running: false, procs: [] },
};

function attachOutput(weekId: WeekId, child: ChildProcess): void {
  child.stdout?.on('data', (buf: Buffer) => appendLog(weekId, 'stdout', buf.toString()));
  child.stderr?.on('data', (buf: Buffer) => appendLog(weekId, 'stderr', buf.toString()));
}

function runOnce(
  weekId: WeekId,
  cwd: string,
  command: string,
  args: string[],
  label: string,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    appendLog(weekId, 'system', `$ ${command} ${args.join(' ')}  (${label})`);
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (buf: Buffer) => {
      const text = buf.toString();
      stdout += text;
      appendLog(weekId, 'stdout', text);
    });
    child.stderr?.on('data', (buf: Buffer) => {
      const text = buf.toString();
      stderr += text;
      appendLog(weekId, 'stderr', text);
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function spawnDetached(
  weekId: WeekId,
  id: string,
  label: string,
  cwd: string,
  command: string,
  args: string[],
  env?: Record<string, string>,
): ProcRecord {
  appendLog(weekId, 'system', `starting ${label}: ${command} ${args.join(' ')}`);
  // detached → own process group so stop can kill npm + vite/tsx children together
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  attachOutput(weekId, child);
  const rec: ProcRecord = {
    id,
    label,
    pid: child.pid,
    child,
    startedAt: new Date().toISOString(),
    kind: 'process',
  };
  child.on('close', (code) => {
    appendLog(weekId, 'system', `${label} exited (code=${code})`);
    const rt = runtime[weekId];
    rt.procs = rt.procs.filter((p) => p.id !== id);
    if (rt.procs.length === 0) rt.running = false;
  });
  return rec;
}

async function composeUp(weekId: WeekId, services?: string[]): Promise<void> {
  const week = WEEKS[weekId];
  const args = ['compose', 'up', '-d', '--remove-orphans', ...(services ?? [])];
  const result = await runOnce(weekId, week.dir, 'docker', args, 'compose up');
  if (result.code !== 0) {
    const detail = (result.stderr || result.stdout || '').trim().split('\n').at(-1) || '';
    throw new Error(
      `docker compose up failed (code ${result.code})${detail ? `: ${detail}` : ''}`,
    );
  }
  runtime[weekId].procs.push({
    id: `compose:${(services ?? ['all']).join(',')}`,
    label: services ? `compose (${services.join(',')})` : 'compose stack',
    startedAt: new Date().toISOString(),
    kind: 'compose',
  });
}

async function composeDown(weekId: WeekId): Promise<void> {
  const week = WEEKS[weekId];
  await runOnce(weekId, week.dir, 'docker', ['compose', 'down'], 'compose down');
}

function killPid(pid: number, signal: NodeJS.Signals): void {
  try {
    // Negative PID = entire process group (npm + vite/tsx children)
    process.kill(-pid, signal);
  } catch {
    try {
      process.kill(pid, signal);
    } catch {
      /* already gone */
    }
  }
}

function killProc(rec: ProcRecord, weekId: WeekId): void {
  const pid = rec.pid || rec.child?.pid;
  if (!pid) return;
  appendLog(weekId, 'system', `stopping ${rec.label} (pid ${pid} + process group)`);
  killPid(pid, 'SIGTERM');
  setTimeout(() => killPid(pid, 'SIGKILL'), 2000);
}

function processCommand(pid: number): string {
  try {
    return execFileSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/** Kill orphaned local node/npm listeners (not Docker) on configured ports. */
function freeStopPorts(weekId: WeekId): void {
  // Only for local-mode leftovers — compose ports are owned by Docker.
  if (runtime[weekId].mode !== 'local') return;
  const ports = WEEKS[weekId].local.stopPorts || [];
  for (const port of ports) {
    try {
      const out = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
        encoding: 'utf8',
      }).trim();
      if (!out) continue;
      const pids = [...new Set(out.split(/\s+/).filter(Boolean).map(Number))].filter(
        (n) => Number.isFinite(n) && n > 0,
      );
      for (const pid of pids) {
        const cmd = processCommand(pid).toLowerCase();
        // Never touch Docker Desktop / vpnkit port forwarders
        if (!cmd || cmd.includes('docker') || cmd.includes('vpnkit') || cmd.includes('com.docker')) {
          continue;
        }
        if (!/(node|npm|vite|tsx)/.test(cmd)) continue;
        appendLog(weekId, 'system', `freeing :${port} (pid ${pid})`);
        killPid(pid, 'SIGTERM');
        setTimeout(() => killPid(pid, 'SIGKILL'), 1500);
      }
    } catch {
      /* nothing listening */
    }
  }
}

export function getRuntime(weekId: WeekId) {
  const rt = runtime[weekId];
  return {
    weekId,
    mode: rt.mode,
    running: rt.running || rt.procs.some((p) => p.kind === 'process' && p.child && !p.child.killed),
    procs: rt.procs.map(({ id, label, pid, startedAt, kind }) => ({
      id,
      label,
      pid,
      startedAt,
      kind,
    })),
  };
}

export function setMode(weekId: WeekId, mode: RunMode): void {
  if (runtime[weekId].running) {
    throw new Error('Stop the week before changing mode');
  }
  runtime[weekId].mode = mode;
  appendLog(weekId, 'system', `mode → ${mode}`);
}

export async function startWeek(weekId: WeekId): Promise<ReturnType<typeof getRuntime>> {
  const week = WEEKS[weekId];
  const rt = runtime[weekId];
  if (rt.running) return getRuntime(weekId);

  rt.running = true;
  rt.procs = [];
  appendLog(weekId, 'system', `start (${rt.mode})`);

  try {
    if (rt.mode === 'compose') {
      await composeUp(weekId);
    } else {
      for (const proc of week.local.processes) {
        if (proc.composeServices) {
          await composeUp(weekId, proc.composeServices);
          continue;
        }
        // One-shot compose-only entries already handled above via composeServices
        if (proc.command === 'docker' && proc.args[0] === 'compose') {
          await runOnce(weekId, proc.cwd, proc.command, proc.args, proc.label);
          rt.procs.push({
            id: proc.id,
            label: proc.label,
            startedAt: new Date().toISOString(),
            kind: 'compose',
          });
          continue;
        }
        const rec = spawnDetached(
          weekId,
          proc.id,
          proc.label,
          proc.cwd,
          proc.command,
          proc.args,
          proc.env,
        );
        rt.procs.push(rec);
      }
    }
  } catch (err) {
    rt.running = false;
    appendLog(weekId, 'error', err instanceof Error ? err.message : String(err));
    throw err;
  }

  return getRuntime(weekId);
}

export async function stopWeek(weekId: WeekId): Promise<ReturnType<typeof getRuntime>> {
  const rt = runtime[weekId];
  appendLog(weekId, 'system', 'stop');

  for (const proc of [...rt.procs]) {
    if (proc.kind === 'process') killProc(proc, weekId);
  }

  // Always free local ports — covers orphans after dashboard restart / npm→vite split
  freeStopPorts(weekId);

  try {
    await composeDown(weekId);
  } catch (err) {
    appendLog(weekId, 'warn', err instanceof Error ? err.message : String(err));
  }

  // Give SIGTERM a moment before probes report "up" again
  await new Promise((r) => setTimeout(r, 400));

  rt.procs = [];
  rt.running = false;
  return getRuntime(weekId);
}

export type BulkWeekResult = {
  weekId: WeekId;
  ok: boolean;
  runtime: ReturnType<typeof getRuntime>;
  error?: string;
};

/** Start Weeks 1→4 in order (Week 2 needs Week 1 API). Skips weeks already running. */
export async function startAllWeeks(): Promise<BulkWeekResult[]> {
  const results: BulkWeekResult[] = [];
  for (const weekId of WEEK_IDS) {
    try {
      const rt = await startWeek(weekId);
      results.push({ weekId, ok: true, runtime: rt });
    } catch (err) {
      results.push({
        weekId,
        ok: false,
        runtime: getRuntime(weekId),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

/** Stop Weeks 4→1 so dependents go down first. */
export async function stopAllWeeks(): Promise<BulkWeekResult[]> {
  const results: BulkWeekResult[] = [];
  for (const weekId of [...WEEK_IDS].reverse()) {
    try {
      const rt = await stopWeek(weekId);
      results.push({ weekId, ok: true, runtime: rt });
    } catch (err) {
      results.push({
        weekId,
        ok: false,
        runtime: getRuntime(weekId),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

export async function probeTcp(host: string, port: number, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeoutMs);
    socket.on('connect', () => {
      clearTimeout(timer);
      socket.end();
      resolve(true);
    });
    socket.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

export async function probeHttp(url: string, timeoutMs = 2500): Promise<{ ok: boolean; status?: number; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return { ok: res.ok || res.status < 500, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}
