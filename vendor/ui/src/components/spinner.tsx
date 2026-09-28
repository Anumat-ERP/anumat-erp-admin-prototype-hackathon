import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../lib/cn';

export interface SpinnerProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Visual size. `sm` fits inside a `sm` button; `lg` is for page-level loading. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Text announced to assistive technology. Pass `null` when a surrounding
   * element already announces the busy state (e.g. a button with `aria-busy`).
   */
  label?: string | null;
}

const SIZES = { sm: 'size-4 border-2', md: 'size-5 border-2', lg: 'size-8 border-[3px]' } as const;

/**
 * Indeterminate activity indicator.
 *
 * Use when an operation has no measurable progress and will finish in a few
 * seconds. Do not use for page loads — prefer skeletons, which keep the
 * layout still. Do not use when progress is known — use ProgressBar.
 */
export function Spinner({ size = 'md', label = 'Loading', className, ...props }: SpinnerProps) {
  return (
    <span
      role={label ? 'status' : undefined}
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      {...props}
    >
      <span
        aria-hidden
        className={cn('animate-spin rounded-full border-current border-r-transparent opacity-80', SIZES[size])}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
