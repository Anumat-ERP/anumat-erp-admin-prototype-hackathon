'use client';

import { cva } from 'class-variance-authority';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button, IconButton } from './button';

export type BannerTone = 'info' | 'success' | 'warning' | 'critical';

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, critical: CircleAlert } as const;

const bannerVariants = cva('flex gap-3 border text-md', {
  variants: {
    tone: {
      info: 'border-info-border bg-info-subtle',
      success: 'border-success-border bg-success-subtle',
      warning: 'border-warning-border bg-warning-subtle',
      critical: 'border-critical-border bg-critical-subtle',
    },
    inline: {
      true: 'rounded-md px-3 py-2',
      false: 'rounded-lg p-4',
    },
  },
  defaultVariants: { tone: 'info', inline: false },
});

const ICON_TONE: Record<BannerTone, string> = {
  info: 'text-info-subtle-fg',
  success: 'text-success-subtle-fg',
  warning: 'text-warning-subtle-fg',
  critical: 'text-critical-subtle-fg',
};

export interface BannerAction {
  /** Button label: a verb ("Update payment method"). */
  label: string;
  onAction?: () => void;
  /** Render as a link instead of a button. */
  href?: string;
}

export interface BannerProps extends Omit<ComponentPropsWithRef<'div'>, 'title' | 'role'> {
  /**
   * Meaning, and politeness. `critical` is announced assertively
   * (`role="alert"`); every other tone politely (`role="status"`).
   */
  tone?: BannerTone;
  /** One-line summary. Say what happened, not "Error". */
  title?: ReactNode;
  /** Detail and what to do next. */
  children?: ReactNode;
  /** The main way to resolve it. Rendered as a secondary button. */
  action?: BannerAction;
  /** A lesser alternative, rendered as a plain (link-style) button. */
  secondaryAction?: BannerAction;
  /** Show a close button. Don't make critical banners dismissible until the problem is fixed. */
  onDismiss?: () => void;
  /** Compact variant for inside a card or form section: smaller padding, no shadow. */
  inline?: boolean;
  /** Override the per-tone icon; pass `null` to hide it. */
  icon?: ReactNode;
}

function ActionButton({ action, variant }: { action: BannerAction; variant: 'secondary' | 'plain' }) {
  if (action.href) {
    return (
      <Button asChild size="sm" variant={variant}>
        <a href={action.href}>{action.label}</a>
      </Button>
    );
  }
  return (
    <Button size="sm" variant={variant} onClick={action.onAction}>
      {action.label}
    </Button>
  );
}

/**
 * A persistent message about the state of a page or section: a problem to
 * fix, a change to know about, a completed setup step.
 *
 * Use at the top of a page (or `inline` inside a card) for information that
 * stays relevant until acted on. Don't use for transient confirmations of
 * something the user just did (use a toast), for field-level validation (put
 * the message on the field), or stack several on one page.
 *
 * Politeness: `critical` uses `role="alert"` and interrupts; other tones use
 * `role="status"` and wait for a pause. Mount the banner with its content
 * (not empty-then-filled) only when it should announce.
 */
export function Banner({
  tone = 'info',
  title,
  children,
  action,
  secondaryAction,
  onDismiss,
  inline = false,
  icon,
  className,
  ...props
}: BannerProps) {
  const Icon = ICONS[tone];
  const hasActions = Boolean(action || secondaryAction);

  return (
    <div
      role={tone === 'critical' ? 'alert' : 'status'}
      data-tone={tone}
      className={cn(bannerVariants({ tone, inline }), className)}
      {...props}
    >
      {icon === null ? null : (
        <span aria-hidden className={cn('flex h-5 shrink-0 items-center [&_svg]:size-5', ICON_TONE[tone])}>
          {icon ?? <Icon />}
        </span>
      )}
      <div className={cn('flex min-w-0 flex-1 flex-col', inline ? 'gap-1' : 'gap-2')}>
        {title ? <p className="font-semibold text-fg">{title}</p> : null}
        {children ? <div className="text-fg [overflow-wrap:anywhere]">{children}</div> : null}
        {hasActions ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {action ? <ActionButton action={action} variant="secondary" /> : null}
            {secondaryAction ? <ActionButton action={secondaryAction} variant="plain" /> : null}
          </div>
        ) : null}
      </div>
      {onDismiss ? (
        <IconButton
          icon={<X />}
          label="Dismiss"
          size="sm"
          onClick={onDismiss}
          className="-my-1 -mr-1 text-fg-muted hover:bg-surface-hover hover:text-fg"
        />
      ) : null}
    </div>
  );
}
