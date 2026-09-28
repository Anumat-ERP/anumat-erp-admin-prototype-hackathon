'use client';

import { cva } from 'class-variance-authority';
import { ExternalLink } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

export const linkVariants = cva(
  [
    'rounded-sm underline-offset-2 decoration-1',
    'transition-colors duration-(--a-duration-fast) ease-standard',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'aria-disabled:pointer-events-none aria-disabled:text-fg-disabled',
  ],
  {
    variants: {
      tone: {
        default: 'text-fg-link hover:text-primary-hover',
        muted: 'text-fg-muted hover:text-fg',
        critical: 'text-critical-subtle-fg hover:text-critical-hover',
      },
      underline: {
        always: 'underline hover:decoration-2',
        hover: 'no-underline hover:underline',
      },
    },
    defaultVariants: { tone: 'default', underline: 'always' },
  },
);

export interface LinkProps extends ComponentPropsWithRef<'a'> {
  /** `default` for most links; `muted` for secondary links in metadata; `critical` for links inside critical messages. */
  tone?: 'default' | 'muted' | 'critical';
  /**
   * `always` (default) — links in running text must be underlined so they
   * don’t rely on colour. `hover` — only where the context makes it obvious
   * it’s a link, such as a list of navigation links.
   */
  underline?: 'always' | 'hover';
  /**
   * Opens in a new tab: adds `target="_blank"`, `rel="noopener noreferrer"`,
   * an icon, and “(opens in a new tab)” for screen readers. Use for links
   * that leave the app, e.g. help docs, so work in progress isn’t lost.
   */
  external?: boolean;
  /** Label announced for `external` links; localise it. */
  externalLabel?: string;
  /**
   * Style the single child element instead of rendering an `<a>` — for
   * router links: `<Link asChild><RouterLink to="/orders">Orders</RouterLink></Link>`.
   */
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * Navigates somewhere — another page, a section, a file.
 *
 * Use for navigation, in running text or on its own. Don’t use it for actions
 * that change data (Button), and don’t use a Link styled as a button — use
 * `<Button asChild>` with an `<a>`. Link text says where it goes: “View
 * order #1042”, not “click here”.
 */
export function Link({
  tone,
  underline,
  external = false,
  externalLabel = '(opens in a new tab)',
  asChild = false,
  className,
  children,
  ...props
}: LinkProps) {
  const Component = asChild ? Slot.Root : 'a';
  const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Component className={cn(linkVariants({ tone, underline }), className)} {...externalProps} {...props}>
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children}
      {external ? (
        <>
          <ExternalLink aria-hidden className="ms-0.5 inline-block size-[0.875em] align-[-0.05em]" />
          <span className="sr-only"> {externalLabel}</span>
        </>
      ) : null}
    </Component>
  );
}
