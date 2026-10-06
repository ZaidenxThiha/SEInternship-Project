import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { llmEnvForProcess } from './llmSettings.js';
import { appendLog } from './logs.js';
import { WEEKS, type WeekId } from './weeks.js';

async function proxyJson(
  method: string,
  url: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }
  return { status: res.status, data };
}

function pythonBin(weekDir: string): string {
  const candidates = [
    path.join(weekDir, '.venv', 'bin', 'python'),
    path.join(weekDir, '.venv', 'bin', 'python3'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'python3.12';
}

function runPython(
  weekId: WeekId,
  cwd: string,
  args: string[],
  timeoutMs = 180_000,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const bin = pythonBin(cwd);
  appendLog(weekId, 'system', `$ ${bin} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd,
      env: {
        ...process.env,
        ...llmEnvForProcess(),
        PYTHONUNBUFFERED: '1',
        PYTHONIOENCODING: 'utf-8',
      },
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout?.on('data', (buf: Buffer) => {
      const t = buf.toString();
      stdout += t;
      appendLog(weekId, 'stdout', t);
    });
    child.stderr?.on('data', (buf: Buffer) => {
      const t = buf.toString();
      stderr += t;
      appendLog(weekId, 'stderr', t);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

export async function playground(
  weekId: WeekId,
  action: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  switch (weekId) {
    case 'week1':
      return week1Playground(action, payload);
    case 'week2':
      return week2Playground(action, payload);
    case 'week3':
      return week3Playground(action, payload);
    case 'week4':
      return week4Playground(action, payload);
    default:
      throw new Error(`Unknown week ${weekId}`);
  }
}

async function week1Playground(action: string, payload: Record<string, unknown>) {
  const base = 'http://127.0.0.1:3000';
  if (action === 'login') {
    return proxyJson('POST', `${base}/api/auth/login`, {
      email: payload.email,
      password: payload.password,
    });
  }
  if (action === 'register') {
    return proxyJson('POST', `${base}/api/auth/register`, {
      email: payload.email,
      password: payload.password,
      name: payload.name,
    });
  }
  if (action === 'me') {
    return proxyJson('GET', `${base}/api/users/me`, undefined, {
      Authorization: `Bearer ${payload.token}`,
    });
  }
  if (action === 'listUsers') {
    return proxyJson('GET', `${base}/api/users`, undefined, {
      Authorization: `Bearer ${payload.token}`,
    });
  }
  if (action === 'health') {
    return proxyJson('GET', `${base}/health`);
  }
  throw new Error(`Unknown week1 action: ${action}`);
}

async function week2Playground(action: string, _payload: Record<string, unknown>) {
  if (action === 'pingUi') {
    return proxyJson('GET', 'http://127.0.0.1:5173/');
  }
  if (action === 'pingApi') {
    return proxyJson('GET', 'http://127.0.0.1:3000/health');
  }
  throw new Error(`Unknown week2 action: ${action}. Open the app URL for full UI testing.`);
}

async function week3Playground(action: string, payload: Record<string, unknown>) {
  const cwd = WEEKS.week3.dir;
  if (action === 'ingest') {
    const script = `
import sys
from pathlib import Path
sys.path.insert(0, str(Path('src').resolve()))
from config import get_settings
from rag import RagPipeline
p = RagPipeline(get_settings())
stored = p.ingest_all()
print('INGESTED=' + ','.join(f'{k}:{v}' for k,v in stored.items()))
print(f'TOTAL={sum(stored.values())}')
`;
    const result = await runPython('week3', cwd, ['-c', script]);
    return { ...result, ok: result.code === 0 };
  }
  if (action === 'ask') {
    const question = String(payload.question || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    if (!question.trim()) throw new Error('question is required');
    const script = `
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path('src').resolve()))
from config import get_settings
from rag import RagPipeline
p = RagPipeline(get_settings())
r = p.ask('''${question}''')
print(json.dumps({
  'answer': r.answer,
  'reasoning': r.reasoning,
  'sources': [
    {'chunk_index': s.chunk_index, 'source': s.source, 'distance': s.distance,
     'preview': s.content[:160]}
    for s in r.sources
  ],
}))
`;
    const result = await runPython('week3', cwd, ['-c', script]);
    let parsed: unknown = null;
    try {
      const line = result.stdout.trim().split('\n').filter(Boolean).at(-1) || '';
      parsed = JSON.parse(line);
    } catch {
      parsed = { raw: result.stdout };
    }
    return { ok: result.code === 0, result: parsed, stderr: result.stderr };
  }
  if (action === 'stats') {
    const script = `
import sys
from pathlib import Path
sys.path.insert(0, str(Path('src').resolve()))
from config import get_settings
from rag import RagPipeline
print(RagPipeline(get_settings()).store.count())
`;
    const result = await runPython('week3', cwd, ['-c', script]);
    return { ok: result.code === 0, count: Number(result.stdout.trim()) || 0 };
  }
  if (action === 'clear') {
    const source = String(payload.source || '').trim();
    const script = `
import sys
from pathlib import Path
sys.path.insert(0, str(Path('src').resolve()))
from config import get_settings
from rag import RagPipeline
p = RagPipeline(get_settings())
source = ${JSON.stringify(source)}
deleted = p.clear(source or None)
print(f'DELETED={deleted}')
print(f'SOURCE={source or "*"}')
`;
    const result = await runPython('week3', cwd, ['-c', script]);
    return { ...result, ok: result.code === 0 };
  }
  throw new Error(`Unknown week3 action: ${action}`);
}

async function week4Playground(action: string, payload: Record<string, unknown>) {
  const cwd = WEEKS.week4.dir;
  if (action === 'ask') {
    const question = String(payload.question || '').trim();
    if (!question) throw new Error('question is required');
    const mode = payload.mode === 'chain' ? 'chain' : 'graph';
    const args = ['src/main.py', '-q', question, '--mode', mode];
    if (payload.ingest) args.push('--ingest');
    const result = await runPython('week4', cwd, args);
    return {
      ok: result.code === 0,
      mode,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }
  if (action === 'pytest') {
    const bin = pythonBin(cwd);
    appendLog('week4', 'system', `$ ${bin} -m pytest -q`);
    const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>(
      (resolve, reject) => {
        const child = spawn(bin, ['-m', 'pytest', '-q'], {
          cwd,
          env: {
            ...process.env,
            ...llmEnvForProcess(),
            PYTHONUNBUFFERED: '1',
            PYTHONIOENCODING: 'utf-8',
          },
        });
        let stdout = '';
        let stderr = '';
        child.stdout?.on('data', (b: Buffer) => {
          const t = b.toString();
          stdout += t;
          appendLog('week4', 'stdout', t);
        });
        child.stderr?.on('data', (b: Buffer) => {
          const t = b.toString();
          stderr += t;
          appendLog('week4', 'stderr', t);
        });
        child.on('error', reject);
        child.on('close', (code) => resolve({ code, stdout, stderr }));
      },
    );
    return { ok: result.code === 0, ...result };
  }
  if (action === 'graph') {
    const result = await runPython('week4', cwd, ['src/main.py', '--graph']);
    return { ok: result.code === 0, mermaid: result.stdout, stderr: result.stderr };
  }
  throw new Error(`Unknown week4 action: ${action}`);
}
