'use client';

import { CircleAlert } from 'lucide-react';
import {
  createContext,
  useContext,
  useId,
  type ComponentPropsWithRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { formatCount } from '../lib/format';
import { Label, LabelContent, labelClasses } from './label';

/** What a Field tells the control inside it. */
export interface FieldContextValue {
  /** The id the control must use so the label points at it. */
  controlId: string;
  /** The label’s (or legend’s) id, for controls named with `aria-labelledby`. */
  labelId: string;
  /** Space-separated ids of the error and help text, in reading order. */
  describedBy?: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  /** The Field is a `fieldset` around several controls (checkboxes, radios). */
  group: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** The surrounding Field’s ids and state, or `null` outside a Field. */
export function useField() {
  return useContext(FieldContext);
}

/** Props a control spreads to be wired to its Field. */
export interface FieldControlProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  required?: boolean;
  disabled?: boolean;
}

interface UseFieldControlOptions {
  id?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  'aria-describedby'?: string;
}

/**
 * Merges a control’s own props with its Field’s: the control’s explicit
 * values win, the Field fills the rest. Outside a Field it passes the
 * control’s props through. In a group Field the fieldset carries the
 * description, so individual controls don’t repeat it.
 */
export function useFieldControl(options: UseFieldControlOptions): FieldControlProps & { invalid: boolean } {
  const field = useField();
  const inGroup = field?.group ?? false;
  const describedBy =
    [inGroup ? undefined : field?.describedBy, options['aria-describedby']].filter(Boolean).join(' ') || undefined;
  const invalid = options.invalid ?? field?.invalid ?? false;
  return {
    id: options.id ?? (inGroup ? undefined : field?.controlId),
    'aria-describedby': describedBy,
    'aria-invalid': invalid || undefined,
    // In a group, “required” means the group needs an answer, not that every checkbox must be ticked.
    required: options.required ?? (inGroup ? undefined : field?.required || undefined),
    disabled: options.disabled ?? (field?.disabled || undefined),
    invalid,
  };
}

export interface FieldProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The control’s visible name. Always set it, even when `labelHidden`. */
  label: ReactNode;
  /** Hide the label visually (e.g. a search box beside a heading); it still names the control. */
  labelHidden?: boolean;
  /** Guidance shown under the control and read after the label. Say what’s expected, not what’s obvious. */
  helpText?: ReactNode;
  /**
   * Validation message. Setting it marks the control invalid (`aria-invalid`)
   * and links the message with `aria-describedby`. Say how to fix it:
   * “Enter a price above 0”, not “Invalid”.
   */
  error?: ReactNode;
  /** Marks the control required: asterisk on the label, `required` on the control. */
  required?: boolean;
  /** Shows “(optional)” (or your string) after the label. */
  optional?: boolean | string;
  /** Disables the control and mutes the label. */
  disabled?: boolean;
  /** Id for the control. Set it here, not on the control. Generated when omitted. */
  id?: string;
  /**
   * Render a `fieldset` with a `legend` instead of a `label` — for a set of
   * checkboxes or a RadioGroup, which have their own item labels.
   */
  group?: boolean;
  /**
   * The control. Our inputs pick the ids up from context; for any other
   * control pass a function and spread what it receives:
   * `{(props) => <ThirdPartyInput {...props} />}`.
   */
  children: ReactNode | ((control: FieldControlProps) => ReactNode);
}

/**
 * Wraps one form control with its label, help text and error, and wires them
 * together with ids so assistive technology reads them in order.
 *
 * Use around every Input, Textarea and Select, and (with `group`) around a set
 * of checkboxes. Don’t use it for a single Checkbox or Switch — they carry
 * their own label — and don’t put more than one control in a non-group Field:
 * the label can only point at one.
 */
export function Field({
  label,
  labelHidden,
  helpText,
  error,
  required = false,
  optional,
  disabled = false,
  id,
  group = false,
  className,
  children,
  ...props
}: FieldProps) {
  const autoId = useId();
  const controlId = id ?? `${autoId}-control`;
  const labelId = `${autoId}-label`;
  const errorId = `${autoId}-error`;
  const helpTextId = `${autoId}-help`;
  const hasError = error != null && error !== false && error !== '';
  const hasErrorMessage = hasError && error !== true;
  const describedBy =
    [hasErrorMessage ? errorId : undefined, helpText ? helpTextId : undefined].filter(Boolean).join(' ') || undefined;

  const context: FieldContextValue = {
    controlId,
    labelId,
    describedBy,
    invalid: hasError,
    required,
    disabled,
    group,
  };

  const control =
    typeof children === 'function'
      ? children({
          id: controlId,
          'aria-describedby': describedBy,
          'aria-invalid': hasError || undefined,
          required: required || undefined,
          disabled: disabled || undefined,
        })
      : children;

  const messages = (
    <>
      {hasErrorMessage ? <FieldError id={errorId}>{error}</FieldError> : null}
      {helpText ? (
        <p id={helpTextId} className="text-sm text-fg-muted">
          {helpText}
        </p>
      ) : null}
    </>
  );

  if (group) {
    return (
      <fieldset
        aria-describedby={describedBy}
        disabled={disabled || undefined}
        className={cn('m-0 min-w-0 border-0 p-0', className)}
        {...(props as ComponentPropsWithoutRef<'fieldset'>)}
      >
        <legend
          id={labelId}
          className={cn(labelClasses, 'mb-2 p-0', disabled && 'text-fg-muted', labelHidden && 'sr-only')}
        >
          <LabelContent required={required} optional={optional}>
            {label}
          </LabelContent>
        </legend>
        <div className="flex flex-col gap-1.5">
          <FieldContext.Provider value={context}>{control}</FieldContext.Provider>
          {messages}
        </div>
      </fieldset>
    );
  }

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)} {...props}>
      <Label
        id={labelId}
        htmlFor={controlId}
        required={required}
        optional={optional}
        disabled={disabled}
        visuallyHidden={labelHidden}
        className="self-start"
      >
        {label}
      </Label>
      <FieldContext.Provider value={context}>{control}</FieldContext.Provider>
      {messages}
    </div>
  );
}

export interface FieldErrorProps extends ComponentPropsWithRef<'p'> {
  children?: ReactNode;
}

/**
 * A validation message: critical tone, a leading icon and a hidden “Error:”
 * prefix, so it never relies on colour alone. Field renders it for you; use it
 * directly only for errors that belong to a whole form section.
 */
export function FieldError({ className, children, ...props }: FieldErrorProps) {
  return (
    <p className={cn('flex items-start gap-1.5 text-sm text-critical-subtle-fg', className)} {...props}>
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0 break-words">
        <span className="sr-only">Error: </span>
        {children}
      </span>
    </p>
  );
}

export interface CharacterCountProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** Characters entered. */
  count: number;
  /** The limit (the control’s `maxLength`). */
  max: number;
}

/** “12/100” — how much of a length limit is used. Announced as “12 of 100 characters”. */
export function CharacterCount({ count, max, className, ...props }: CharacterCountProps) {
  return (
    <span
      className={cn(
        'shrink-0 text-xs tabular-nums',
        count >= max ? 'font-medium text-fg' : 'text-fg-subtle',
        className,
      )}
      {...props}
    >
      <span aria-hidden>
        {formatCount(count)}/{formatCount(max)}
      </span>
      <span className="sr-only">
        {formatCount(count)} of {formatCount(max)} characters
      </span>
    </span>
  );
}
