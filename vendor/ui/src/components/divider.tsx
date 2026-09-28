'use client';

import { Separator } from 'radix-ui';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface DividerProps extends Omit<ComponentPropsWithRef<typeof Separator.Root>, 'children'> {
  /** `horizontal` (default) spans the width; `vertical` spans the height of a row — give the row a height. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Short text in the middle of a horizontal divider — “or”, “Earlier”.
   * It’s read as ordinary text; the lines are decorative.
   */
  label?: ReactNode;
  /** `default` for most separations; `strong` where the surface behind is busy. */
  tone?: 'default' | 'strong';
  /**
   * Purely visual (the default): hidden from assistive technology. Set
   * `false` when the divider marks a real boundary in content — it is then
   * announced as a separator.
   */
  decorative?: boolean;
}

const LINE_TONES = { default: 'bg-border', strong: 'bg-border-strong' } as const;

/**
 * A thin line separating groups of content.
 *
 * Use between groups inside one card or menu, or between inline items in a
 * toolbar (`vertical`). Don’t use it to separate cards (the card border does
 * that) or as a substitute for headings and spacing — most groups need only
 * a gap.
 */
export function Divider({
  orientation = 'horizontal',
  label,
  tone = 'default',
  decorative = true,
  className,
  ...props
}: DividerProps) {
  if (label && orientation === 'horizontal') {
    return (
      <div className={cn('flex w-full items-center gap-3', className)}>
        <Separator.Root decorative className={cn('h-px min-w-4 flex-1', LINE_TONES[tone])} />
        <span className="shrink break-words text-center text-sm text-fg-muted">{label}</span>
        <Separator.Root decorative className={cn('h-px min-w-4 flex-1', LINE_TONES[tone])} />
      </div>
    );
  }

  return (
    <Separator.Root
      orientation={orientation}
      decorative={decorative}
      className={cn(
        'shrink-0',
        LINE_TONES[tone],
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        className,
      )}
      {...props}
    />
  );
}
