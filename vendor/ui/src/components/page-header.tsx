'use client';

import { ArrowLeft } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { PageActions, type ActionMenuItem } from './action-menu';
import { Button, IconButton, buttonVariants } from './button';

/** The page’s main action. */
export interface PageHeaderPrimaryAction {
  /** Label. A verb: “Create order”. */
  content: string;
  /** Runs the action. */
  onAction?: () => void;
  /** Navigate instead: renders a link styled as a primary button. */
  href?: string;
  /** Leading icon. */
  icon?: ReactNode;
  /** Shows a spinner, keeping the button’s size. */
  loading?: boolean;
  /** Prevents interaction. Say why nearby. */
  disabled?: boolean;
  /** Critical tone, for a destructive primary action (rare). */
  destructive?: boolean;
}

/** Link back to the parent page. */
export interface PageHeaderBackAction {
  /** Name of the parent page; the button is announced as “Back to {content}”. */
  content: string;
  /** Link target. */
  href?: string;
  /** Click handler, when going back is not a link. */
  onAction?: () => void;
}

/** Props handed to `renderLink` so the back link can use your router. */
export interface PageHeaderRenderLinkProps {
  href: string;
  className: string;
  'aria-label': string;
  title: string;
  children: ReactNode;
}

export interface PageHeaderProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** The page title, rendered as the page’s `h1`. Long titles truncate to one line. */
  title: ReactNode;
  /** A line under the title: what this page is, or key facts (“Placed Mar 4 · 3 items”). */
  subtitle?: ReactNode;
  /** Beside the title: status badges, a “Draft” tag. */
  titleMetadata?: ReactNode;
  /** A back button to the parent page. Use this or `breadcrumbs`, not both. */
  backAction?: PageHeaderBackAction;
  /** Breadcrumbs above the title, for pages deeper than one level. */
  breadcrumbs?: ReactNode;
  /** The one main action, rendered as a primary Button at the end. */
  primaryAction?: PageHeaderPrimaryAction;
  /** Other actions: the first `maxVisibleSecondaryActions` as buttons, the rest in “More actions”. */
  secondaryActions?: ActionMenuItem[];
  /** How many secondary actions stay visible before overflowing into the menu. */
  maxVisibleSecondaryActions?: number;
  /** A Pagination for moving between records (previous/next order). */
  pagination?: ReactNode;
  /** Render the back link with your router. */
  renderLink?: (props: PageHeaderRenderLinkProps) => ReactNode;
}

/**
 * The top of a page: where you are, what this is, and what you can do.
 *
 * Use once per page, as its first element; it renders the page’s only `h1`.
 * Put the most common action in `primaryAction` and the rest in
 * `secondaryActions`. Don’t use inside cards or modals (use CardHeader or
 * the modal’s title), and don’t put filters or tabs in it — they go below.
 */
export function PageHeader({
  title,
  subtitle,
  titleMetadata,
  backAction,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  maxVisibleSecondaryActions = 2,
  pagination,
  renderLink,
  className,
  ...props
}: PageHeaderProps) {
  const backLabel = backAction ? `Back to ${backAction.content}` : '';
  const back = backAction ? (
    backAction.href ? (
      (renderLink ?? ((p: PageHeaderRenderLinkProps) => <a {...p} />))({
        href: backAction.href,
        className: cn(buttonVariants({ variant: 'tertiary', size: 'md' }), 'w-control-md px-0'),
        'aria-label': backLabel,
        title: backLabel,
        children: <ArrowLeft aria-hidden />,
      })
    ) : (
      <IconButton icon={<ArrowLeft />} label={backLabel} onClick={backAction.onAction} />
    )
  ) : null;

  const primary = primaryAction ? (
    primaryAction.href ? (
      <Button asChild variant={primaryAction.destructive ? 'critical' : 'primary'} disabled={primaryAction.disabled}>
        <a href={primaryAction.href}>
          {primaryAction.icon ? <span aria-hidden className="inline-flex">{primaryAction.icon}</span> : null}
          {primaryAction.content}
        </a>
      </Button>
    ) : (
      <Button
        variant={primaryAction.destructive ? 'critical' : 'primary'}
        icon={primaryAction.icon ? <span aria-hidden className="inline-flex">{primaryAction.icon}</span> : undefined}
        loading={primaryAction.loading}
        disabled={primaryAction.disabled}
        onClick={primaryAction.onAction}
      >
        {primaryAction.content}
      </Button>
    )
  ) : null;

  const hasActions = Boolean(primary || secondaryActions?.length || pagination);

  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      {breadcrumbs ? <div className="min-w-0">{breadcrumbs}</div> : null}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 grow basis-64 items-start gap-2">
          {back ? <div className="-ms-2 shrink-0">{back}</div> : null}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex min-h-control-md min-w-0 items-center gap-2">
              <h1
                className="min-w-0 truncate text-2xl font-semibold tracking-tight text-fg"
                title={typeof title === 'string' ? title : undefined}
              >
                {title}
              </h1>
              {titleMetadata ? <div className="flex shrink-0 items-center gap-1.5">{titleMetadata}</div> : null}
            </div>
            {subtitle ? <p className="text-md text-fg-muted">{subtitle}</p> : null}
          </div>
        </div>
        {hasActions ? (
          <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2">
            {secondaryActions?.length ? (
              <PageActions actions={secondaryActions} maxVisible={maxVisibleSecondaryActions} className="contents" />
            ) : null}
            {primary}
            {pagination ? <div className="flex items-center">{pagination}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
