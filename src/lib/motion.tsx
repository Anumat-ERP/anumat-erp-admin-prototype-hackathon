import { cn } from '@repo/ui';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { flushSync } from 'react-dom';

/** True when the person asked the system for less motion. */
export function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Items that appeared after the list first rendered (a note you just added, a
 * new comment). Returns the class to put on each item: `an-enter` for new
 * ones, nothing for the ones that were already there, so opening a page never
 * animates its whole history. Pass `scope` (e.g. the task id) when the same
 * component shows different lists over time, like a drawer.
 */
export function useFresh(ids: readonly string[], scope?: unknown) {
  const seen = useRef<{ scope: unknown; ids: Set<string> } | null>(null);
  if (seen.current === null || !Object.is(seen.current.scope, scope)) seen.current = { scope, ids: new Set(ids) };
  const initial = seen.current.ids;
  return (id: string) => (initial.has(id) ? undefined : 'an-enter');
}

/**
 * Wraps a value that can change while you look at it (a status, a stage, a
 * count). When it changes, it gets a soft highlight that fades out, so the
 * result of what you just did is easy to find. Nothing happens on first render.
 */
export function Changed({ value, children, className }: { value: unknown; children: ReactNode; className?: string }) {
  const prev = useRef(value);
  const [times, setTimes] = useState(0);
  useEffect(() => {
    if (Object.is(prev.current, value)) return;
    prev.current = value;
    setTimes((n) => n + 1);
  }, [value]);
  return (
    <span key={times} className={cn('inline-flex', times > 0 && 'an-changed', className)}>
      {children}
    </span>
  );
}

/**
 * Runs a DOM-changing update as a cross-fade where the browser supports View
 * Transitions (used for switching light and dark), and instantly otherwise.
 */
export function withViewTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || prefersReducedMotion()) return update();
  doc.startViewTransition(() => flushSync(update));
}

/**
 * Reveals `[data-reveal]` sections inside `root` as they scroll into view.
 * Only sections below the fold start hidden, so nothing visible on load ever
 * blinks. Anything that has reached the viewport, or was scrolled past (a fast
 * fling, an anchor link), is shown. Without JavaScript or with reduced motion
 * nothing is hidden.
 */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let hidden = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]')).filter((item) => {
      const below = item.getBoundingClientRect().top >= window.innerHeight;
      item.dataset.reveal = below ? 'hidden' : 'shown';
      return below;
    });
    let frame = 0;
    const check = () => {
      frame = 0;
      const line = window.innerHeight * 0.9;
      hidden = hidden.filter((item) => {
        if (item.getBoundingClientRect().top > line) return true;
        item.dataset.reveal = 'shown';
        return false;
      });
      if (!hidden.length) stop();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    const stop = () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      stop();
      cancelAnimationFrame(frame);
      for (const item of hidden) item.dataset.reveal = 'shown';
    };
  }, [root]);
}
