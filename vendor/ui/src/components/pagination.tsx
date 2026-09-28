'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { IconButton } from './button';

export interface PaginationProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  /** Accessible name of the `nav` landmark. Name what is paginated when a page has more than one. */
  'aria-label'?: string;
  /** Whether a previous page exists. When false the previous button is disabled. */
  hasPrevious?: boolean;
  /** Whether a next page exists. When false the next button is disabled. */
  hasNext?: boolean;
  /** Go to the previous page. */
  onPrevious?: () => void;
  /** Go to the next page. */
  onNext?: () => void;
  /** Current page (1-based). With `pageCount` renders “Page 2 of 14”; alone (cursor mode) “Page 2”. */
  page?: number;
  /** Total pages. Leave out in cursor-based mode, where the total is unknown. */
  pageCount?: number;
  /**
   * Range form of the label: `{ from: 51, to: 100, total: 1284, resourceName: 'orders' }`
   * renders “Showing 51–100 of 1,284 orders”. Wins over `page`.
   */
  range?: { from: number; to: number; total?: number; resourceName?: string };
  /** Custom label. Wins over `range` and `page`. */
  label?: ReactNode;
  /** A page is loading: both buttons are disabled and the nav is marked busy. */
  loading?: boolean;
  /**
   * Listen for `k` (previous) and `j` (next) on the document. Ignored while
   * typing in a field or with a modifier held. Turn on for at most one
   * Pagination per page.
   */
  keyboardShortcuts?: boolean;
  /** Accessible name of the previous button. */
  previousLabel?: string;
  /** Accessible name of the next button. */
  nextLabel?: string;
  /** Button size. */
  size?: 'sm' | 'md';
}

function formatLabel({ label, range, page, pageCount }: Pick<PaginationProps, 'label' | 'range' | 'page' | 'pageCount'>) {
  if (label !== undefined) return label;
  if (range) {
    const span = `${range.from.toLocaleString()}–${range.to.toLocaleString()}`;
    const noun = range.resourceName ? ` ${range.resourceName}` : '';
    return range.total === undefined ? `Showing ${span}${noun}` : `Showing ${span} of ${range.total.toLocaleString()}${noun}`;
  }
  if (page !== undefined) {
    return pageCount === undefined ? `Page ${page.toLocaleString()}` : `Page ${page.toLocaleString()} of ${pageCount.toLocaleString()}`;
  }
  return null;
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.closest('[role="dialog"],[role="menu"],[role="listbox"]') !== null;
}

/**
 * Previous/next paging for lists and tables, with a label saying where the
 * merchant is.
 *
 * Use under a table or list that loads a page at a time; it works with both
 * offset (“Page 2 of 14”) and cursor-based APIs (no total). Don’t use for
 * fewer than one page of results — hide it — and don’t use numbered page
 * links for resource lists; merchants filter and search rather than jump to
 * page 7.
 */
export function Pagination({
  'aria-label': ariaLabel = 'Pagination',
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
  page,
  pageCount,
  range,
  label,
  loading = false,
  keyboardShortcuts = false,
  previousLabel = 'Previous page',
  nextLabel = 'Next page',
  size = 'sm',
  className,
  ...props
}: PaginationProps) {
  const text = formatLabel({ label, range, page, pageCount });
  const canPrevious = hasPrevious && !loading;
  const canNext = hasNext && !loading;

  // Keep the latest handlers without re-binding the listener every render.
  const latest = useRef({ canPrevious, canNext, onPrevious, onNext });
  useEffect(() => {
    latest.current = { canPrevious, canNext, onPrevious, onNext };
  });

  useEffect(() => {
    if (!keyboardShortcuts) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const current = latest.current;
      if (event.key === 'k' && current.canPrevious) {
        event.preventDefault();
        current.onPrevious?.();
      } else if (event.key === 'j' && current.canNext) {
        event.preventDefault();
        current.onNext?.();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [keyboardShortcuts]);

  return (
    <nav
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={cn('flex items-center gap-3', className)}
      {...props}
    >
      <div className="flex items-center">
        <IconButton
          icon={<ChevronLeft />}
          label={previousLabel}
          size={size}
          variant="secondary"
          disabled={!canPrevious}
          onClick={onPrevious}
          aria-keyshortcuts={keyboardShortcuts ? 'k' : undefined}
          className="rounded-e-none"
        />
        <IconButton
          icon={<ChevronRight />}
          label={nextLabel}
          size={size}
          variant="secondary"
          disabled={!canNext}
          onClick={onNext}
          aria-keyshortcuts={keyboardShortcuts ? 'j' : undefined}
          className="-ms-px rounded-s-none"
        />
      </div>
      {text !== null ? (
        <span aria-live="polite" className="text-sm text-fg-muted tabular-nums">
          {text}
        </span>
      ) : null}
    </nav>
  );
}
