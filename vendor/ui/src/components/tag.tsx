'use client';

import { X } from 'lucide-react';
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { IconButton } from './button';

export interface TagProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The tag text. Keep it short; long text truncates and the full text goes in a `title`. */
  children: ReactNode;
  /**
   * Makes the tag removable: renders a remove button named "Remove {text}".
   * Move focus somewhere sensible (the next tag, or the input) after removal.
   */
  onRemove?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Overrides the text used in the remove button's name, when `children` isn't a string. */
  accessibilityLabel?: string;
  /** Turns the tag text into a link, e.g. to a filtered list of everything with this tag. */
  href?: string;
  /** Prevents removal and following the link. */
  disabled?: boolean;
  /** Maximum width before truncation, as a Tailwind class. Defaults to `max-w-60`. */
  maxWidthClassName?: string;
}

/**
 * A compact chip representing a value the user added: a product tag, a
 * customer segment, an applied filter.
 *
 * Use for user-applied labels that can be removed or followed. Don't use for
 * system statuses (use Badge) or for choosing between options (use a
 * checkbox or segmented control).
 */
export function Tag({
  children,
  onRemove,
  accessibilityLabel,
  href,
  disabled = false,
  maxWidthClassName = 'max-w-60',
  className,
  ...props
}: TagProps) {
  const text = accessibilityLabel ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined);
  const labelClass = 'min-w-0 truncate px-2';

  return (
    <span
      data-disabled={disabled || undefined}
      className={cn(
        'inline-flex h-6 min-w-0 items-center rounded-md border border-border bg-surface-muted text-sm text-fg',
        disabled && 'border-border-subtle bg-surface-sunken text-fg-muted',
        maxWidthClassName,
        className,
      )}
      {...props}
    >
      {href && !disabled ? (
        <a
          href={href}
          title={text}
          className={cn(
            labelClass,
            'rounded-md text-fg-link underline-offset-2 hover:underline',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          )}
        >
          {children}
        </a>
      ) : (
        <span title={text} className={labelClass}>
          {children}
        </span>
      )}
      {onRemove ? (
        <IconButton
          icon={<X />}
          label={text ? `Remove ${text}` : 'Remove'}
          size="sm"
          variant="tertiary"
          onClick={onRemove}
          disabled={disabled}
          className="-ml-1 mr-0.5 size-5 h-5 w-5 rounded-sm text-fg-muted hover:bg-surface-active hover:text-fg disabled:hover:bg-transparent [&_svg]:size-3.5"
        />
      ) : null}
    </span>
  );
}
