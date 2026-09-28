import { CircleAlert, Info, TriangleAlert } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type ExceptionTone = 'default' | 'warning' | 'critical';

export interface ExceptionListItem {
  /** Stable key; falls back to the index. */
  id?: string;
  /** Icon; defaults per tone (info, triangle, alert circle). Decorative. */
  icon?: ReactNode;
  /** `default` for notes, `warning` for needs attention, `critical` for blocking problems. */
  tone?: ExceptionTone;
  /** Short statement of the exception: "Address unverified". */
  title?: ReactNode;
  /** Detail or next step. */
  description?: ReactNode;
}

export interface ExceptionListProps extends ComponentPropsWithRef<'ul'> {
  /** The exceptions. Rendered as a `<ul>`, so the count is announced first. */
  items: ExceptionListItem[];
}

const DEFAULT_ICON: Record<ExceptionTone, ReactNode> = {
  default: <Info />,
  warning: <TriangleAlert />,
  critical: <CircleAlert />,
};

const ICON_TONE: Record<ExceptionTone, string> = {
  default: 'text-fg-subtle',
  warning: 'text-warning-subtle-fg',
  critical: 'text-critical-subtle-fg',
};

const TITLE_TONE: Record<ExceptionTone, string> = {
  default: 'text-fg',
  warning: 'text-warning-subtle-fg',
  critical: 'text-critical-subtle-fg',
};

/**
 * A compact list of things that are unusual about an object: an unverified
 * address, a high-risk order, a note from the customer.
 *
 * It's a `<ul>`, so a screen reader announces "list, 3 items" before the
 * contents. Use in cards and sidebars beside the object they describe.
 * Don't use for page-level problems (use Banner), for transient feedback
 * (use a toast), or as a general bullet list (use List). Tone is echoed in
 * the text colour and the icon, but the title must still say what's wrong.
 */
export function ExceptionList({ items, className, ...props }: ExceptionListProps) {
  return (
    <ul role="list" className={cn('flex flex-col gap-2', className)} {...props}>
      {items.map((item, index) => {
        const tone = item.tone ?? 'default';
        return (
          <li key={item.id ?? index} data-tone={tone} className="flex min-w-0 items-start gap-2 text-md">
            <span aria-hidden className={cn('flex h-5 shrink-0 items-center [&_svg]:size-4', ICON_TONE[tone])}>
              {item.icon ?? DEFAULT_ICON[tone]}
            </span>
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {item.title ? <span className={cn('font-medium', TITLE_TONE[tone])}>{item.title}</span> : null}
              {item.title && item.description ? ' ' : null}
              {item.description ? <span className="text-fg-muted">{item.description}</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
