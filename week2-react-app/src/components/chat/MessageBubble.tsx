import { useState } from 'react';
import { Bot, Check, Copy, User } from 'lucide-react';
import type { ChatMessage } from '../../types/chat';
import { cn, formatDate, formatTime } from '../../lib/utils';
import { MessageContent } from './MessageContent';

export function Avatar({ role }: { role: ChatMessage['role'] }) {
  const isUser = role === 'user';
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        isUser
          ? 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]'
          : 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
      )}
    >
      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
    </div>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={cn('group flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar role={message.role} />

      <div className={cn('flex max-w-[85%] flex-col gap-1 sm:max-w-[75%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm shadow-sm',
            isUser
              ? 'rounded-tr-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'rounded-tl-md border border-[var(--color-border)] bg-white',
          )}
        >
          <MessageContent content={message.content} invert={isUser} />
        </div>

        <div
          className={cn(
            'flex items-center gap-2 px-1 text-xs text-[var(--color-muted-foreground)]',
            isUser && 'flex-row-reverse',
          )}
        >
          <time dateTime={message.createdAt} title={formatDate(message.createdAt)}>
            {formatTime(message.createdAt)}
          </time>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-1 opacity-100 transition-opacity hover:text-[var(--color-foreground)] focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Copy message"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3" role="status" aria-label="Assistant is typing">
      <Avatar role="assistant" />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-[var(--color-border)] bg-white px-4 py-3.5 shadow-sm">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-muted-foreground)]"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
