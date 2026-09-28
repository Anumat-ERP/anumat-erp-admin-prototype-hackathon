import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * The default illustration: an open box on a soft disc. Drawn with token CSS
 * variables, so it follows light and dark themes.
 */
export function EmptyStateIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden className={className}>
      <ellipse cx="80" cy="62" rx="62" ry="52" fill="var(--a-color-primary-subtle)" />
      <ellipse cx="80" cy="100" rx="42" ry="6" fill="var(--a-color-skeleton)" />
      {/* box body */}
      <path
        d="M46 52 80 64l34-12v38L80 102 46 90z"
        fill="var(--a-color-surface)"
        stroke="var(--a-color-border-strong)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M80 64v38" stroke="var(--a-color-border-strong)" strokeWidth="2" />
      {/* flaps */}
      <path
        d="M46 52 34 40l34-10 12 12z"
        fill="var(--a-color-surface-sunken)"
        stroke="var(--a-color-border-strong)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M114 52l12-12-34-10-12 12z"
        fill="var(--a-color-surface-sunken)"
        stroke="var(--a-color-border-strong)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* sparkles */}
      <path d="M80 14v10M75 19h10" stroke="var(--a-color-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="120" cy="24" r="3" fill="var(--a-color-primary)" />
      <circle cx="40" cy="26" r="2" fill="var(--a-color-primary)" />
    </svg>
  );
}

export interface EmptyStateProps extends ComponentPropsWithRef<'div'> {
  /**
   * What's empty and why, in the user's words: "Create your first product",
   * "No products match these filters", "All caught up".
   */
  heading: ReactNode;
  /** Heading element; keep the outline in order (`h2` on a page, `h3` in a card). */
  headingAs?: 'h1' | 'h2' | 'h3' | 'h4';
  /** One or two sentences: why it's empty and what doing the action will give them. */
  children?: ReactNode;
  /** Illustration. Defaults to a simple box; pass `null` for none (e.g. a small card). */
  image?: ReactNode;
  /** The main way out, usually a primary Button. For filtered empties: "Clear filters". */
  action?: ReactNode;
  /** A lesser alternative, usually a secondary or plain Button ("Import products", "Learn more"). */
  secondaryAction?: ReactNode;
  /** Small print under the actions: a help link, a note about permissions. */
  footer?: ReactNode;
  /** `page` fills a page's main area; `card` is compact for inside a Card or table body. */
  size?: 'page' | 'card';
}

/**
 * Explains why there's nothing here and offers the way forward.
 *
 * Match the copy to the kind of empty — they are different situations:
 * - **First run** — nothing has ever been created: explain the value and
 *   offer "Create your first …".
 * - **Filtered** — data exists but the filters or search hide it: say "No …
 *   match these filters" and offer "Clear filters". Never "create your
 *   first", which reads as data loss.
 * - **Cleared** — the user finished everything ("All caught up"): celebrate
 *   quietly; there may be no action at all.
 *
 * Don't use for loading (use Skeleton) or errors (use Banner).
 */
export function EmptyState({
  heading,
  headingAs: Heading = 'h2',
  children,
  image,
  action,
  secondaryAction,
  footer,
  size = 'page',
  className,
  ...props
}: EmptyStateProps) {
  const isPage = size === 'page';
  const illustration = image === undefined ? <EmptyStateIllustration className={isPage ? 'h-30 w-40' : 'h-20 w-28'} /> : image;

  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col items-center text-center',
        isPage ? 'max-w-md gap-4 px-4 py-12' : 'max-w-sm gap-3 px-4 py-8',
        className,
      )}
      {...props}
    >
      {illustration ? <div className="flex justify-center text-fg-subtle">{illustration}</div> : null}
      <div className="flex flex-col gap-1.5">
        <Heading className={cn('font-semibold text-fg [overflow-wrap:anywhere]', isPage ? 'text-xl' : 'text-lg')}>
          {heading}
        </Heading>
        {children ? (
          <div className={cn('text-fg-muted [overflow-wrap:anywhere]', isPage ? 'text-md' : 'text-sm')}>{children}</div>
        ) : null}
      </div>
      {action || secondaryAction ? (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {action}
          {secondaryAction}
        </div>
      ) : null}
      {footer ? <div className="text-sm text-fg-subtle">{footer}</div> : null}
    </div>
  );
}
