import { forwardRef, useLayoutEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';
import { Button } from '../ui/button';

const MAX_HEIGHT_PX = 160;

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isBusy: boolean;
};

export const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>(
  ({ value, onChange, onSubmit, onStop, isBusy }, forwardedRef) => {
    const localRef = useRef<HTMLTextAreaElement | null>(null);

    useLayoutEffect(() => {
      const textarea = localRef.current;
      if (!textarea) return;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT_PX)}px`;
    }, [value]);

    const setRefs = (node: HTMLTextAreaElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    const handleSubmit = (event: FormEvent) => {
      event.preventDefault();
      onSubmit();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        onSubmit();
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-1.5">
        <div className="flex items-end gap-2 rounded-2xl border border-[var(--color-input)] bg-white p-2 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-[var(--color-ring)]">
          <textarea
            ref={setRefs}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask the chatbot…"
            aria-label="Message"
            autoFocus
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none placeholder:text-[var(--color-muted-foreground)]"
          />
          {isBusy ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={onStop}
              className="h-9 w-9 shrink-0 rounded-xl"
              aria-label="Stop generating"
              title="Stop generating"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl"
              disabled={!value.trim()}
              aria-label="Send message"
              title="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="hidden px-2 text-xs text-[var(--color-muted-foreground)] sm:block">
          <kbd className="font-sans font-medium">Enter</kbd> to send,{' '}
          <kbd className="font-sans font-medium">Shift + Enter</kbd> for a new line
        </p>
      </form>
    );
  },
);
ChatComposer.displayName = 'ChatComposer';
