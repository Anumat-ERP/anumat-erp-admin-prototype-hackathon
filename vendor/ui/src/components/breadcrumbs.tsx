'use client';

import { ChevronRight, Ellipsis } from 'lucide-react';
import { Slot } from 'radix-ui';
import { useEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/* -------------------------------------------------------------------------- */
/* Parts                                                                      */
/* -------------------------------------------------------------------------- */

/** The ordered list inside `Breadcrumbs`. Use when composing items by hand. */
export function BreadcrumbList({ className, ...props }: ComponentPropsWithRef<'ol'>) {
  return <ol className={cn('flex min-w-0 flex-wrap items-center gap-1 text-md', className)} {...props} />;
}

/** One step. Draws the separator before itself unless it is the first. */
export function BreadcrumbItem({ className, children, ...props }: ComponentPropsWithRef<'li'>) {
  return (
    <li className={cn('group/crumb inline-flex min-w-0 items-center gap-1', className)} {...props}>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-subtle group-first/crumb:hidden" />
      {children}
    </li>
  );
}

const linkClasses =
  'truncate rounded-sm text-fg-muted underline-offset-2 hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export interface BreadcrumbLinkProps extends ComponentPropsWithRef<'a'> {
  /** Render the child (e.g. a router `Link`) instead of an `<a>`, merging props and styles. */
  asChild?: boolean;
}

/** A link to an ancestor page. */
export function BreadcrumbLink({ asChild, className, ...props }: BreadcrumbLinkProps) {
  const Component = asChild ? Slot.Root : 'a';
  return <Component className={cn(linkClasses, className)} {...props} />;
}

/** The current page: plain text with `aria-current="page"`. */
export function BreadcrumbPage({ className, ...props }: ComponentPropsWithRef<'span'>) {
  return <span aria-current="page" className={cn('truncate font-medium text-fg', className)} {...props} />;
}

/* -------------------------------------------------------------------------- */
/* Breadcrumbs                                                                */
/* -------------------------------------------------------------------------- */

/** One entry in the trail. */
export interface BreadcrumbEntry {
  /** Visible label. */
  label: string;
  /** Link target. The last entry is the current page and is never a link. */
  href?: string;
}

/** Props handed to `renderLink` so a router link can render each crumb. */
export interface BreadcrumbRenderLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

export interface BreadcrumbsProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  /** The trail, root first; the last entry is the current page. */
  items?: BreadcrumbEntry[];
  /** Hand-composed `BreadcrumbItem`s, instead of `items`. Wrapped in the list for you. */
  children?: ReactNode;
  /**
   * Collapse the middle of trails longer than this into a “…” button that
   * expands it. The first entry and the last `maxItems - 2` stay visible.
   */
  maxItems?: number;
  /** Render links with your router: `(p) => <Link to={p.href} className={p.className}>{p.children}</Link>`. */
  renderLink?: (props: BreadcrumbRenderLinkProps) => ReactNode;
  /** Accessible name of the landmark. */
  'aria-label'?: string;
}

/**
 * Shows where the current page sits in the hierarchy and links to its
 * ancestors.
 *
 * Use on pages two or more levels deep (Settings › Shipping › Zone). Don’t
 * use as the primary navigation or on top-level pages, and don’t use for a
 * sequence of steps — that’s a stepper. For a single parent, a back link in
 * PageHeader is lighter.
 */
export function Breadcrumbs({
  items,
  children,
  maxItems = 4,
  renderLink,
  'aria-label': ariaLabel = 'Breadcrumb',
  className,
  ref,
  ...props
}: BreadcrumbsProps) {
  const [expanded, setExpanded] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  // The “…” button disappears on expand; move focus to the first revealed link.
  useEffect(() => {
    if (!expanded) return;
    navRef.current?.querySelector<HTMLElement>('li:nth-child(2) a')?.focus();
  }, [expanded]);

  let content: ReactNode = children;
  if (items) {
    const keep = Math.max(maxItems, 3);
    const collapse = !expanded && items.length > keep;
    const tailCount = keep - 2;
    const head = collapse ? items.slice(0, 1) : items;
    const tail = collapse ? items.slice(items.length - tailCount) : [];
    const hidden = items.length - 1 - tailCount;

    const renderEntry = (entry: BreadcrumbEntry, isLast: boolean) => (
      <BreadcrumbItem key={`${entry.label}-${entry.href ?? ''}`}>
        {isLast || !entry.href ? (
          isLast ? (
            <BreadcrumbPage title={entry.label}>{entry.label}</BreadcrumbPage>
          ) : (
            <span className="truncate text-fg-muted">{entry.label}</span>
          )
        ) : renderLink ? (
          renderLink({ href: entry.href, className: linkClasses, children: entry.label })
        ) : (
          <BreadcrumbLink href={entry.href}>{entry.label}</BreadcrumbLink>
        )}
      </BreadcrumbItem>
    );

    content = (
      <>
        {head.map((entry, i) => renderEntry(entry, !collapse && i === items.length - 1))}
        {collapse ? (
          <BreadcrumbItem>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={`Show ${hidden} more ${hidden === 1 ? 'level' : 'levels'}`}
              className="inline-flex h-6 items-center rounded-sm px-1 text-fg-muted hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-4"
            >
              <Ellipsis aria-hidden />
            </button>
          </BreadcrumbItem>
        ) : null}
        {tail.map((entry, i) => renderEntry(entry, i === tail.length - 1))}
      </>
    );
  }

  return (
    <nav
      ref={(node) => {
        navRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      aria-label={ariaLabel}
      className={cn('min-w-0', className)} {...props}>
      <BreadcrumbList>{content}</BreadcrumbList>
    </nav>
  );
}
