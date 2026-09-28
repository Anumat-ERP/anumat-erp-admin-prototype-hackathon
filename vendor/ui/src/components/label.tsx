'use client';

import { Label as RadixLabel } from 'radix-ui';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Shared label typography, also used for a Field's `<legend>`. */
export const labelClasses = 'inline-block break-words text-md font-medium text-fg';

export interface LabelProps extends ComponentPropsWithRef<typeof RadixLabel.Root> {
  /**
   * Shows a visual asterisk. It is hidden from assistive technology — the
   * control itself must carry `required` (Field does this for you), so the
   * requirement is announced once, by the control.
   */
  required?: boolean;
  /**
   * Marks the field optional. `true` shows “(optional)”; pass a string to
   * localise it. Use in forms where most fields are required — mark the
   * minority, not the majority.
   */
  optional?: boolean | string;
  /** Mute the label to match a disabled control. */
  disabled?: boolean;
  /** Visually hide the label but keep it as the control’s accessible name. */
  visuallyHidden?: boolean;
  children?: ReactNode;
}

/**
 * The visible name of a form control.
 *
 * Use for every form control; pair it with the control through `htmlFor`, or
 * let Field wire it for you. Don’t use a placeholder instead of a label, and
 * don’t use Label for text that isn’t naming a control — use Text.
 */
export function Label({ required, optional, disabled, visuallyHidden, className, children, ...props }: LabelProps) {
  return (
    <RadixLabel.Root
      className={cn(labelClasses, disabled && 'text-fg-muted', visuallyHidden && 'sr-only', className)}
      {...props}
    >
      <LabelContent required={required} optional={optional}>
        {children}
      </LabelContent>
    </RadixLabel.Root>
  );
}

/** The label text plus its required/optional markers; shared with Field’s legend. */
export function LabelContent({
  required,
  optional,
  children,
}: Pick<LabelProps, 'required' | 'optional' | 'children'>) {
  return (
    <>
      {children}
      {/* No space before the asterisk, so it can’t wrap onto a line of its own. */}
      {required ? (
        <span aria-hidden className="ms-0.5 text-critical-subtle-fg">
          *
        </span>
      ) : null}
      {optional && !required ? ' ' : null}
      {optional && !required ? (
        <span className="text-sm font-regular text-fg-muted">
          {typeof optional === 'string' ? optional : '(optional)'}
        </span>
      ) : null}
    </>
  );
}
