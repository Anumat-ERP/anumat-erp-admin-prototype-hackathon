'use client';

import { Switch as RadixSwitch } from 'radix-ui';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useFieldControl } from './field';

export interface SwitchProps extends Omit<ComponentPropsWithRef<typeof RadixSwitch.Root>, 'children'> {
  /** On when controlled. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** Called with the new state — apply the change right here; there is no save step. */
  onCheckedChange?: (checked: boolean) => void;
  /** What the switch turns on — “Show sold-out products”. Without it, pass `aria-label`. */
  label?: ReactNode;
  /** Hide the label visually while keeping it as the accessible name. */
  labelHidden?: boolean;
  /** Extra explanation under the label, linked with `aria-describedby`. */
  helpText?: ReactNode;
  /** Put the label before the switch (`start`, for settings lists) or after it (`end`, default). */
  labelPosition?: 'start' | 'end';
  /** Prevents interaction and mutes the label. Say why nearby. */
  disabled?: boolean;
  /** Classes for the outer row (or the switch when there’s no label). */
  className?: string;
}

/**
 * An on/off control that **applies instantly** — flipping it is the whole
 * action, like a light switch.
 *
 * Use for preferences that take effect immediately and can be flipped back
 * (show archived items, compact mode). Don’t use it when the change is saved
 * later with a form (Checkbox), or when it submits a request the merchant
 * should confirm, like turning on automatic tax: a switch would claim the
 * change has already happened. Use a SettingToggle (a Button) there.
 */
export function Switch({
  label,
  labelHidden,
  helpText,
  labelPosition = 'end',
  className,
  id: idProp,
  ...props
}: SwitchProps) {
  const autoId = useId();
  const helpId = `${autoId}-help`;
  const { invalid, ...control } = useFieldControl({
    id: idProp,
    required: props.required,
    disabled: props.disabled,
    'aria-describedby': [helpText ? helpId : undefined, props['aria-describedby']].filter(Boolean).join(' ') || undefined,
  });
  const id = control.id ?? autoId;

  const toggle = (
    <RadixSwitch.Root
      {...props}
      {...control}
      aria-invalid={invalid || undefined}
      id={id}
      className={cn(
        'inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent p-px',
        'bg-fg-subtle data-[state=checked]:bg-primary',
        'transition-colors duration-(--a-duration-fast) ease-standard',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-sunken disabled:data-[state=checked]:bg-surface-active',
        !label && className,
      )}
    >
      <RadixSwitch.Thumb
        className={cn(
          'block size-4 rounded-full bg-surface shadow-sm',
          'transition-transform duration-(--a-duration-base) ease-standard',
          'translate-x-0 data-[state=checked]:translate-x-4 rtl:data-[state=checked]:-translate-x-4',
          'data-disabled:bg-fg-disabled data-disabled:shadow-none',
        )}
      />
    </RadixSwitch.Root>
  );

  if (!label) return toggle;

  return (
    <div
      className={cn(
        'flex min-w-0 items-start gap-3',
        labelPosition === 'start' && 'flex-row-reverse justify-between',
        className,
      )}
    >
      <span className="flex h-5 items-center">{toggle}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <label
          htmlFor={id}
          className={cn(
            'break-words text-md',
            control.disabled ? 'cursor-not-allowed text-fg-muted' : 'cursor-pointer text-fg',
            labelHidden && 'sr-only',
          )}
        >
          {label}
        </label>
        {helpText ? (
          <span id={helpId} className={'text-sm text-fg-muted'}>
            {helpText}
          </span>
        ) : null}
      </span>
    </div>
  );
}
