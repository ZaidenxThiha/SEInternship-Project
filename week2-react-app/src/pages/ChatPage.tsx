import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Bot, RotateCcw, SquarePen } from 'lucide-react';
import { getRunningChatModel, sendChat } from '../api/chat';
import type { ChatMessage } from '../types/chat';
import { useChatStore } from '../stores/chat-store';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ChatComposer } from '../components/chat/ChatComposer';
import { MessageBubble, TypingIndicator } from '../components/chat/MessageBubble';

const SUGGESTIONS = [
  'What is retrieval-augmented generation?',
  'Explain the Node.js event loop in one sentence.',
  'What does pgvector add to PostgreSQL?',
  'Give me a TypeScript generic example.',
];

const STICK_TO_BOTTOM_THRESHOLD_PX = 80;

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString() };
}

export function ChatPage() {
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const clear = useChatStore((state) => state.clear);

  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const lastMessage = messages.at(-1);
  const canRetry = Boolean(error && lastMessage?.role === 'user');
  const runningModel = getRunningChatModel();

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior });
  };

  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [messages, isTyping, error, isAtBottom]);

  useEffect(() => {
    scrollToBottom('auto');
    return () => abortRef.current?.abort();
  }, []);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;
    const distance = list.scrollHeight - list.scrollTop - list.clientHeight;
    setIsAtBottom(distance < STICK_TO_BOTTOM_THRESHOLD_PX);
  };

  const requestReply = async (history: ChatMessage[]) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setIsTyping(true);

    try {
      const reply = await sendChat(
        history.map(({ role, content }) => ({ role, content })),
        controller.signal,
      );
      addMessage(createMessage('assistant', reply.content));
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught instanceof Error ? caught.message : 'Could not reach the chatbot API.');
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsTyping(false);
      composerRef.current?.focus();
    }
  };

  const send = (text: string) => {
    const content = text.trim();
    if (!content || isTyping) return;

    const userMessage = createMessage('user', content);
    addMessage(userMessage);
    setDraft('');
    setIsAtBottom(true);
    void requestReply([...messages, userMessage]);
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleRetry = () => {
    if (canRetry) void requestReply(messages);
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    clear();
    setError(null);
    setDraft('');
    composerRef.current?.focus();
  };

  return (
    <Card className="flex h-[calc(100dvh-16.5rem)] min-h-[26rem] flex-col overflow-hidden lg:h-[calc(100dvh-8.5rem)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
              <Bot className="h-5 w-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-semibold leading-tight">Chatbot</h2>
            <p className="truncate text-xs text-[var(--color-muted-foreground)]">
              {isTyping ? 'Typing…' : `${runningModel} · short answers`}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewChat}
          disabled={messages.length === 0 && !isTyping}
        >
          <SquarePen className="h-4 w-4" />
          <span className="hidden sm:inline">New chat</span>
        </Button>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="h-full space-y-5 overflow-y-auto bg-[var(--color-background)] px-4 py-6 sm:px-6"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">How can I help?</h3>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                Ask anything, or start with one of these.
              </p>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-left text-sm shadow-sm transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}

          {isTyping && <TypingIndicator />}

          {error && (
            <Alert variant="destructive" className="flex items-center justify-between gap-3">
              <span className="min-w-0">{error}</span>
              {canRetry && (
                <Button variant="outline" size="sm" onClick={handleRetry} className="shrink-0 bg-white">
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </Button>
              )}
            </Alert>
          )}
        </div>

        {!isAtBottom && (
          <Button
            size="icon"
            variant="outline"
            onClick={() => scrollToBottom()}
            className="absolute bottom-3 left-1/2 h-9 w-9 -translate-x-1/2 rounded-full bg-white shadow-md"
            aria-label="Scroll to latest message"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] bg-white px-4 py-3 sm:px-6">
        <ChatComposer
          ref={composerRef}
          value={draft}
          onChange={setDraft}
          onSubmit={() => send(draft)}
          onStop={handleStop}
          isBusy={isTyping}
        />
      </div>
    </Card>
  );
}
