import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, Send, User } from 'lucide-react';
import type { ChatMessage } from '../types/chat';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { cn, formatDate } from '../lib/utils';

const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Welcome to the Week 2 chat UI. This is a static demo — no AI connected yet.',
    createdAt: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    id: '2',
    role: 'user',
    content: 'Can you show me how messages look in the UI?',
    createdAt: new Date(Date.now() - 45_000).toISOString(),
  },
  {
    id: '3',
    role: 'assistant',
    content: 'Sure! Send a message below and you will see it appear instantly in the list.',
    createdAt: new Date(Date.now() - 30_000).toISOString(),
  },
];

const SAMPLE_REPLIES = [
  'Got it — this reply is simulated locally until Week 3 connects an LLM.',
  'Message received. The chat state is managed with React useState.',
  'Nice! In a future week this panel will call a RAG pipeline.',
  'This UI is mobile-friendly and ready for AI integration.',
];

function createId() {
  return crypto.randomUUID();
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_MESSAGES);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setIsTyping(true);

    window.setTimeout(() => {
      const reply =
        SAMPLE_REPLIES[Math.floor(Math.random() * SAMPLE_REPLIES.length)] ??
        'Sample assistant reply.';
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <Card className="flex h-[calc(100vh-10rem)] flex-col">
      <CardHeader className="border-b border-[var(--color-border)]">
        <CardTitle className="text-xl">Mini Chat UI</CardTitle>
        <CardDescription>
          Static message list with local sample replies. AI integration comes in Week 3.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 pt-6">
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
              >
                {!isUser && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[70%]',
                    isUser
                      ? 'rounded-br-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : 'rounded-bl-md border border-[var(--color-border)] bg-white',
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={cn(
                      'mt-2 text-xs',
                      isUser ? 'text-white/80' : 'text-[var(--color-muted-foreground)]',
                    )}
                  >
                    {formatDate(message.createdAt)}
                  </p>
                </div>

                {isUser && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-bl-md border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                Assistant is typing…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row"
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a sample message…"
            aria-label="Message"
          />
          <Button type="submit" className="sm:w-auto">
            <Send className="h-4 w-4" />
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
