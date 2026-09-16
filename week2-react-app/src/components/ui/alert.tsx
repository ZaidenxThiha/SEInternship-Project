import { cn } from '../../lib/utils';

export function Alert({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' }) {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg border px-4 py-3 text-sm',
        variant === 'destructive'
          ? 'border-[var(--color-destructive)]/30 bg-red-50 text-[var(--color-destructive)]'
          : 'border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-foreground)]',
        className,
      )}
      {...props}
    />
  );
}
