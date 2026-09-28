'use client';

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type Ref,
} from 'react';
import { cn } from '../lib/cn';
import { CharacterCount, useFieldControl } from './field';
import { controlBoxClasses } from './input';

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

export interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  /** Visible lines. With `autoGrow`, the minimum height. */
  rows?: number;
  /**
   * Grow with the content, from `rows` up to `maxRows`, then scroll. Use for
   * notes and descriptions whose length varies a lot. The manual resize
   * handle is removed while it’s on.
   */
  autoGrow?: boolean;
  /** With `autoGrow`, the height (in lines) after which the textarea scrolls. Unlimited when omitted. */
  maxRows?: number;
  /** Marks the value invalid (red border, `aria-invalid`). Inside a Field, set `error` on the Field instead. */
  invalid?: boolean;
  /** With `maxLength`, shows “120/500” under the textarea. */
  showCharacterCount?: boolean;
}

/**
 * A multi-line text field.
 *
 * Use for free text that may run to several sentences — notes, descriptions,
 * addresses. Wrap it in a Field for the label and error. Don’t use it for a
 * single line (Input), and don’t use it for rich text or code.
 */
export function Textarea({
  rows = 3,
  autoGrow = false,
  maxRows,
  invalid: invalidProp,
  showCharacterCount,
  maxLength,
  className,
  value,
  defaultValue,
  onChange,
  readOnly,
  style,
  ref,
  ...props
}: TextareaProps) {
  const { invalid, ...control } = useFieldControl({
    id: props.id,
    invalid: invalidProp,
    required: props.required,
    disabled: props.disabled,
    'aria-describedby': props['aria-describedby'],
  });
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  const countId = useId();
  const [innerValue, setInnerValue] = useState(() => String(defaultValue ?? ''));
  const currentValue = value !== undefined ? String(value ?? '') : innerValue;
  const showCount = showCharacterCount && maxLength !== undefined;

  const resize = useCallback(() => {
    const el = innerRef.current;
    if (!el || !autoGrow) return;
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || 20;
    const padding = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    const min = rows * line + padding + border;
    const max = maxRows ? maxRows * line + padding + border : Number.POSITIVE_INFINITY;
    el.style.height = 'auto';
    const content = el.scrollHeight + border;
    el.style.height = `${Math.min(Math.max(content, min), max)}px`;
    el.style.overflowY = content > max ? 'auto' : 'hidden';
  }, [autoGrow, rows, maxRows]);

  // Re-measure when the value changes (controlled or typed) …
  useLayoutEffect(resize, [resize, currentValue]);

  // … and when the width changes, since wrapping changes the height.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el || !autoGrow || typeof ResizeObserver === 'undefined') return;
    let width = el.offsetWidth;
    const observer = new ResizeObserver(() => {
      if (el.offsetWidth !== width) {
        width = el.offsetWidth;
        resize();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoGrow, resize]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInnerValue(event.target.value);
    onChange?.(event);
  };

  const describedBy = [control['aria-describedby'], showCount ? countId : undefined].filter(Boolean).join(' ') || undefined;

  const textarea = (
    <textarea
      {...props}
      {...control}
      ref={(node) => {
        innerRef.current = node;
        assignRef(ref, node);
      }}
      rows={rows}
      value={value}
      defaultValue={defaultValue}
      maxLength={maxLength}
      readOnly={readOnly}
      onChange={handleChange}
      aria-describedby={describedBy}
      data-invalid={invalid || undefined}
      data-disabled={control.disabled || undefined}
      data-readonly={readOnly || undefined}
      style={style}
      className={cn(
        controlBoxClasses,
        'block w-full min-w-0 px-3 py-2 text-md placeholder:text-fg-subtle',
        'focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring data-invalid:focus-visible:outline-critical',
        autoGrow ? 'resize-none' : 'resize-y',
        !showCount && className,
      )}
    />
  );

  if (!showCount) return textarea;

  return (
    <div className={cn('flex w-full min-w-0 flex-col items-end gap-1', className)}>
      {textarea}
      <CharacterCount id={countId} count={currentValue.length} max={maxLength} />
    </div>
  );
}
