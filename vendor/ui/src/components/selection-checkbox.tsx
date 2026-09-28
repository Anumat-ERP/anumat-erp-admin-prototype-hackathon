'use client';

import { Check, Minus } from 'lucide-react';
import { Checkbox } from 'radix-ui';
import type { ComponentPropsWithRef, KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { cn } from '../lib/cn';

export type SelectionState = boolean | 'indeterminate';

export interface SelectionCheckboxProps
  extends Omit<ComponentPropsWithRef<typeof Checkbox.Root>, 'checked' | 'defaultChecked' | 'onCheckedChange' | 'children' | 'aria-label'> {
  /** `true`, `false`, or `'indeterminate'` (some — not all — rows selected). */
  checked: SelectionState;
  /** Called with the next state. From `'indeterminate'` the next state is `true`. */
  onCheckedChange: (checked: boolean) => void;
  /**
   * Accessible name, specific to the row: "Select order #1024", not "Select".
   * Several of these sit on one screen, so a generic name is useless.
   */
  label: string;
}

const stop = (event: MouseEvent | KeyboardEvent | PointerEvent) => event.stopPropagation();

/**
 * The checkbox used to select rows in ResourceList, DataTable and IndexTable.
 *
 * Internal building block: it stops click, keydown and pointerdown from
 * reaching the row, so selecting a row never also opens it. Its hit area is
 * larger than the 16px box so it is easy to hit in dense tables.
 *
 * Use only for row selection. For form fields use `Checkbox`, which has a
 * visible label and helper text.
 */
export function SelectionCheckbox({
  checked,
  onCheckedChange,
  label,
  className,
  onClick,
  onKeyDown,
  onPointerDown,
  ...props
}: SelectionCheckboxProps) {
  return (
    <Checkbox.Root
      checked={checked}
      onCheckedChange={(next) => onCheckedChange(next === true)}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-border-input bg-surface text-primary-fg',
        // Extend the hit area without changing layout.
        'before:absolute before:-inset-2 before:content-[""]',
        'transition-colors duration-(--a-duration-fast) ease-standard',
        'hover:border-border-strong',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-sunken disabled:text-fg-disabled',
        '[&_svg]:size-3.5 [&_svg]:stroke-[3]',
        className,
      )}
      onClick={(event) => {
        stop(event);
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        stop(event);
        onKeyDown?.(event);
      }}
      onPointerDown={(event) => {
        stop(event);
        onPointerDown?.(event);
      }}
      {...props}
    >
      <Checkbox.Indicator className="flex items-center justify-center">
        {checked === 'indeterminate' ? <Minus aria-hidden /> : <Check aria-hidden />}
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}
