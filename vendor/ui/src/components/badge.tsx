import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';

export const badgeVariants = cva(
  'inline-flex max-w-full shrink-0 items-center gap-1 whitespace-nowrap rounded-full border font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface-sunken text-fg-muted',
        info: 'border-info-border bg-info-subtle text-info-subtle-fg',
        success: 'border-success-border bg-success-subtle text-success-subtle-fg',
        warning: 'border-warning-border bg-warning-subtle text-warning-subtle-fg',
        critical: 'border-critical-border bg-critical-subtle text-critical-subtle-fg',
        primary: 'border-primary-border bg-primary-subtle text-primary-subtle-fg',
      },
      size: {
        sm: 'h-5 px-1.5 text-xs',
        md: 'h-6 px-2 text-sm',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
);

type BadgeVariantProps = VariantProps<typeof badgeVariants>;

export type BadgeTone = NonNullable<BadgeVariantProps['tone']>;
export type BadgeProgress = 'incomplete' | 'partial' | 'complete';

const PROGRESS_LABEL: Record<BadgeProgress, string> = {
  incomplete: 'Incomplete',
  partial: 'Partially complete',
  complete: 'Complete',
};

/** A small circle: empty, half-filled or full. Drawn with currentColor so it follows the tone. */
function ProgressIcon({ progress }: { progress: BadgeProgress }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className="size-3 shrink-0" fill="none">
      <circle
        cx="6"
        cy="6"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray={progress === 'incomplete' ? '2 1.6' : undefined}
      />
      {progress === 'partial' ? <path d="M6 1.5a4.5 4.5 0 0 1 0 9z" fill="currentColor" /> : null}
      {progress === 'complete' ? <circle cx="6" cy="6" r="4.5" fill="currentColor" /> : null}
    </svg>
  );
}

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  /**
   * Meaning. `neutral` for plain labels, `info` for in-progress or informational,
   * `success` for done, `warning` for needs attention, `critical` for failed or
   * blocked, `primary` for brand emphasis (e.g. "New").
   */
  tone?: BadgeTone;
  /** `sm` for dense tables; `md` elsewhere. */
  size?: NonNullable<BadgeVariantProps['size']>;
  /** Show a small filled dot before the label, echoing the tone. Decorative. */
  dot?: boolean;
  /**
   * Show a progress glyph (empty, half, full circle). Its meaning is also given
   * as visually hidden text, so it isn't conveyed by shape alone.
   */
  progress?: BadgeProgress;
  /** Overrides the hidden text for `progress` ("Partially complete" by default). */
  progressLabel?: string;
}

/**
 * A short, non-interactive status label: "Paid", "Draft", "Partially fulfilled".
 *
 * Use to show the status of an object at a glance, usually in tables and
 * headers. Don't use for actions (use Button), for removable filters (use
 * Tag) or for counts that change live. Never rely on colour alone: the label
 * must say the status.
 */
export function Badge({
  tone,
  size,
  dot = false,
  progress,
  progressLabel,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot ? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
      {progress ? (
        <>
          <ProgressIcon progress={progress} />
          <span className="sr-only">{progressLabel ?? PROGRESS_LABEL[progress]}: </span>
        </>
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
