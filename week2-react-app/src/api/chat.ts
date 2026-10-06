export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatTurn = {
  role: ChatRole;
  content: string;
};

export type ChatReply = {
  content: string;
  reasoning: string;
};

type ChatProvider = 'qwen' | 'openai' | 'gemini';

function resolveProvider(): ChatProvider {
  const raw = (import.meta.env.VITE_LLM_PROVIDER || 'qwen').toLowerCase();
  if (raw === 'openai' || raw === 'gemini' || raw === 'qwen') return raw;
  // Ollama is not proxied from the browser chat UI.
  return 'qwen';
}

function resolveEndpoint(provider: ChatProvider): { url: string; model: string; extra?: Record<string, unknown> } {
  if (provider === 'gemini') {
    return {
      url: '/gemini/chat/completions',
      model: import.meta.env.VITE_GEMINI_CHAT_MODEL || 'gemini-3.5-flash-lite',
    };
  }
  if (provider === 'openai') {
    return {
      url: '/openai/v1/chat/completions',
      model: import.meta.env.VITE_OPENAI_CHAT_MODEL || 'gpt-4o-mini',
    };
  }
  return {
    url: '/qwen/v1/chat/completions',
    model: import.meta.env.VITE_QWEN_CHAT_MODEL || 'qwen3-chat',
    extra: { reasoning_effort: 'none' },
  };
}

/** Chat model name from Settings / env for the active provider. */
export function getRunningChatModel(): string {
  return resolveEndpoint(resolveProvider()).model;
}

export async function sendChat(messages: ChatTurn[], signal?: AbortSignal): Promise<ChatReply> {
  const provider = resolveProvider();
  const { url, model, extra } = resolveEndpoint(provider);

  const response = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Answer the question directly in one or two short sentences. Never ask for more details, never say "if you mean", and never offer follow-up help. Do not describe your thinking.',
        },
        ...messages,
      ],
      stream: false,
      temperature: 0.3,
      max_tokens: 80,
      ...extra,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string };
        choices?: Array<{ message?: { content?: string; reasoning?: string } }>;
      }
    | null;

  if (!response.ok) {
    const message = payload?.error?.message || `Chat API returned ${response.status}`;
    throw new Error(message);
  }

  const message = payload?.choices?.[0]?.message;
  const content = message?.content?.trim() ?? '';
  if (!content) {
    throw new Error('The model returned an empty reply.');
  }
  return { content, reasoning: '' };
}
