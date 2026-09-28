'use client';

import { ChevronDown } from 'lucide-react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

const KEYFRAMES =
  '@keyframes a-accordion-down{from{height:0}to{height:var(--radix-accordion-content-height)}}' +
  '@keyframes a-accordion-up{from{height:var(--radix-accordion-content-height)}to{height:0}}';

export type AccordionProps = ComponentPropsWithRef<typeof AccordionPrimitive.Root> & {
  /** `card` draws a bordered, rounded surface; `flush` only divides items, for use inside a Card. */
  variant?: 'card' | 'flush';
};

/**
 * A stack of headed sections that expand and collapse.
 *
 * Use for FAQs, grouped settings or long detail pages where merchants scan
 * headings and open one or two sections. `type="single"` keeps one open at a
 * time (add `collapsible` to allow closing it); `type="multiple"` lets any
 * number open. Don’t use to hide content every merchant needs, for a single
 * region (use Collapsible) or for switching views (use Tabs).
 */
export function Accordion({ variant = 'card', className, ...props }: AccordionProps) {
  return (
    <AccordionPrimitive.Root
      className={cn(
        'flex flex-col divide-y divide-border',
        variant === 'card' && 'overflow-hidden rounded-lg border border-border bg-surface',
        className,
      )}
      {...(props as ComponentPropsWithRef<typeof AccordionPrimitive.Root>)}
    />
  );
}

/** One section. `value` identifies it for `value`/`defaultValue` on the Accordion. */
export function AccordionItem({ className, ...props }: ComponentPropsWithRef<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn('group/item', className)} {...props} />;
}

export interface AccordionTriggerProps extends ComponentPropsWithRef<typeof AccordionPrimitive.Trigger> {
  /** Heading element wrapping the button. Pick the level that fits the page outline. */
  headingAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Trailing content before the chevron, e.g. a count or a status badge. */
  suffix?: ReactNode;
}

/** The heading button of a section. */
export function AccordionTrigger({ headingAs: Heading = 'h3', suffix, className, children, ...props }: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header asChild>
      <Heading className="flex">
        <AccordionPrimitive.Trigger
          className={cn(
            'group/trigger flex min-h-12 flex-1 items-center gap-3 px-4 py-3 text-start text-md font-semibold text-fg',
            'transition-colors duration-(--a-duration-fast) ease-standard hover:bg-surface-hover',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent',
            className,
          )}
          {...props}
        >
          <span className="min-w-0 flex-1">{children}</span>
          {suffix ? <span className="shrink-0 text-sm font-regular text-fg-muted">{suffix}</span> : null}
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 text-fg-muted transition-transform duration-(--a-duration-base) ease-standard group-data-[state=open]/trigger:rotate-180"
          />
        </AccordionPrimitive.Trigger>
      </Heading>
    </AccordionPrimitive.Header>
  );
}

/** The body of a section; animates its height. */
export function AccordionContent({ className, children, ...props }: ComponentPropsWithRef<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        'overflow-hidden text-md text-fg',
        'data-[state=open]:animate-[a-accordion-down_var(--a-duration-base)_var(--a-ease-enter)]',
        'data-[state=closed]:animate-[a-accordion-up_var(--a-duration-fast)_var(--a-ease-exit)]',
      )}
      {...props}
    >
      <style href="a-accordion-keyframes" precedence="default">
        {KEYFRAMES}
      </style>
      <div className={cn('px-4 pb-4 pt-1', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
