'use client';

import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';

/*
 * Height keyframes read the measured height Radix exposes. motion.css has no
 * height animation, so they live here; React 19 hoists and de-duplicates the
 * <style> into <head>. The global reduced-motion rule shortens them to ~0.
 */
const KEYFRAMES =
  '@keyframes a-collapsible-down{from{height:0}to{height:var(--radix-collapsible-content-height)}}' +
  '@keyframes a-collapsible-up{from{height:var(--radix-collapsible-content-height)}to{height:0}}';

/**
 * Shows and hides one region of content with a trigger.
 *
 * Use for optional detail that most merchants skip: advanced settings, the
 * raw payload of an event, “Show 12 more line items”. Don’t use to hide
 * content merchants need to finish the task, and don’t use for a set of
 * related sections — use Accordion. Pair the trigger with a chevron or
 * “Show/Hide” label so the state is visible.
 */
export const Collapsible = CollapsiblePrimitive.Root;

/**
 * The toggle. Use `asChild` with a Button. It carries `aria-expanded` and
 * `data-state="open|closed"` — rotate a chevron with
 * `group-data-[state=open]:rotate-180`.
 */
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

/** The region that opens and closes, animating its height. */
export function CollapsibleContent({ className, children, ...props }: ComponentPropsWithRef<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      className={cn(
        'overflow-hidden',
        'data-[state=open]:animate-[a-collapsible-down_var(--a-duration-base)_var(--a-ease-enter)]',
        'data-[state=closed]:animate-[a-collapsible-up_var(--a-duration-fast)_var(--a-ease-exit)]',
        className,
      )}
      {...props}
    >
      <style href="a-collapsible-keyframes" precedence="default">
        {KEYFRAMES}
      </style>
      {children}
    </CollapsiblePrimitive.Content>
  );
}
