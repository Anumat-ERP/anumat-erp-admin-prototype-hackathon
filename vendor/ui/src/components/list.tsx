import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';

export interface ListProps extends Omit<ComponentPropsWithRef<'ul'>, 'type'> {
  /**
   * `bullet` renders a `<ul>`; `number` renders an `<ol>`. Pick by meaning:
   * steps in order are numbered. A `<ul>` styled with counters looks the same
   * but is announced as unordered, so we never do that.
   */
  type?: 'bullet' | 'number';
  /** `loose` for scannable points, `tight` for short dense lists. */
  spacing?: 'loose' | 'tight';
  /** For numbered lists: the number to start from. */
  start?: number;
}

function ListRoot({ type = 'bullet', spacing = 'loose', start, className, ...props }: ListProps) {
  const classes = cn(
    'pl-5 text-md text-fg marker:text-fg-muted',
    type === 'number' ? 'list-decimal' : 'list-disc',
    spacing === 'loose' ? 'space-y-2' : 'space-y-0.5',
    className,
  );
  if (type === 'number') {
    const { ref, ...rest } = props;
    return <ol ref={ref as ComponentPropsWithRef<'ol'>['ref']} start={start} className={classes} {...rest} />;
  }
  return <ul className={classes} {...props} />;
}

export type ListItemProps = ComponentPropsWithRef<'li'>;

/** One point in a List. Can hold a nested List. */
function ListItem({ className, ...props }: ListItemProps) {
  return <li className={cn('pl-1 [overflow-wrap:anywhere] [&>ol]:mt-1 [&>ul]:mt-1', className)} {...props} />;
}

/**
 * A plain text list of points or steps.
 *
 * Use for short, parallel pieces of text in body copy: requirements, steps,
 * what's included. Don't use for rows of data with actions (use a resource
 * list or table), for navigation (use a nav component), or for label/value
 * pairs (use DescriptionList).
 *
 * `<List type="number"><List.Item>…</List.Item></List>`
 */
export const List = Object.assign(ListRoot, { Item: ListItem });
export { ListItem };
