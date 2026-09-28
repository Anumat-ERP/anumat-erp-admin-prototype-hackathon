'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './spinner';

export const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap',
    'rounded-md border font-medium',
    'transition-[background-color,border-color,color,box-shadow] duration-(--a-duration-fast) ease-standard',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: [
          'border-primary bg-primary text-primary-fg shadow-xs',
          'hover:border-primary-hover hover:bg-primary-hover active:bg-primary-active',
          'disabled:border-border disabled:bg-surface-sunken disabled:text-fg-disabled disabled:shadow-none',
        ],
        secondary: [
          'border-border-strong bg-surface text-fg shadow-xs',
          'hover:bg-surface-hover active:bg-surface-active',
          'disabled:border-border disabled:bg-surface-sunken disabled:text-fg-disabled disabled:shadow-none',
        ],
        tertiary: [
          'border-transparent bg-transparent text-fg',
          'hover:bg-surface-hover active:bg-surface-active',
          'disabled:text-fg-disabled disabled:bg-transparent',
        ],
        critical: [
          'border-critical bg-critical text-critical-fg shadow-xs',
          'hover:border-critical-hover hover:bg-critical-hover active:bg-critical-active',
          'disabled:border-border disabled:bg-surface-sunken disabled:text-fg-disabled disabled:shadow-none',
        ],
        plain: [
          'h-auto! min-h-0! border-transparent px-0! text-fg-link underline-offset-2',
          'hover:underline disabled:text-fg-disabled disabled:no-underline',
        ],
      },
      size: {
        sm: 'h-control-sm px-2.5 text-sm [&_svg]:size-4',
        md: 'h-control-md px-3.5 text-md [&_svg]:size-4',
        lg: 'h-control-lg px-5 text-lg [&_svg]:size-5',
      },
      fullWidth: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'secondary', size: 'md', fullWidth: false },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'disabled'> {
  /** Visual weight. One `primary` per view; `critical` only for destructive actions. */
  variant?: NonNullable<ButtonVariantProps['variant']>;
  /** Control height; matches Input and Select at the same size so rows align. */
  size?: NonNullable<ButtonVariantProps['size']>;
  /** Stretch to the container's width. */
  fullWidth?: boolean;
  /** Prevents interaction. Prefer explaining *why* nearby over a silently disabled button. */
  disabled?: boolean;
  /**
   * Shows a spinner in place of the label while keeping the button's size and
   * position, so nothing around it shifts. The button stays focusable and
   * announces `aria-busy`; clicks are ignored.
   */
  loading?: boolean;
  /** Icon before the label. */
  icon?: ReactNode;
  /** Icon after the label, e.g. a disclosure chevron. */
  trailingIcon?: ReactNode;
  /**
   * Render the single child element instead of a `<button>`, merging props —
   * use for links: `<Button asChild><a href="/orders">Orders</a></Button>`.
   * Choose the element by what it does: navigation is a link, an action is a button.
   */
  asChild?: boolean;
}

/**
 * Triggers an action.
 *
 * Use for actions: submit, save, open a dialog. Use a link (`asChild` with an
 * `<a>`, or `variant="plain"`) for navigation. Don't use more than one
 * primary button in a view, and don't disable a button without saying why.
 */
export function Button({
  variant,
  size,
  fullWidth,
  disabled,
  loading = false,
  icon,
  trailingIcon,
  asChild = false,
  className,
  children,
  onClick,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, fullWidth }), className);

  if (asChild) {
    return (
      <Slot.Root className={classes} aria-disabled={disabled || undefined} {...props}>
        {children}
      </Slot.Root>
    );
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type ?? 'button'}
      className={classes}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      data-loading={loading || undefined}
      onClick={handleClick}
      {...props}
    >
      {/*
        The content keeps its box while loading. It is faded out, not
        `visibility: hidden`, so it stays in the accessibility tree and the
        button keeps its name ("Save changes", busy) instead of becoming
        an unnamed button.
      */}
      <span className={cn('inline-flex items-center gap-1.5', loading && 'opacity-0')}>
        {icon}
        {children}
        {trailingIcon}
      </span>
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" label={null} />
        </span>
      ) : null}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'trailingIcon' | 'children' | 'asChild'> {
  /** The icon. */
  icon: ReactNode;
  /** Accessible name. Required — an icon alone has none. */
  label: string;
}

const ICON_SIZES = { sm: 'w-control-sm px-0', md: 'w-control-md px-0', lg: 'w-control-lg px-0' } as const;

/** A square button showing only an icon. The `label` is its accessible name. */
export function IconButton({ icon, label, size = 'md', variant = 'tertiary', className, ...props }: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      title={label}
      size={size}
      variant={variant}
      className={cn(ICON_SIZES[size], className)}
      {...props}
    >
      <span aria-hidden className="inline-flex">
        {icon}
      </span>
    </Button>
  );
}
