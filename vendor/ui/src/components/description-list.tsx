import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface DescriptionListItem {
  /** The label: "Order date". */
  term: ReactNode;
  /** The value: "12 March 2026". */
  description: ReactNode;
}

export interface DescriptionListProps extends ComponentPropsWithRef<'dl'> {
  /** Term / value pairs, in reading order. */
  items: DescriptionListItem[];
  /**
   * `stacked` puts each value under its term (narrow spaces, long values).
   * `inline` is a two-column grid of term | value that collapses to stacked
   * on small screens.
   */
  layout?: 'stacked' | 'inline';
  /** `tight` for sidebars and cards, `loose` for a full page of details. */
  spacing?: 'tight' | 'loose';
  /** Rule between pairs, helpful in long inline lists. */
  dividers?: boolean;
  /** Shown instead of an empty value, so a blank isn't mistaken for a missing load. */
  emptyValue?: ReactNode;
}

/**
 * Pairs of labels and values: order details, customer info, settings
 * summaries.
 *
 * Renders a real `<dl>`, with each pair in a `<div>` wrapping its `<dt>` and
 * `<dd>`, so assistive technology reads each term with its value. Use for
 * read-only facts about one object. Don't use for tabular data about many
 * objects (use a table), for editable fields (use a form), or for
 * paragraphs.
 */
export function DescriptionList({
  items,
  layout = 'stacked',
  spacing = 'tight',
  dividers = false,
  emptyValue = '—',
  className,
  ...props
}: DescriptionListProps) {
  const inline = layout === 'inline';
  return (
    <dl
      data-layout={layout}
      className={cn(
        'flex flex-col text-md',
        dividers ? 'divide-y divide-border-subtle' : spacing === 'loose' ? 'gap-5' : 'gap-3',
        className,
      )}
      {...props}
    >
      {items.map((item, index) => {
        const empty = item.description === null || item.description === undefined || item.description === '';
        return (
          <div
            key={index}
            className={cn(
              'min-w-0',
              inline ? 'grid gap-x-4 gap-y-0.5 sm:grid-cols-[minmax(8rem,1fr)_2fr]' : 'flex flex-col gap-0.5',
              dividers && (spacing === 'loose' ? 'py-4 first:pt-0 last:pb-0' : 'py-2.5 first:pt-0 last:pb-0'),
            )}
          >
            <dt className={cn('min-w-0 [overflow-wrap:anywhere]', inline ? 'text-fg-muted' : 'text-sm font-medium text-fg-muted')}>
              {item.term}
            </dt>
            <dd className={cn('m-0 min-w-0 [overflow-wrap:anywhere]', empty ? 'text-fg-subtle' : 'text-fg')}>
              {empty ? emptyValue : item.description}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
