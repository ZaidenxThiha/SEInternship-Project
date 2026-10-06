import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';

function bearerProxy(target: string, apiKey: string | undefined, rewrite?: (path: string) => string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    secure: true,
    rewrite,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        if (apiKey) {
          proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Origin only — never include /v1 here (client already requests /qwen/v1/...)
  const qwenOrigin = (env.QWEN_BASE_URL || 'https://203.55.176.215.sslip.io')
    .replace(/\/v1\/?$/, '')
    .replace(/\/$/, '');

  const openaiOrigin = (env.OPENAI_BASE_URL || 'https://api.openai.com')
    .replace(/\/v1\/?$/, '')
    .replace(/\/$/, '');

  // Gemini OpenAI-compat lives at .../v1beta/openai — proxy /gemini/* → that prefix.
  const geminiBase = (env.GEMINI_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta/openai'
  ).replace(/\/$/, '');
  const geminiOrigin = geminiBase.includes('/v1beta/openai')
    ? geminiBase.replace(/\/v1beta\/openai\/?$/, '')
    : 'https://generativelanguage.googleapis.com';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/health': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/qwen': bearerProxy(qwenOrigin, env.QWEN_API_KEY, (path) =>
          path.replace(/^\/qwen/, ''),
        ),
        '/openai': bearerProxy(openaiOrigin, env.OPENAI_API_KEY, (path) =>
          path.replace(/^\/openai/, ''),
        ),
        '/gemini': bearerProxy(geminiOrigin, env.GEMINI_API_KEY, (path) =>
          path.replace(/^\/gemini/, '/v1beta/openai'),
        ),
      },
    },
  };
});
