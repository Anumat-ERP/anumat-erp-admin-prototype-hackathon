import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';
import { Card } from './card';

const BASE = 'block animate-pulse bg-skeleton';

export interface SkeletonBlockProps extends ComponentPropsWithRef<'div'> {
  /** Height as a Tailwind class, e.g. `h-24`. Defaults to `h-16`. */
  heightClassName?: string;
}

/**
 * A plain placeholder rectangle for anything that isn't text or an image:
 * a chart, a map, a table body. Hidden from assistive tech.
 */
export function SkeletonBlock({ heightClassName = 'h-16', className, ...props }: SkeletonBlockProps) {
  return <div aria-hidden className={cn(BASE, 'w-full rounded-md', heightClassName, className)} {...props} />;
}

export interface SkeletonTextProps extends ComponentPropsWithRef<'div'> {
  /** Number of lines. The last is shorter, like the end of a paragraph. */
  lines?: number;
  /** Line height to match: `sm` for captions, `md` for body copy. */
  size?: 'sm' | 'md';
}

/** Placeholder paragraph. Hidden from assistive tech. */
export function SkeletonText({ lines = 3, size = 'md', className, ...props }: SkeletonTextProps) {
  const count = Math.max(1, lines);
  return (
    <div aria-hidden className={cn('flex w-full flex-col', size === 'sm' ? 'gap-2' : 'gap-2.5', className)} {...props}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            BASE,
            'rounded-sm',
            size === 'sm' ? 'h-2.5' : 'h-3',
            i === count - 1 && count > 1 ? 'w-3/5' : 'w-full',
          )}
        />
      ))}
    </div>
  );
}

export interface SkeletonDisplayTextProps extends ComponentPropsWithRef<'div'> {
  /** Match the heading it stands in for. */
  size?: 'sm' | 'md' | 'lg';
}

const DISPLAY_SIZES = { sm: 'h-4 w-40', md: 'h-5 w-56', lg: 'h-7 w-72' } as const;

/** Placeholder heading: one thicker, shorter bar. Hidden from assistive tech. */
export function SkeletonDisplayText({ size = 'md', className, ...props }: SkeletonDisplayTextProps) {
  return <div aria-hidden className={cn(BASE, 'max-w-full rounded-sm', DISPLAY_SIZES[size], className)} {...props} />;
}

export interface SkeletonThumbnailProps extends ComponentPropsWithRef<'div'> {
  /** Match the Thumbnail size it stands in for: xs 24 · sm 40 · md 60 · lg 80px. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const THUMB_SIZES = { xs: 'size-6', sm: 'size-10', md: 'size-15', lg: 'size-20' } as const;

/** Placeholder square for a Thumbnail or Avatar. Hidden from assistive tech. */
export function SkeletonThumbnail({ size = 'md', className, ...props }: SkeletonThumbnailProps) {
  return <div aria-hidden className={cn(BASE, 'shrink-0 rounded-md', THUMB_SIZES[size], className)} {...props} />;
}

export interface SkeletonPageProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /**
   * The page title, if known before the data (it usually is). Rendered as a
   * real heading so the outline is right while loading; otherwise a bar.
   */
  title?: string;
  /** Show a placeholder for the page's primary action button. */
  primaryAction?: boolean;
  /** Number of placeholder cards in the main column. */
  cards?: number;
  /** Add a narrower secondary column of cards. */
  withSidebar?: boolean;
  /** The single announcement for the whole page. */
  loadingLabel?: string;
}

/**
 * A whole-page loading state: title bar, primary action, and cards, in the
 * shape of the page that is coming.
 *
 * Use for the first load of a page so the layout doesn't jump when data
 * arrives. Don't use for actions under a second (show nothing) or for
 * actions on a loaded page (use a Button's `loading`). Individual pieces are
 * `aria-hidden`; this component carries one polite "Loading…" status so a
 * screen reader hears it once, not once per bar.
 */
export function SkeletonPage({
  title,
  primaryAction = false,
  cards = 2,
  withSidebar = false,
  loadingLabel = 'Loading…',
  className,
  ...props
}: SkeletonPageProps) {
  return (
    <div className={cn('flex w-full flex-col gap-6', className)} aria-busy {...props}>
      <span role="status" className="sr-only">
        {loadingLabel}
      </span>
      <div className="flex items-center justify-between gap-4">
        {title ? (
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        ) : (
          <SkeletonDisplayText size="lg" />
        )}
        {primaryAction ? <div aria-hidden className={cn(BASE, 'h-control-md w-28 shrink-0 rounded-md')} /> : null}
      </div>
      <div className={cn('grid gap-4', withSidebar && 'md:grid-cols-[2fr_1fr]')}>
        <div className="flex min-w-0 flex-col gap-4">
          {Array.from({ length: Math.max(0, cards) }, (_, i) => (
            <Card as="div" key={i} className="flex flex-col gap-4">
              <SkeletonDisplayText size="sm" />
              <SkeletonText lines={i % 2 === 0 ? 3 : 2} />
            </Card>
          ))}
        </div>
        {withSidebar ? (
          <div className="flex min-w-0 flex-col gap-4">
            <Card as="div" className="flex flex-col gap-4">
              <SkeletonDisplayText size="sm" />
              <SkeletonText lines={2} size="sm" />
            </Card>
            <Card as="div" className="flex items-center gap-3">
              <SkeletonThumbnail size="sm" />
              <SkeletonText lines={2} size="sm" />
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
