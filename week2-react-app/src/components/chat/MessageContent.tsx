import { Fragment, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

const INLINE_PATTERN = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g;

function renderInline(text: string, invert: boolean): ReactNode[] {
  return text.split(INLINE_PATTERN).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className={cn(
            'rounded px-1 py-0.5 font-mono text-[0.85em]',
            invert ? 'bg-white/20' : 'bg-[var(--color-muted)]',
          )}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

type MessageContentProps = {
  content: string;
  invert?: boolean;
};

export function MessageContent({ content, invert = false }: MessageContentProps) {
  // Odd-indexed segments are the bodies of ``` fenced code blocks.
  const segments = content.split(/```[\w-]*\n?/);

  return (
    <div className="space-y-2 break-words">
      {segments.map((segment, index) => {
        if (index % 2 === 1) {
          return (
            <pre
              key={index}
              className={cn(
                'overflow-x-auto rounded-lg p-3 font-mono text-xs leading-relaxed',
                invert ? 'bg-black/20' : 'bg-slate-900 text-slate-100',
              )}
            >
              <code>{segment.replace(/\n$/, '')}</code>
            </pre>
          );
        }
        const text = segment.trim();
        if (!text) return null;
        return (
          <p key={index} className="whitespace-pre-wrap leading-relaxed">
            {renderInline(text, invert)}
          </p>
        );
      })}
    </div>
  );
}
