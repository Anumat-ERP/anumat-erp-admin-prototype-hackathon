'use client';

import { ExternalLink } from 'lucide-react';
import { useId, type ComponentPropsWithRef, type MouseEventHandler, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Props handed to `renderLink`. Spread them onto your router’s link. */
export interface NavigationLinkProps {
  href: string;
  className: string;
  children: ReactNode;
  'aria-current'?: 'page';
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** A nested destination under a top-level item. */
export interface NavigationSubItem {
  /** Visible label. */
  label: string;
  /** Destination. */
  href: string;
  /** This is the current page: highlighted and `aria-current="page"`. */
  selected?: boolean;
  /** A count or short status after the label. */
  badge?: ReactNode;
  /** Called on click, e.g. to close a mobile drawer. */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** A top-level destination. */
export interface NavigationItem {
  /** Visible label. */
  label: string;
  /** Destination. */
  href: string;
  /** Leading icon (lucide). */
  icon?: ReactNode;
  /** A count or short status after the label (e.g. unfulfilled orders). */
  badge?: ReactNode;
  /** What the badge means, for assistive technology: “12 unfulfilled”. */
  badgeLabel?: string;
  /** This is the current page. Also reveals `subItems`. */
  selected?: boolean;
  /** Shown but not navigable — e.g. a module the plan doesn’t include. Explain why elsewhere. */
  disabled?: boolean;
  /** Opens in a new tab with an external-link icon, e.g. the online store. */
  external?: boolean;
  /** Children, shown when this item or one of them is selected. */
  subItems?: NavigationSubItem[];
  /** Called on click. */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** A group of items with an optional heading. */
export interface NavigationSection {
  /** Section heading, e.g. “Sales channels”. */
  title?: string;
  /** The items. */
  items: NavigationItem[];
  /** Trailing element in the heading row, e.g. an IconButton to add a channel. */
  action?: ReactNode;
}

export interface NavigationProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  /** Grouped destinations, top to bottom. */
  sections: NavigationSection[];
  /** Render links with your router. Defaults to a plain `<a>`. */
  renderLink?: (props: NavigationLinkProps) => ReactNode;
  /** Accessible name of the landmark. */
  'aria-label'?: string;
}

const defaultLink = (props: NavigationLinkProps) => <a {...props} />;

const itemBase = [
  'flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1 text-md font-medium',
  'transition-colors duration-(--a-duration-fast) ease-standard',
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
  '[&_svg]:size-4 [&_svg]:shrink-0',
];

function Badge({ children, label, selected }: { children: ReactNode; label?: string; selected?: boolean }) {
  return (
    <>
      <span
        aria-hidden={label ? true : undefined}
        className={cn(
          'ms-auto inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums',
          selected ? 'bg-primary-subtle text-primary-subtle-fg' : 'bg-surface-sunken text-fg-muted',
        )}
      >
        {children}
      </span>
      {label ? <span className="sr-only">({label})</span> : null}
    </>
  );
}

function Item({ item, renderLink }: { item: NavigationItem; renderLink: (props: NavigationLinkProps) => ReactNode }) {
  const childSelected = item.subItems?.some((sub) => sub.selected) ?? false;
  const expanded = Boolean(item.selected || childSelected);
  const icon = item.icon ? <span aria-hidden className="inline-flex">{item.icon}</span> : null;

  if (item.disabled) {
    return (
      <li>
        <span aria-disabled="true" className={cn(itemBase, 'cursor-not-allowed text-fg-disabled')}>
          {icon}
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge !== undefined ? <Badge label={item.badgeLabel}>{item.badge}</Badge> : null}
        </span>
      </li>
    );
  }

  return (
    <li>
      {renderLink({
        href: item.href,
        'aria-current': item.selected ? 'page' : undefined,
        target: item.external ? '_blank' : undefined,
        rel: item.external ? 'noopener noreferrer' : undefined,
        onClick: item.onClick,
        className: cn(
          itemBase,
          'text-fg-muted hover:bg-surface-hover hover:text-fg [&_svg]:text-fg-subtle',
          expanded && 'text-fg [&_svg]:text-fg',
          item.selected && 'bg-surface-selected text-fg hover:bg-surface-selected [&_svg]:text-primary',
        ),
        children: (
          <>
            {icon}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.external ? (
              <>
                <ExternalLink aria-hidden className="size-3.5! text-fg-subtle" />
                <span className="sr-only">(opens in a new tab)</span>
              </>
            ) : null}
            {item.badge !== undefined ? (
              <Badge label={item.badgeLabel} selected={item.selected}>
                {item.badge}
              </Badge>
            ) : null}
          </>
        ),
      })}
      {expanded && item.subItems?.length ? (
        <ul className={cn('mt-0.5 flex flex-col gap-0.5', item.icon ? 'ps-6' : 'ps-3')}>
          {item.subItems.map((sub) => (
            <li key={sub.href}>
              {renderLink({
                href: sub.href,
                'aria-current': sub.selected ? 'page' : undefined,
                onClick: sub.onClick,
                className: cn(
                  itemBase,
                  'min-h-7 font-regular text-fg-muted hover:bg-surface-hover hover:text-fg',
                  sub.selected && 'bg-surface-selected font-medium text-fg hover:bg-surface-selected',
                ),
                children: (
                  <>
                    <span className="min-w-0 flex-1 truncate">{sub.label}</span>
                    {sub.badge !== undefined ? <Badge selected={sub.selected}>{sub.badge}</Badge> : null}
                  </>
                ),
              })}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function Section({ section, renderLink }: { section: NavigationSection; renderLink: (props: NavigationLinkProps) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      {section.title ? (
        <div className="flex min-h-7 items-center justify-between gap-2 px-2">
          <h2 id={id} className="truncate text-xs font-semibold tracking-wide text-fg-subtle uppercase">
            {section.title}
          </h2>
          {section.action}
        </div>
      ) : null}
      <ul aria-labelledby={section.title ? id : undefined} className="flex flex-col gap-0.5">
        {section.items.map((item) => (
          <Item key={item.href} item={item} renderLink={renderLink} />
        ))}
      </ul>
    </div>
  );
}

/**
 * The app’s primary navigation: grouped destinations in the sidebar.
 *
 * Use once per app, inside AppShell’s sidebar. Mark the current page with
 * `selected`; its sub-items appear beneath it. Don’t use for in-page views
 * (use Tabs), for actions (use buttons or ActionMenu), or for more than two
 * levels — deeper structure belongs in the page itself.
 */
export function Navigation({
  sections,
  renderLink = defaultLink,
  'aria-label': ariaLabel = 'Main',
  className,
  ...props
}: NavigationProps) {
  return (
    <nav aria-label={ariaLabel} className={cn('flex flex-col gap-5 p-3', className)} {...props}>
      {sections.map((section, index) => (
        <Section key={section.title ?? index} section={section} renderLink={renderLink} />
      ))}
    </nav>
  );
}
