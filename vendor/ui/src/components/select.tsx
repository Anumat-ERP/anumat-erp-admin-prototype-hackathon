'use client';

import { cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useFieldControl } from './field';
import { controlBoxClasses, controlFocusClasses } from './input';

export interface SelectOption {
  /** Submitted value. */
  value: string;
  /** Visible text. Plain text only — native options can’t hold markup. */
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  /** The group’s heading in the list. */
  label: string;
  options: SelectOption[];
  disabled?: boolean;
}

const selectBoxVariants = cva(['relative flex w-full min-w-0 items-center', controlBoxClasses, controlFocusClasses], {
  variants: {
    size: {
      sm: 'h-control-sm text-sm',
      md: 'h-control-md text-md',
      lg: 'h-control-lg text-lg',
    },
  },
  defaultVariants: { size: 'md' },
});

const SELECT_PADDING = { sm: 'ps-2 pe-7', md: 'ps-3 pe-9', lg: 'ps-3.5 pe-10' } as const;
const CHEVRON = { sm: 'end-2 size-4', md: 'end-3 size-4', lg: 'end-3.5 size-5' } as const;

export interface SelectProps extends Omit<ComponentPropsWithRef<'select'>, 'size' | 'multiple'> {
  /** Control height; matches Input and Button at the same size. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Text shown until a choice is made (“Select a country”). Rendered as a
   * first, disabled option with an empty value, so a `required` select
   * can’t be submitted on it. Selects start on it unless given a value.
   */
  placeholder?: string;
  /**
   * The choices, flat or grouped. Or pass `<option>`/`<optgroup>` children
   * instead; children come after `options`.
   */
  options?: Array<SelectOption | SelectOptionGroup>;
  /** Marks the value invalid (red border, `aria-invalid`). Inside a Field, set `error` on the Field instead. */
  invalid?: boolean;
  /** Classes for the `<select>` itself. `className` styles the outer box, which is what you size. */
  selectClassName?: string;
  children?: ReactNode;
}

function isGroup(option: SelectOption | SelectOptionGroup): option is SelectOptionGroup {
  return 'options' in option;
}

/**
 * Pick one value from a list, using the browser’s native `<select>`.
 *
 * Use for choosing one of roughly 5–15 known options in a form: native menus
 * work with every keyboard, screen reader and mobile picker, and submit with
 * the form. Use a RadioGroup for fewer options you want visible at once.
 * Prefer a Combobox when people need to **search** (long lists like
 * countries-with-typing, products, customers), when options load
 * asynchronously, when an option needs more than plain text (an avatar, a
 * price, a description), or when several can be chosen.
 */
export function Select({
  size = 'md',
  placeholder,
  options,
  invalid: invalidProp,
  className,
  selectClassName,
  value,
  defaultValue,
  children,
  ...props
}: SelectProps) {
  const { invalid, ...control } = useFieldControl({
    id: props.id,
    invalid: invalidProp,
    required: props.required,
    disabled: props.disabled,
    'aria-describedby': props['aria-describedby'],
  });

  // Start on the placeholder rather than silently on the first real option.
  const initial = placeholder !== undefined && value === undefined && defaultValue === undefined ? '' : defaultValue;

  return (
    <div
      className={cn(selectBoxVariants({ size }), className)}
      data-invalid={invalid || undefined}
      data-disabled={control.disabled || undefined}
    >
      <select
        {...props}
        {...control}
        value={value}
        defaultValue={initial}
        className={cn(
          'h-full w-full min-w-0 cursor-pointer appearance-none truncate rounded-md bg-transparent text-inherit outline-none',
          'disabled:cursor-not-allowed',
          // The placeholder reads as a hint, not a value.
          "has-[option[value='']:checked]:text-fg-subtle",
          '[&_optgroup]:bg-surface [&_optgroup]:text-fg [&_option]:bg-surface [&_option]:text-fg',
          SELECT_PADDING[size],
          selectClassName,
        )}
      >
        {placeholder !== undefined ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options?.map((option) =>
          isGroup(option) ? (
            <optgroup key={`group-${option.label}`} label={option.label} disabled={option.disabled}>
              {option.options.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ),
        )}
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-fg-muted',
          control.disabled && 'text-fg-disabled',
          CHEVRON[size],
        )}
      />
    </div>
  );
}
