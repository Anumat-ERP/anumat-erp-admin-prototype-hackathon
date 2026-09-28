'use client';

import { Check, Minus } from 'lucide-react';
import { Checkbox as RadixCheckbox } from 'radix-ui';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useFieldControl } from './field';

/** The box itself; shared so other checkbox-like controls look the same. */
export const checkboxBoxClasses = [
  'group grid size-4 shrink-0 place-items-center rounded-sm border border-fg-subtle bg-surface text-primary-fg',
  'transition-[background-color,border-color] duration-(--a-duration-fast) ease-standard',
  'hover:border-fg-muted',
  'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
  'aria-invalid:border-critical aria-invalid:data-[state=checked]:border-critical aria-invalid:data-[state=checked]:bg-critical aria-invalid:data-[state=indeterminate]:border-critical aria-invalid:data-[state=indeterminate]:bg-critical',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  'disabled:cursor-not-allowed disabled:border-border-strong disabled:bg-surface-sunken disabled:text-fg-disabled',
  'disabled:data-[state=checked]:border-border-strong disabled:data-[state=checked]:bg-surface-sunken disabled:data-[state=indeterminate]:border-border-strong disabled:data-[state=indeterminate]:bg-surface-sunken',
];

export interface CheckboxProps extends Omit<ComponentPropsWithRef<typeof RadixCheckbox.Root>, 'children'> {
  /**
   * `true`, `false`, or `'indeterminate'` — some but not all of a group is
   * selected (announced as “mixed”). Clicking an indeterminate box checks it.
   */
  checked?: boolean | 'indeterminate';
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean | 'indeterminate';
  /** Called with the new state. */
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  /** The option’s name, beside the box; clicking it toggles the box. Without it, pass `aria-label`. */
  label?: ReactNode;
  /** Hide the label visually (e.g. in a table row) while keeping it as the accessible name. */
  labelHidden?: boolean;
  /** Extra explanation under the label, linked with `aria-describedby`. */
  helpText?: ReactNode;
  /** Marks the box invalid (red border, `aria-invalid`). Put the message in a Field or FieldError. */
  invalid?: boolean;
  /** Prevents interaction and mutes the label. */
  disabled?: boolean;
  /** The value submitted with a form when checked. */
  value?: string;
  /** Classes for the outer row (or the box when there’s no label). */
  className?: string;
}

/**
 * A box to turn one option on or off, or to pick several from a set.
 *
 * Use for independent choices and for multi-select lists, and when the
 * change takes effect on save. Don’t use it when the change applies
 * instantly (Switch), or when only one of a set can be chosen (RadioGroup).
 * Several related checkboxes go in a `<Field group>` with a legend.
 */
export function Checkbox({
  label,
  labelHidden,
  helpText,
  invalid: invalidProp,
  className,
  id: idProp,
  ...props
}: CheckboxProps) {
  const autoId = useId();
  const helpId = `${autoId}-help`;
  const { invalid, ...control } = useFieldControl({
    id: idProp,
    invalid: invalidProp,
    required: props.required,
    disabled: props.disabled,
    'aria-describedby': [helpText ? helpId : undefined, props['aria-describedby']].filter(Boolean).join(' ') || undefined,
  });
  const id = control.id ?? autoId;

  const box = (
    <RadixCheckbox.Root
      {...props}
      {...control}
      id={id}
      data-invalid={invalid || undefined}
      className={cn(checkboxBoxClasses, !label && className)}
    >
      <RadixCheckbox.Indicator className="grid place-items-center">
        <Check aria-hidden strokeWidth={3} className="hidden size-3 group-data-[state=checked]:block" />
        <Minus aria-hidden strokeWidth={3} className="hidden size-3 group-data-[state=indeterminate]:block" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  if (!label) return box;

  return (
    <div className={cn('flex min-w-0 items-start gap-2', className)}>
      <span className="flex h-5 items-center">{box}</span>
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
