import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Spoken names for symbols a screen reader would otherwise read literally (or skip). */
const KEY_NAMES: Record<string, string> = {
  '⌘': 'Command',
  '⇧': 'Shift',
  '⌥': 'Option',
  '⌃': 'Control',
  '↵': 'Enter',
  '⏎': 'Enter',
  '⌫': 'Backspace',
  '⎋': 'Escape',
  '⇥': 'Tab',
  '↑': 'Up arrow',
  '↓': 'Down arrow',
  '←': 'Left arrow',
  '→': 'Right arrow',
};

export interface KbdProps extends ComponentPropsWithRef<'kbd'> {
  /** Size to sit in body text (`md`) or in menus and tooltips (`sm`). */
  size?: 'sm' | 'md';
  children?: ReactNode;
}

const KBD_SIZES = { sm: 'h-4.5 min-w-4.5 px-1 text-xs', md: 'h-5 min-w-5 px-1.5 text-xs' } as const;

/**
 * A key on the keyboard — `Esc`, `⌘`.
 *
 * Use to show a keyboard shortcut next to the action it triggers, in menus,
 * tooltips and help text. Don’t use it for code (use Text `variant="mono"`)
 * or to style arbitrary labels. For a combination, use KbdShortcut.
 * Symbols like `⌘` are given a spoken name automatically.
 */
export function Kbd({ size = 'md', className, children, ...props }: KbdProps) {
  const spoken = typeof children === 'string' ? KEY_NAMES[children] : undefined;
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center rounded-sm border border-border-strong bg-surface-muted',
        'font-sans font-medium leading-none whitespace-nowrap text-fg-muted',
        KBD_SIZES[size],
        className,
      )}
      {...props}
    >
      {spoken ? (
        <>
          <span aria-hidden>{children}</span>
          <span className="sr-only">{spoken}</span>
        </>
      ) : (
        children
      )}
    </kbd>
  );
}

export interface KbdShortcutProps extends Omit<ComponentPropsWithRef<'kbd'>, 'children'> {
  /** The keys, in the order they’re pressed: `['⌘', 'K']`. */
  keys: string[];
  /** Size of each key. */
  size?: 'sm' | 'md';
}

/**
 * A key combination — `⌘` `K`. Renders the HTML pattern for key input: a
 * `<kbd>` of `<kbd>`s, read as “Command plus K”.
 */
export function KbdShortcut({ keys, size = 'md', className, ...props }: KbdShortcutProps) {
  return (
    <kbd className={cn('inline-flex items-center gap-0.5 font-sans', className)} {...props}>
      {keys.map((key, index) => (
        <span key={`${key}-${index}`} className="inline-flex items-center gap-0.5">
          {index > 0 ? <span className="sr-only"> plus </span> : null}
          <Kbd size={size}>{key}</Kbd>
        </span>
      ))}
    </kbd>
  );
}
