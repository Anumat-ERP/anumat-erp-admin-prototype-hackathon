import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '../lib/cn';

export const textVariants = cva('', {
  variants: {
    variant: {
      display: 'text-3xl font-semibold tracking-tight',
      heading: 'text-2xl font-semibold tracking-tight',
      title: 'text-xl font-semibold',
      subtitle: 'text-lg font-semibold',
      body: 'text-md',
      bodySm: 'text-sm',
      caption: 'text-xs',
      label: 'text-md font-medium',
      mono: 'font-mono text-sm',
    },
    tone: {
      default: 'text-fg',
      muted: 'text-fg-muted',
      subtle: 'text-fg-subtle',
      disabled: 'text-fg-disabled',
      critical: 'text-critical-subtle-fg',
      success: 'text-success-subtle-fg',
      warning: 'text-warning-subtle-fg',
      info: 'text-info-subtle-fg',
      inherit: '',
    },
    weight: { regular: 'font-regular', medium: 'font-medium', semibold: 'font-semibold', bold: 'font-bold' },
    align: { start: 'text-start', center: 'text-center', end: 'text-end' },
    truncate: { true: 'truncate', false: '' },
    numeric: { true: 'tabular-nums', false: '' },
  },
  defaultVariants: { variant: 'body', tone: 'default' },
});

type Variants = VariantProps<typeof textVariants>;

const DEFAULT_ELEMENT: Record<NonNullable<Variants['variant']>, ElementType> = {
  display: 'h1',
  heading: 'h2',
  title: 'h3',
  subtitle: 'h4',
  body: 'p',
  bodySm: 'p',
  caption: 'span',
  label: 'span',
  mono: 'code',
};

export interface TextProps extends Omit<ComponentPropsWithoutRef<'p'>, 'color'> {
  /** Typographic role. Sets size and weight — not the element. */
  variant?: NonNullable<Variants['variant']>;
  /**
   * The element to render. Defaults by variant, but set it to keep the
   * document outline right: a `title` inside a card is often an `h2`.
   */
  as?: ElementType;
  tone?: NonNullable<Variants['tone']>;
  weight?: NonNullable<Variants['weight']>;
  align?: NonNullable<Variants['align']>;
  /** Single line with an ellipsis. Put the full text in a tooltip or title if it matters. */
  truncate?: boolean;
  /** Tabular figures, so columns of numbers line up. */
  numeric?: boolean;
  /** Visually hidden but still announced. */
  visuallyHidden?: boolean;
  children?: ReactNode;
}

/**
 * Typography. Separates how text looks (`variant`) from what it is (`as`).
 *
 * Use for all product copy so sizes stay on the type scale. Don't use a
 * heading variant just to make text bigger — pick the element for the
 * outline and the variant for the look.
 */
export function Text({
  variant = 'body',
  as,
  tone,
  weight,
  align,
  truncate,
  numeric,
  visuallyHidden,
  className,
  ...props
}: TextProps) {
  const Component = as ?? DEFAULT_ELEMENT[variant];
  return (
    <Component
      className={cn(
        textVariants({ variant, tone, weight, align, truncate, numeric }),
        visuallyHidden && 'sr-only',
        className,
      )}
      {...props}
    />
  );
}
