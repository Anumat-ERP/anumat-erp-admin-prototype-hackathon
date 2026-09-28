'use client';

import { Tabs as TabsPrimitive } from 'radix-ui';
import { useCallback, useEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface TabsProps extends ComponentPropsWithRef<typeof TabsPrimitive.Root> {
  /**
   * `automatic` (default) shows a panel as soon as its tab receives focus —
   * right when panels are cheap to render. `manual` waits for Enter/Space,
   * so arrowing past a tab does not load it — use when a panel fetches data.
   */
  activationMode?: 'automatic' | 'manual';
}

/**
 * Switches between views of the same object (an order’s Details, Timeline,
 * Refunds) or filtered views of the same list (All, Open, Archived).
 *
 * Use when the views are peers and the merchant looks at one at a time.
 * Don’t use for navigating between pages (use Navigation), for steps in a
 * sequence (use a stepper), or when there are only two options that change
 * a setting (use a segmented control or radios). Keep labels short; with
 * many tabs the list scrolls sideways.
 */
export function Tabs({ className, ...props }: TabsProps) {
  return <TabsPrimitive.Root className={cn('flex flex-col', className)} {...props} />;
}

export interface TabsListProps extends ComponentPropsWithRef<typeof TabsPrimitive.List> {
  /** Stretch tabs to share the full width equally. Use for 2–4 short tabs in narrow containers. */
  fitted?: boolean;
  /** Accessible name for the tab list, e.g. “Order views”. */
  'aria-label'?: string;
}

const FADE = '2rem';

/**
 * The row of tabs. Scrolls horizontally when the tabs don’t fit, with an
 * edge fade showing there is more.
 */
export function TabsList({ fitted, className, ref, ...props }: TabsListProps) {
  const inner = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const node = inner.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    const pos = Math.abs(node.scrollLeft);
    setEdges({ start: pos > 1, end: max - pos > 1 });
  }, []);

  useEffect(() => {
    const node = inner.current;
    if (!node) return;
    measure();
    node.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(node);
    return () => {
      node.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [measure]);

  const setRef = (node: HTMLDivElement | null) => {
    inner.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const mask =
    edges.start || edges.end
      ? `linear-gradient(to right, ${edges.start ? 'transparent' : 'black'}, black ${FADE}, black calc(100% - ${FADE}), ${edges.end ? 'transparent' : 'black'})`
      : undefined;

  return (
    <TabsPrimitive.List
      ref={setRef}
      data-fitted={fitted || undefined}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      className={cn(
        'group/tablist flex shrink-0 items-stretch gap-1 overflow-x-auto overflow-y-hidden',
        'shadow-[inset_0_-1px_0_var(--a-color-border)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      {...props}
    />
  );
}

export interface TabsTriggerProps extends ComponentPropsWithRef<typeof TabsPrimitive.Trigger> {
  /** A count or short status after the label, e.g. `12`. */
  badge?: ReactNode;
  /**
   * What the badge means, for assistive technology: “12 open orders”.
   * Without it the badge is read as-is after the label.
   */
  badgeLabel?: string;
}

/** One tab. Disabled tabs are skipped by the arrow keys. */
export function TabsTrigger({ badge, badgeLabel, className, children, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'group/tab relative inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3',
        'text-md font-medium text-fg-muted transition-colors duration-(--a-duration-fast) ease-standard',
        'hover:text-fg data-[state=active]:text-fg disabled:cursor-not-allowed disabled:text-fg-disabled',
        'after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent',
        'hover:after:bg-border-strong data-[state=active]:after:bg-primary disabled:hover:after:bg-transparent',
        // The list scrolls, so an outside outline would be clipped — draw it inside.
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
        'group-data-fitted/tablist:flex-1',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    >
      {children}
      {badge !== undefined && badge !== null ? (
        <>
          <span
            aria-hidden={badgeLabel ? true : undefined}
            className={cn(
              'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums',
              'bg-surface-sunken text-fg-muted group-data-[state=active]/tab:bg-primary-subtle group-data-[state=active]/tab:text-primary-subtle-fg',
              'group-disabled/tab:text-fg-disabled',
            )}
          >
            {badge}
          </span>
          {badgeLabel ? <span className="sr-only">({badgeLabel})</span> : null}
        </>
      ) : null}
    </TabsPrimitive.Trigger>
  );
}

/** The panel for one tab. Focusable so keyboard users can reach its content. */
export function TabsContent({ className, ...props }: ComponentPropsWithRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'pt-4 text-md text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  );
}
