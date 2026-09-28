'use client';

import { RadioGroup as RadixRadioGroup } from 'radix-ui';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Field, useField, useFieldControl } from './field';

export interface RadioGroupProps extends ComponentPropsWithRef<typeof RadixRadioGroup.Root> {
  /**
   * The question the options answer. Renders a `fieldset` + `legend` that
   * names the group. Omit it only inside a `<Field group>` (which supplies the
   * legend) or when you pass `aria-label`/`aria-labelledby`.
   */
  legend?: ReactNode;
  /** Hide the legend visually; it still names the group. */
  legendHidden?: boolean;
  /** Guidance for the whole group, under the options. */
  helpText?: ReactNode;
  /** Validation message for the group, e.g. “Choose a shipping speed”. Marks the group invalid. */
  error?: ReactNode;
  /** Marks the group invalid without a message (use `error` when you have one). */
  invalid?: boolean;
  /** Asterisk on the legend; the group is required. */
  required?: boolean;
  /** Disables every option. */
  disabled?: boolean;
  /** `vertical` (default) stacks options; `horizontal` lays them in a row that wraps. Arrow keys follow it. */
  orientation?: 'vertical' | 'horizontal';
  /** Selected value when controlled. */
  value?: string;
  /** Initially selected value when uncontrolled. */
  defaultValue?: string;
  /** Called with the newly selected value. */
  onValueChange?: (value: string) => void;
  /** Form field name. */
  name?: string;
}

/**
 * Pick exactly one option from a short, visible list.
 *
 * Use when there are two to about six options and seeing them all side by
 * side helps the choice. Don’t use for more options (Select), for on/off
 * (Checkbox or Switch), or when several may be chosen (checkboxes in a
 * `<Field group>`). Always give it a legend.
 */
export function RadioGroup({ legend, legendHidden, helpText, error, required, disabled, ...props }: RadioGroupProps) {
  const field = useField();
  if (legend !== undefined && !field?.group) {
    return (
      <Field
        group
        label={legend}
        labelHidden={legendHidden}
        helpText={helpText}
        error={error}
        required={required}
        disabled={disabled}
      >
        <RadioGroupRoot required={required} {...props} />
      </Field>
    );
  }
  return <RadioGroupRoot required={required} disabled={disabled} {...props} />;
}

function RadioGroupRoot({
  orientation = 'vertical',
  invalid: invalidProp,
  className,
  ...props
}: Omit<RadioGroupProps, 'legend' | 'legendHidden' | 'helpText' | 'error'>) {
  const field = useField();
  const { invalid, id: _id, ...control } = useFieldControl({
    invalid: invalidProp,
    required: props.required,
    disabled: props.disabled,
    'aria-describedby': props['aria-describedby'],
  });
  return (
    <RadixRadioGroup.Root
      aria-labelledby={props['aria-label'] ? undefined : field?.labelId}
      {...props}
      {...control}
      orientation={orientation}
      data-invalid={invalid || undefined}
      className={cn(
        'group/radio flex',
        orientation === 'horizontal' ? 'flex-row flex-wrap gap-x-6 gap-y-2' : 'flex-col gap-2.5',
        className,
      )}
    />
  );
}

export interface RadioGroupItemProps extends Omit<ComponentPropsWithRef<typeof RadixRadioGroup.Item>, 'children'> {
  /** The value this option selects. */
  value: string;
  /** The option’s visible name; clicking it selects the option. */
  label: ReactNode;
  /** Explanation under the label, linked with `aria-describedby` — e.g. the cost or delivery time. */
  helpText?: ReactNode;
  /** Disables this option only. Say why nearby. */
  disabled?: boolean;
  /** Classes for the option’s row. */
  className?: string;
}

/** One option in a RadioGroup. */
export function RadioGroupItem({ label, helpText, className, id: idProp, ...props }: RadioGroupItemProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const helpId = `${autoId}-help`;
  return (
    <div className={cn('group/item flex min-w-0 items-start gap-2', className)}>
      <span className="flex h-5 items-center">
        <RadixRadioGroup.Item
          id={id}
          aria-describedby={[helpText ? helpId : undefined, props['aria-describedby']].filter(Boolean).join(' ') || undefined}
          {...props}
          className={cn(
            'grid size-4 shrink-0 place-items-center rounded-full border border-fg-subtle bg-surface',
            'transition-[background-color,border-color] duration-(--a-duration-fast) ease-standard',
            'hover:border-fg-muted',
            'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
            'group-data-invalid/radio:border-critical group-data-invalid/radio:data-[state=checked]:bg-critical',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:border-border-strong disabled:bg-surface-sunken',
            'disabled:data-[state=checked]:border-border-strong disabled:data-[state=checked]:bg-surface-sunken',
          )}
        >
          <RadixRadioGroup.Indicator className="size-1.5 rounded-full bg-primary-fg data-disabled:bg-fg-disabled" />
        </RadixRadioGroup.Item>
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <label
          htmlFor={id}
          className={cn(
            'break-words text-md',
            'cursor-pointer text-fg group-has-disabled/item:cursor-not-allowed group-has-disabled/item:text-fg-muted',
          )}
        >
          {label}
        </label>
        {helpText ? (
          <span id={helpId} className="text-sm text-fg-muted ">
            {helpText}
          </span>
        ) : null}
      </span>
    </div>
  );
}
