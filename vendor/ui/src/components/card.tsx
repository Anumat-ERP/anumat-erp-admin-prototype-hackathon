import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface CardProps extends ComponentPropsWithoutRef<'section'> {
  /** Element to render. `section` gives the card a landmark when it has a heading. */
  as?: ElementType;
  /** Remove inner padding — for cards whose content (tables, lists) runs edge to edge. */
  flush?: boolean;
  /** Background. `muted` groups secondary information. */
  tone?: 'default' | 'muted';
}

/**
 * A bordered surface grouping related content.
 *
 * Use to group content a merchant acts on together. Don't nest cards —
 * use a Divider or a sub-heading inside one card instead.
 */
export function Card({ as: Component = 'section', flush, tone = 'default', className, ...props }: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-lg border border-border shadow-xs',
        tone === 'muted' ? 'bg-surface-muted' : 'bg-surface',
        !flush && 'p-4',
        // Flush children keep the rounded corners.
        flush && 'overflow-hidden',
        className,
      )}
      {...props}
    />
  );
}

export interface CardHeaderProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** The card's heading. */
  title: ReactNode;
  /** Heading element; keep the document outline in order. */
  headingAs?: 'h2' | 'h3' | 'h4';
  /** Supporting line under the title. */
  description?: ReactNode;
  /** Actions aligned to the end, usually tertiary Buttons. */
  actions?: ReactNode;
}

export function CardHeader({ title, headingAs: Heading = 'h2', description, actions, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)} {...props}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <Heading className="text-lg font-semibold text-fg">{title}</Heading>
        {description ? <p className="text-md text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** A full-bleed band inside a padded card, separated by a border. */
export function CardSection({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('-mx-4 border-t border-border px-4 pt-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('flex items-center justify-end gap-2', className)} {...props} />;
}
