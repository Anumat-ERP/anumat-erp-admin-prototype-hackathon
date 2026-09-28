'use client';

import { cva } from 'class-variance-authority';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type ProgressBarTone = 'primary' | 'success' | 'critical';

const trackVariants = cva('relative w-full overflow-hidden rounded-full bg-border', {
  variants: {
    size: { sm: 'h-1', md: 'h-2', lg: 'h-3' },
  },
  defaultVariants: { size: 'md' },
});

/** The fill colour, applied to every engine's pseudo-element and to the indeterminate segment. */
const TONE: Record<ProgressBarTone, { value: string; segment: string }> = {
  primary: { value: '[&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary', segment: 'bg-primary' },
  success: { value: '[&::-webkit-progress-value]:bg-success [&::-moz-progress-bar]:bg-success', segment: 'bg-success' },
  critical: {
    value: '[&::-webkit-progress-value]:bg-critical [&::-moz-progress-bar]:bg-critical',
    segment: 'bg-critical',
  },
};

export interface ProgressBarProps
  extends Omit<ComponentPropsWithRef<'progress'>, 'value' | 'max' | 'children'> {
  /**
   * Current progress, 0 to `max`. Omit (or pass `null`) for indeterminate:
   * the element gets no `value` attribute, so assistive tech reports "busy"
   * rather than a made-up percentage.
   */
  value?: number | null;
  /** The value that means done. */
  max?: number;
  /** `primary` while working, `success` when complete, `critical` when failed or over a limit. */
  tone?: ProgressBarTone;
  /** Track thickness: sm 4px · md 8px · lg 12px. */
  size?: 'sm' | 'md' | 'lg';
  /** What is progressing: "Uploading product images". Always required, even when hidden. */
  label: ReactNode;
  /** Hide the label visually; it is still the progress element's accessible name. */
  labelHidden?: boolean;
  /** Show the percentage (or a custom string) beside the label. Visual only; AT reads the value. */
  showValue?: boolean | string;
  /** Classes for the outer wrapper. `className` goes on the `<progress>` element. */
  wrapperClassName?: string;
}

/**
 * Shows how far along a measurable task is: an upload, an import, a setup
 * checklist, usage against a plan limit.
 *
 * Uses a native `<progress>`, so the value reaches assistive technology with
 * no ARIA. Use indeterminate mode (no `value`) only when you truly can't
 * measure; for short waits prefer a Spinner, and for page loads a Skeleton.
 * Don't use it as a decorative meter for scores or ratings.
 */
export function ProgressBar({
  value,
  max = 100,
  tone = 'primary',
  size = 'md',
  label,
  labelHidden = false,
  showValue = false,
  className,
  wrapperClassName,
  id,
  ...props
}: ProgressBarProps) {
  const generatedId = useId();
  const progressId = id ?? generatedId;
  const indeterminate = value === undefined || value === null;
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? Math.round((clamped / max) * 100) : 0;
  const valueText = typeof showValue === 'string' ? showValue : `${percent}%`;

  return (
    <div className={cn('flex w-full flex-col gap-1.5', wrapperClassName)}>
      <div className={cn('flex items-baseline justify-between gap-3 text-sm', labelHidden && 'sr-only')}>
        <label htmlFor={progressId} className="min-w-0 font-medium text-fg [overflow-wrap:anywhere]">
          {label}
        </label>
        {showValue && !indeterminate ? (
          <span aria-hidden className="shrink-0 tabular-nums text-fg-muted">
            {valueText}
          </span>
        ) : null}
      </div>
      <div className={trackVariants({ size })}>
        <progress
          id={progressId}
          max={max}
          {...(indeterminate ? {} : { value: clamped })}
          data-tone={tone}
          className={cn(
            'absolute inset-0 block size-full appearance-none border-0 bg-transparent',
            '[&::-webkit-progress-bar]:bg-transparent',
            '[&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:rounded-full',
            '[&::-webkit-progress-value]:transition-[width] [&::-webkit-progress-value]:duration-(--a-duration-slow)',
            // The engines draw their own indeterminate animation; hide it and draw ours.
            indeterminate ? '[&::-moz-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-transparent' : TONE[tone].value,
            className,
          )}
          {...props}
        />
        {indeterminate ? (
          <span
            aria-hidden
            className={cn('absolute inset-y-0 left-0 w-2/5 rounded-full animate-indeterminate', TONE[tone].segment)}
          />
        ) : null}
      </div>
    </div>
  );
}
