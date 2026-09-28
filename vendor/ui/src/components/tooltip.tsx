'use client';

import { Tooltip as RadixTooltip } from 'radix-ui';
import { createContext, useContext, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react';
import { cn } from '../lib/cn';

const ProviderPresent = createContext(false);

export interface TooltipProviderProps {
  /** Hover delay before a tooltip opens, in ms. */
  delayDuration?: number;
  /** After one tooltip closes, others open instantly within this window (ms), so scanning a toolbar isn’t slow. */
  skipDelayDuration?: number;
  children?: ReactNode;
}

/**
 * Shares tooltip timing across the app so moving between tooltips skips the
 * delay. Put one near the root. Tooltips also work without it (each then
 * brings its own).
 */
export function TooltipProvider({ delayDuration = 400, skipDelayDuration = 300, children }: TooltipProviderProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      <ProviderPresent.Provider value>{children}</ProviderPresent.Provider>
    </RadixTooltip.Provider>
  );
}

export interface TooltipProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixTooltip.Content>, 'content' | 'children' | 'asChild'> {
  /** Short, plain-text hint. No links, buttons or anything essential — it can’t be reached on touch. */
  content: ReactNode;
  /**
   * The trigger: a single focusable element (Button, IconButton, a link).
   * For a disabled button, wrap it in `<span tabIndex={0}>` — disabled
   * elements get no hover or focus events.
   */
  children: ReactElement;
  /** Preferred side; flips when there’s no room. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignment against the trigger. */
  align?: 'start' | 'center' | 'end';
  /** Open state when controlled. */
  open?: boolean;
  /** Initial open state when uncontrolled (mainly for docs and tests). */
  defaultOpen?: boolean;
  /** Called when the tooltip opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Hover delay before opening, in ms. Overrides the provider’s. */
  delayDuration?: number;
}

/**
 * A short label that appears on hover and keyboard focus.
 *
 * Use to name an icon-only button or to reveal the full text of something
 * truncated. Don’t put essential information in a tooltip (touch users and
 * many screen-magnifier users never see it), don’t put interactive content in
 * one (it can’t be reached), and don’t attach one to a disabled button
 * directly — wrap the button in `<span tabIndex={0}>` first. If the content
 * needs a link or more than a sentence, use a Popover.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  open,
  defaultOpen,
  onOpenChange,
  delayDuration,
  className,
  ...props
}: TooltipProps) {
  const hasProvider = useContext(ProviderPresent);

  const tooltip = (
    <RadixTooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={8}
          className={cn(
            'z-(--a-z-index-tooltip) max-w-xs rounded-md bg-surface-inverse px-2 py-1 text-sm text-fg-inverse shadow-md',
            'break-words data-[state=delayed-open]:animate-fade-in data-[state=instant-open]:animate-fade-in',
            className,
          )}
          {...props}
        >
          {content}
          <RadixTooltip.Arrow width={10} height={5} className="fill-surface-inverse" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );

  return hasProvider ? tooltip : <TooltipProvider>{tooltip}</TooltipProvider>;
}
