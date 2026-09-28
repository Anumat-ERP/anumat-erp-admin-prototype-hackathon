'use client';

import { Search, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type KeyboardEvent,
} from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './spinner';

export interface SearchFieldProps
  extends Omit<ComponentPropsWithRef<'input'>, 'value' | 'defaultValue' | 'onChange' | 'onInput' | 'size' | 'type' | 'children'> {
  /** Visible or visually-hidden label. Required: a placeholder is not a label. */
  label: string;
  /** Hide the label visually; it is still announced. */
  labelHidden?: boolean;
  /**
   * The query. When this changes from outside (e.g. "Clear all"), the field
   * follows. Typing updates the field immediately and `onChange` after the debounce.
   */
  value?: string;
  /** Initial query when uncontrolled. */
  defaultValue?: string;
  /** Called with the query after typing pauses for `debounceMs`, and at once on Enter or clear. */
  onChange?: (value: string) => void;
  /** Called on every keystroke, before debouncing — e.g. to show "typing". */
  onInput?: (value: string) => void;
  /** Called when the clear button or Escape empties the field. */
  onClear?: () => void;
  /** Delay before `onChange`, in ms. `0` calls it on every keystroke. */
  debounceMs?: number;
  /** Show a spinner while results are loading. The field stays editable. */
  loading?: boolean;
  /** Wrap in a `role="search"` landmark. Use once per page, for the main search. */
  searchLandmark?: boolean;
  /** Focus the field with Cmd+K (macOS) / Ctrl+K and show the hint. One per page. */
  shortcut?: boolean;
  /** Control height; matches Button. */
  size?: 'sm' | 'md';
  /** Class for the outer wrapper. The input itself takes `inputClassName`. */
  className?: string;
  /** Class for the `<input>`. */
  inputClassName?: string;
}

const isMac = () => typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

/**
 * A search input with a leading icon, a clear button, a debounced `onChange`
 * and an optional Cmd/Ctrl+K shortcut.
 *
 * Use to filter a list or table by free text, or as a page's main search.
 * Don't use for structured filters (status, date) — use Filters, which puts
 * this field beside the filter pills. Don't use for a single known value
 * (an SKU field on a form) — use an Input.
 */
export function SearchField({
  label,
  labelHidden = true,
  value,
  defaultValue = '',
  onChange,
  onInput,
  onClear,
  debounceMs = 250,
  loading = false,
  searchLandmark = false,
  shortcut = false,
  size = 'md',
  disabled,
  className,
  inputClassName,
  placeholder = 'Search',
  id: idProp,
  ref,
  onKeyDown,
  ...props
}: SearchFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [text, setText] = useState(value ?? defaultValue);
  const [lastValue, setLastValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mac, setMac] = useState(false);

  // Follow the controlled value when it changes from outside.
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== undefined) setText(value);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!shortcut) return;
    setMac(isMac());
    const handler = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcut]);

  const emit = (next: string, immediate: boolean) => {
    clearTimeout(timer.current);
    if (immediate || debounceMs <= 0) onChange?.(next);
    else timer.current = setTimeout(() => onChange?.(next), debounceMs);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setText(next);
    onInput?.(next);
    emit(next, false);
  };

  const clear = () => {
    setText('');
    onInput?.('');
    emit('', true);
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Escape' && text) {
      event.preventDefault();
      event.stopPropagation();
      clear();
    } else if (event.key === 'Enter') {
      emit(text, true);
    }
  };

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const heights = size === 'sm' ? 'h-control-sm text-sm' : 'h-control-md text-md';

  return (
    <div role={searchLandmark ? 'search' : undefined} className={cn('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={id} className={cn('text-md font-medium text-fg', labelHidden && 'sr-only')}>
        {label}
      </label>
      <div className="relative flex min-w-0 items-center">
        <Search aria-hidden className="pointer-events-none absolute start-2.5 size-4 text-fg-subtle" />
        <input
          ref={setRefs}
          id={id}
          type="search"
          autoComplete="off"
          spellCheck={false}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          aria-keyshortcuts={shortcut ? 'Meta+K Control+K' : undefined}
          aria-busy={loading || undefined}
          className={cn(
            'w-full min-w-0 rounded-md border border-border-input bg-surface ps-8 text-fg shadow-xs',
            'placeholder:text-fg-subtle',
            'transition-[border-color,box-shadow] duration-(--a-duration-fast) ease-standard',
            'hover:border-border-strong focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-fg-disabled',
            '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
            // Room for the spinner / clear button / shortcut hint.
            'pe-16',
            heights,
            inputClassName,
          )}
          {...props}
        />
        <div className="absolute end-1 flex items-center gap-1">
          {loading ? <Spinner size="sm" label="Searching" className="text-fg-subtle" /> : null}
          {text && !disabled ? (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              title="Clear search"
              className={cn(
                'inline-flex items-center justify-center rounded-sm text-fg-muted hover:bg-surface-hover hover:text-fg',
                'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring',
                size === 'sm' ? 'size-5' : 'size-7',
                '[&_svg]:size-4',
              )}
            >
              <X aria-hidden />
            </button>
          ) : shortcut && !loading ? (
            <kbd
              aria-hidden
              className="me-1 hidden rounded-sm border border-border bg-surface-muted px-1.5 font-sans text-xs text-fg-muted sm:inline-block"
            >
              {mac ? '⌘K' : 'Ctrl K'}
            </kbd>
          ) : null}
        </div>
      </div>
    </div>
  );
}
