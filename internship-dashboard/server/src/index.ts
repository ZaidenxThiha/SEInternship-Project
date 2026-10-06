import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { healthForWeek } from './health.js';
import { getLlmSettings, putLlmSettings, type LlmSettingsPut } from './llmSettings.js';
import { getLogs, subscribe } from './logs.js';
import { playground } from './playground.js';
import {
  getRuntime,
  setMode,
  startAllWeeks,
  startWeek,
  stopAllWeeks,
  stopWeek,
} from './supervisor.js';
import { WEEK_IDS, WEEKS, type RunMode, type WeekId } from './weeks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.DASHBOARD_PORT || 4040);

function asWeekId(value: string): WeekId {
  if (!WEEK_IDS.includes(value as WeekId)) {
    throw Object.assign(new Error(`Unknown week: ${value}`), { status: 404 });
  }
  return value as WeekId;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'internship-dashboard', weeks: WEEK_IDS });
});

app.get('/api/llm-settings', (_req, res) => {
  try {
    res.json(getLlmSettings());
  } catch (err) {
    sendError(res, err);
  }
});

app.put('/api/llm-settings', (req, res) => {
  try {
    const body = (req.body || {}) as LlmSettingsPut;
    res.json(putLlmSettings(body));
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/weeks', (_req, res) => {
  res.json(
    WEEK_IDS.map((id) => {
      const w = WEEKS[id];
      return {
        id: w.id,
        title: w.title,
        subtitle: w.subtitle,
        modeDefault: w.modeDefault,
        openUrls: w.openUrls,
        runtime: getRuntime(id),
      };
    }),
  );
});

app.get('/api/weeks/:id', (req, res) => {
  try {
    const id = asWeekId(req.params.id);
    const w = WEEKS[id];
    res.json({
      id: w.id,
      title: w.title,
      subtitle: w.subtitle,
      modeDefault: w.modeDefault,
      openUrls: w.openUrls,
      probes: w.probes,
      runtime: getRuntime(id),
    });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/weeks/:id/status', async (req, res) => {
  try {
    const id = asWeekId(req.params.id);
    const [probes] = await Promise.all([healthForWeek(id)]);
    res.json({
      runtime: getRuntime(id),
      probes,
      openUrls: WEEKS[id].openUrls,
    });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/weeks/:id/mode', (req, res) => {
  try {
    const id = asWeekId(req.params.id);
    const mode = req.body?.mode as RunMode;
    if (mode !== 'compose' && mode !== 'local') {
      res.status(400).json({ error: 'mode must be compose|local' });
      return;
    }
    setMode(id, mode);
    res.json(getRuntime(id));
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/weeks/start-all', async (_req, res) => {
  try {
    const results = await startAllWeeks();
    res.json({ ok: results.every((r) => r.ok), results });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/weeks/stop-all', async (_req, res) => {
  try {
    const results = await stopAllWeeks();
    res.json({ ok: results.every((r) => r.ok), results });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/weeks/:id/start', async (req, res) => {
  try {
    const id = asWeekId(req.params.id);
    const runtime = await startWeek(id);
    res.json(runtime);
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/weeks/:id/stop', async (req, res) => {
  try {
    const id = asWeekId(req.params.id);
    const runtime = await stopWeek(id);
    res.json(runtime);
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/weeks/:id/playground', async (req, res) => {
  try {
    const id = asWeekId(req.params.id);
    const action = String(req.body?.action || '');
    if (!action) {
      res.status(400).json({ error: 'action is required' });
      return;
    }
    const payload = (req.body?.payload || {}) as Record<string, unknown>;
    const result = await playground(id, action, payload);
    res.json({ ok: true, result });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/weeks/:id/logs', (req, res) => {
  try {
    const id = asWeekId(req.params.id);
    const after = Number(req.query.after || 0);
    res.json({ entries: getLogs(id, after) });
  } catch (err) {
    sendError(res, err);
  }
});

app.get('/api/weeks/:id/logs/stream', (req, res) => {
  try {
    const id = asWeekId(req.params.id);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    for (const entry of getLogs(id)) {
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    }

    const unsubscribe = subscribe((entry) => {
      if (entry.weekId !== id) return;
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    });

    const heartbeat = setInterval(() => {
      res.write(`: ping\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  } catch (err) {
    sendError(res, err);
  }
});

// Production: serve built web UI
const webDist = path.resolve(__dirname, '../../web/dist');
app.use(express.static(webDist));
app.get(/^(?!\/api).*/, (req, res, next) => {
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(webDist, 'index.html'), (err) => {
    if (err) next();
  });
});

function sendError(res: express.Response, err: unknown): void {
  const status = (err as { status?: number })?.status || 500;
  const message = err instanceof Error ? err.message : String(err);
  res.status(status).json({ error: message });
}

app.listen(PORT, () => {
  console.log(`Internship dashboard API on http://127.0.0.1:${PORT}`);
});
