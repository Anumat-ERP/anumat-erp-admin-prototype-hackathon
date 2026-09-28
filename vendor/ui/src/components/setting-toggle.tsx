'use client';

import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { Card } from './card';

export interface SettingToggleProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
  /** The setting’s name — “Automatic tax”. */
  title: ReactNode;
  /** Heading element; keep the page outline in order. */
  headingAs?: 'h2' | 'h3' | 'h4';
  /** What the setting does and what changes when it’s on. */
  description?: ReactNode;
  /** Whether the setting is currently on (as confirmed by the server, not optimistically). */
  enabled: boolean;
  /** Called when the button is pressed. Start the request here and set `loading` until it settles. */
  onToggle?: () => void;
  /** The request is in flight: the button shows a spinner, keeps its size and ignores clicks. */
  loading?: boolean;
  /** Prevents toggling — for missing permissions or while offline. Explain why in `description` or `children`. */
  disabled?: boolean;
  /**
   * The status line. Defaults to “{title} is **on**” or “… is **off**”. Override when
   * the title doesn’t read naturally in a sentence.
   */
  status?: ReactNode;
  /** Button label. Defaults to “Turn off” / “Turn on”. Name the result, not the state. */
  actionLabel?: ReactNode;
  /** Extra content under the status line, e.g. why the button is disabled. */
  children?: ReactNode;
}

/**
 * A setting that is changed by submitting a request: title, description,
 * a status line saying whether it’s on, and a Button that turns it on or off.
 *
 * Use for account- or store-level settings whose change is saved on the
 * server and may fail or take a moment (automatic tax, two-step login).
 * It deliberately uses a **Button, not a Switch**: a switch says the change
 * has already happened, but here it happens only when the request succeeds.
 * Don’t use it for instant, local preferences (Switch) or for options saved
 * with a form (Checkbox).
 */
export function SettingToggle({
  title,
  headingAs: Heading = 'h2',
  description,
  enabled,
  onToggle,
  loading = false,
  disabled = false,
  status,
  actionLabel,
  children,
  className,
  ...props
}: SettingToggleProps) {
  const headingId = useId();
  const statusId = useId();
  const defaultAction = enabled ? 'Turn off' : 'Turn on';

  return (
    <Card aria-labelledby={headingId} className={cn('flex flex-wrap items-start justify-between gap-4', className)} {...props}>
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
        <Heading id={headingId} className="break-words text-lg font-semibold text-fg">
          {title}
        </Heading>
        {description ? <p className="break-words text-md text-fg-muted">{description}</p> : null}
        {/* Polite live region, so the confirmed new state is announced after the request settles. */}
        <p id={statusId} role="status" className="mt-1 text-md text-fg">
          {status ?? (
            <>
              {title} is <strong className="font-semibold">{enabled ? 'on' : 'off'}</strong>
            </>
          )}
        </p>
        {children}
      </div>
      <Button
        variant={enabled ? 'secondary' : 'primary'}
        loading={loading}
        disabled={disabled}
        onClick={onToggle}
        // “Turn off” alone is ambiguous in a list of settings; name the setting too (visible text first).
        aria-label={actionLabel === undefined && typeof title === 'string' ? `${defaultAction} ${title}` : undefined}
        aria-describedby={statusId}
        className="shrink-0"
      >
        {actionLabel ?? defaultAction}
      </Button>
    </Card>
  );
}
