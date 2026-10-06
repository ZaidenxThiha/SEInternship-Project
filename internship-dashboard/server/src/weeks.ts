import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../../..');

export type RunMode = 'compose' | 'local';
export type WeekId = 'week1' | 'week2' | 'week3' | 'week4';

export type Probe = {
  id: string;
  label: string;
  kind: 'http' | 'tcp';
  target: string; // URL for http, host:port for tcp
};

export type WeekConfig = {
  id: WeekId;
  title: string;
  subtitle: string;
  dir: string;
  modeDefault: RunMode;
  probes: Probe[];
  openUrls: { label: string; url: string }[];
  compose: {
    upArgs?: string[];
    downArgs?: string[];
  };
  local: {
    /** Services started in local mode (order matters). */
    processes: Array<{
      id: string;
      label: string;
      /** Optional compose services to start first (e.g. db only). */
      composeServices?: string[];
      cwd: string;
      command: string;
      args: string[];
      env?: Record<string, string>;
    }>;
    /** Host ports to free on stop (kills orphaned npm/vite children). */
    stopPorts?: number[];
  };
};

export const WEEKS: Record<WeekId, WeekConfig> = {
  week1: {
    id: 'week1',
    title: 'Week 1',
    subtitle: 'User API — Express + Prisma + JWT',
    dir: path.join(REPO_ROOT, 'week1-user-api'),
    modeDefault: 'compose',
    probes: [
      { id: 'api', label: 'API /health', kind: 'http', target: 'http://127.0.0.1:3000/health' },
      { id: 'docs', label: 'Swagger', kind: 'http', target: 'http://127.0.0.1:3000/api/docs/' },
      { id: 'db', label: 'Postgres :5433', kind: 'tcp', target: '127.0.0.1:5433' },
    ],
    openUrls: [
      { label: 'API', url: 'http://localhost:3000/health' },
      { label: 'Swagger', url: 'http://localhost:3000/api/docs' },
    ],
    compose: {},
    local: {
      stopPorts: [3000],
      processes: [
        {
          id: 'db',
          label: 'Postgres (compose)',
          composeServices: ['db'],
          cwd: path.join(REPO_ROOT, 'week1-user-api'),
          command: 'docker',
          args: ['compose', 'up', '-d', 'db'],
        },
        {
          id: 'api',
          label: 'API (npm run dev)',
          cwd: path.join(REPO_ROOT, 'week1-user-api'),
          command: 'npm',
          args: ['run', 'dev'],
        },
      ],
    },
  },
  week2: {
    id: 'week2',
    title: 'Week 2',
    subtitle: 'React app — Tailwind + auth + live Qwen chat',
    dir: path.join(REPO_ROOT, 'week2-react-app'),
    modeDefault: 'local',
    probes: [
      { id: 'web', label: 'Vite UI', kind: 'http', target: 'http://127.0.0.1:5173/' },
      { id: 'api', label: 'Week1 API', kind: 'http', target: 'http://127.0.0.1:3000/health' },
    ],
    openUrls: [
      { label: 'App', url: 'http://localhost:5173' },
      { label: 'Login', url: 'http://localhost:5173/login' },
    ],
    compose: {},
    local: {
      stopPorts: [5173],
      processes: [
        {
          id: 'web',
          label: 'Vite (npm run dev)',
          cwd: path.join(REPO_ROOT, 'week2-react-app'),
          command: 'npm',
          args: ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'],
        },
      ],
    },
  },
  week3: {
    id: 'week3',
    title: 'Week 3',
    subtitle: 'Python RAG — pgvector + OpenAI/Ollama',
    dir: path.join(REPO_ROOT, 'week3-rag-demo'),
    modeDefault: 'local',
    probes: [
      { id: 'db', label: 'pgvector :5434', kind: 'tcp', target: '127.0.0.1:5434' },
      { id: 'ollama', label: 'Ollama', kind: 'http', target: 'http://127.0.0.1:11434/api/tags' },
    ],
    openUrls: [],
    compose: {},
    local: {
      processes: [
        {
          id: 'db',
          label: 'pgvector (compose)',
          composeServices: ['db'],
          cwd: path.join(REPO_ROOT, 'week3-rag-demo'),
          command: 'docker',
          args: ['compose', 'up', '-d'],
        },
      ],
    },
  },
  week4: {
    id: 'week4',
    title: 'Week 4',
    subtitle: 'LangGraph agentic RAG',
    dir: path.join(REPO_ROOT, 'week4-langgraph-rag'),
    modeDefault: 'local',
    probes: [
      { id: 'db', label: 'pgvector :5435', kind: 'tcp', target: '127.0.0.1:5435' },
      { id: 'ollama', label: 'Ollama', kind: 'http', target: 'http://127.0.0.1:11434/api/tags' },
    ],
    openUrls: [],
    compose: {},
    local: {
      processes: [
        {
          id: 'db',
          label: 'pgvector (compose)',
          composeServices: ['db'],
          cwd: path.join(REPO_ROOT, 'week4-langgraph-rag'),
          command: 'docker',
          args: ['compose', 'up', '-d'],
        },
      ],
    },
  },
};

export const WEEK_IDS = Object.keys(WEEKS) as WeekId[];
