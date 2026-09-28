'use client';

import { Popover as PopoverPrimitive } from 'radix-ui';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';

/**
 * Non-modal floating content anchored to a trigger: filters, a colour
 * picker, a short form, extra details.
 *
 * Use for interactive content the merchant opens on demand and dismisses
 * by clicking away. Don’t use for a list of actions (use ActionMenu), for
 * hover-only hints (use a Tooltip), or for a task that must be finished or
 * cancelled (use a Modal).
 */
export const Popover = PopoverPrimitive.Root;
/** The element that toggles the popover. Use `asChild` with a Button. */
export const PopoverTrigger = PopoverPrimitive.Trigger;
/** Positions the popover against something other than the trigger. */
export const PopoverAnchor = PopoverPrimitive.Anchor;
/** Closes the popover. Use `asChild` with a Button. */
export const PopoverClose = PopoverPrimitive.Close;

export interface PopoverContentProps extends ComponentPropsWithRef<typeof PopoverPrimitive.Content> {
  /** Draw an arrow pointing at the trigger. Useful when the anchor is small or ambiguous. */
  arrow?: boolean;
  /** Remove inner padding — for lists that run edge to edge. */
  flush?: boolean;
}

/**
 * The floating surface, portalled above the page. Focus moves into it on
 * open and back to the trigger on close; Escape and an outside click close.
 */
export function PopoverContent({
  arrow = false,
  flush = false,
  sideOffset = 6,
  collisionPadding = 8,
  className,
  children,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'z-(--a-z-index-popover) w-72 max-w-[calc(100vw-1rem)] rounded-lg border border-border bg-surface text-md text-fg shadow-md outline-none',
          'origin-(--radix-popover-content-transform-origin) animate-pop-in data-[state=closed]:animate-pop-out',
          !flush && 'p-4',
          className,
        )}
        {...props}
      >
        {children}
        {arrow ? (
          <PopoverPrimitive.Arrow width={14} height={7} className="-mt-px fill-surface stroke-border [stroke-dasharray:0_30_36.1]" />
        ) : null}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
