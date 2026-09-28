import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '../lib/cn';

const GAP = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
} as const;

export const stackVariants = cva('flex', {
  variants: {
    direction: { column: 'flex-col', row: 'flex-row' },
    gap: GAP,
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
    wrap: { true: 'flex-wrap', false: 'flex-nowrap' },
  },
  defaultVariants: { direction: 'column', gap: 4 },
});

type Variants = VariantProps<typeof stackVariants>;

export interface StackProps extends ComponentPropsWithoutRef<'div'> {
  /** Element to render — `ul`/`ol` when the children are a list. */
  as?: ElementType;
  /** `column` stacks vertically (default); `row` lays out inline. */
  direction?: NonNullable<Variants['direction']>;
  /** Space between children, on the 4px spacing scale. */
  gap?: NonNullable<Variants['gap']>;
  align?: NonNullable<Variants['align']>;
  justify?: NonNullable<Variants['justify']>;
  /** Let a row wrap onto new lines. */
  wrap?: boolean;
}

/**
 * Lays out children in one direction with consistent spacing.
 *
 * Use for almost all layout inside a page. Don't use margins on children to
 * space them — the gap belongs to the parent.
 */
export function Stack({ as: Component = 'div', direction, gap, align, justify, wrap, className, ...props }: StackProps) {
  return <Component className={cn(stackVariants({ direction, gap, align, justify, wrap }), className)} {...props} />;
}

/** A horizontal Stack that wraps, centred on the cross axis. */
export function Inline({ gap = 2, align = 'center', wrap = true, ...props }: Omit<StackProps, 'direction'>) {
  return <Stack direction="row" gap={gap} align={align} wrap={wrap} {...props} />;
}
