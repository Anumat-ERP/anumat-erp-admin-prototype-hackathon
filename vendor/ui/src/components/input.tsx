'use client';

import { cva } from 'class-variance-authority';
import { Search, X } from 'lucide-react';
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../lib/cn';
import { IconButton } from './button';
import { CharacterCount, useFieldControl } from './field';

/**
 * The box shared by Input, Textarea and Select: border, surface, focus ring
 * and invalid/disabled/read-only looks. The ring is drawn by the box when the
 * control inside has keyboard focus, so prefix/suffix sit inside it.
 */
export const controlBoxClasses = [
  'rounded-md border border-border-input bg-surface text-fg shadow-xs',
  'transition-[border-color,box-shadow] duration-(--a-duration-fast) ease-standard',
  'hover:border-border-strong',
  'data-invalid:border-critical data-invalid:hover:border-critical',
  'data-disabled:cursor-not-allowed data-disabled:border-border data-disabled:bg-surface-sunken data-disabled:text-fg-disabled data-disabled:shadow-none',
  'data-readonly:border-border data-readonly:bg-surface-muted data-readonly:shadow-none',
];

/** Keyboard focus ring for a box containing an `input`/`textarea`/`select`. */
export const controlFocusClasses =
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-1 has-[:focus-visible]:outline-ring data-invalid:has-[:focus-visible]:outline-critical';

export const inputBoxVariants = cva(['flex w-full min-w-0 items-center', controlBoxClasses, controlFocusClasses], {
  variants: {
    size: {
      sm: 'h-control-sm gap-1.5 px-2 text-sm [&_svg]:size-4',
      md: 'h-control-md gap-2 px-3 text-md [&_svg]:size-4',
      lg: 'h-control-lg gap-2 px-3.5 text-lg [&_svg]:size-5',
    },
  },
  defaultVariants: { size: 'md' },
});

const CLEAR_BUTTON_SIZES = { sm: '-me-1 size-5', md: '-me-1.5 size-6', lg: '-me-2 size-8' } as const;

/** Set the value through the native setter so React fires `onChange`, controlled or not. */
function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'prefix'> {
  /** Control height; matches Button and Select at the same size so rows align. */
  size?: 'sm' | 'md' | 'lg';
  /** Content before the value, inside the box — a currency symbol, an icon. Decorative text should be in the label too. */
  prefix?: ReactNode;
  /** Content after the value, inside the box — a unit (“kg”, “%”). */
  suffix?: ReactNode;
  /**
   * Shows a clear button while there is a value. Clearing fires `onChange`
   * with an empty value (so controlled inputs just work), then `onClear`,
   * and returns focus to the input. On by default for `type="search"`.
   */
  clearable?: boolean;
  /** Called after the clear button (or Escape in a search field) empties the input. */
  onClear?: () => void;
  /** Accessible name of the clear button. */
  clearLabel?: string;
  /** Marks the value invalid (red border, `aria-invalid`). Inside a Field, set `error` on the Field instead. */
  invalid?: boolean;
  /** With `maxLength`, shows “12/100” inside the box. */
  showCharacterCount?: boolean;
  /** Classes for the `<input>` itself. `className` styles the outer box, which is what you size. */
  inputClassName?: string;
}

/**
 * A single-line text field.
 *
 * Use for short free text, numbers, emails and search. Wrap it in a Field for
 * its label, help text and error. Don’t use it for long text (Textarea), for
 * choosing from a fixed list (Select, RadioGroup) or for dates.
 */
export function Input({
  size = 'md',
  prefix,
  suffix,
  clearable,
  onClear,
  clearLabel = 'Clear',
  invalid: invalidProp,
  showCharacterCount,
  maxLength,
  type = 'text',
  className,
  inputClassName,
  value,
  defaultValue,
  onChange,
  onKeyDown,
  readOnly,
  ref,
  ...props
}: InputProps) {
  const { invalid, ...control } = useFieldControl({
    id: props.id,
    invalid: invalidProp,
    required: props.required,
    disabled: props.disabled,
    'aria-describedby': props['aria-describedby'],
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const countId = useId();
  const isSearch = type === 'search';
  const isClearable = clearable ?? isSearch;

  // Track length for the clear button and counter, whether or not the input is controlled.
  const [innerValue, setInnerValue] = useState(() => String(defaultValue ?? ''));
  const currentValue = value !== undefined ? String(value ?? '') : innerValue;
  const hasValue = currentValue.length > 0;
  const showCount = showCharacterCount && maxLength !== undefined;
  const interactive = !control.disabled && !readOnly;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInnerValue(event.target.value);
    onChange?.(event);
  };

  const clear = () => {
    const input = inputRef.current;
    if (!input) return;
    setNativeValue(input, '');
    onClear?.();
    input.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (!event.defaultPrevented && isSearch && event.key === 'Escape' && hasValue && interactive) {
      event.preventDefault();
      clear();
    }
  };

  const describedBy = [control['aria-describedby'], showCount ? countId : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <div
      className={cn(inputBoxVariants({ size }), className)}
      data-invalid={invalid || undefined}
      data-disabled={control.disabled || undefined}
      data-readonly={readOnly || undefined}
      onPointerDown={(event) => {
        // Clicking the padding or a prefix focuses the input, as if the box were the input.
        const target = event.target as HTMLElement;
        if (target === event.currentTarget || target.closest('[data-affix]')) {
          event.preventDefault();
          inputRef.current?.focus();
        }
      }}
    >
      {isSearch && prefix === undefined ? (
        <span data-affix aria-hidden className="flex shrink-0 text-fg-subtle">
          <Search />
        </span>
      ) : null}
      {prefix !== undefined && prefix !== null ? (
        <span data-affix className="flex shrink-0 items-center text-fg-muted">
          {prefix}
        </span>
      ) : null}
      <input
        {...props}
        {...control}
        ref={(node) => {
          inputRef.current = node;
          assignRef(ref, node);
        }}
        type={type}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        readOnly={readOnly}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-describedby={describedBy}
        className={cn(
          'h-full w-full min-w-12 flex-1 bg-transparent text-inherit outline-none',
          'placeholder:text-fg-subtle disabled:cursor-not-allowed',
          '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
          inputClassName,
        )}
      />
      {isClearable && hasValue && interactive ? (
        <IconButton
          icon={<X />}
          label={clearLabel}
          size="sm"
          variant="tertiary"
          onClick={clear}
          className={cn('rounded-sm text-fg-muted [&_svg]:size-4', CLEAR_BUTTON_SIZES[size])}
        />
      ) : null}
      {showCount ? <CharacterCount id={countId} count={currentValue.length} max={maxLength} /> : null}
      {suffix !== undefined && suffix !== null ? (
        <span data-affix className="min-w-0 max-w-1/2 truncate whitespace-nowrap text-fg-muted">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
