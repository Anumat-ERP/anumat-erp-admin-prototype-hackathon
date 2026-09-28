'use client';

import { Check, ChevronDown, ChevronRight, Circle } from 'lucide-react';
import { DropdownMenu as Menu } from 'radix-ui';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';

/* -------------------------------------------------------------------------- */
/* Styled primitives                                                          */
/* -------------------------------------------------------------------------- */

/** The menu’s state container (Radix DropdownMenu Root). */
export const DropdownMenu = Menu.Root;
/** The element that opens the menu. Use `asChild` with a Button. */
export const DropdownMenuTrigger = Menu.Trigger;
/** Groups related items; pair with a `DropdownMenuLabel` for a titled section. */
export const DropdownMenuGroup = Menu.Group;
/** A group of mutually exclusive `DropdownMenuRadioItem`s. */
export const DropdownMenuRadioGroup = Menu.RadioGroup;
/** A nested menu’s state container. */
export const DropdownMenuSub = Menu.Sub;

const surface =
  'z-(--a-z-index-popover) min-w-48 max-w-[min(20rem,calc(100vw-1rem))] overflow-y-auto rounded-lg border border-border bg-surface p-1 text-md text-fg shadow-md outline-none animate-pop-in data-[state=closed]:animate-pop-out';

/** The floating menu surface, portalled. Arrow keys move, typing jumps to an item, Escape closes. */
export function DropdownMenuContent({
  sideOffset = 4,
  collisionPadding = 8,
  className,
  ...props
}: ComponentPropsWithRef<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          surface,
          'max-h-(--radix-dropdown-menu-content-available-height) origin-(--radix-dropdown-menu-content-transform-origin)',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  );
}

const itemClasses = [
  'relative flex min-h-8 cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-md text-fg outline-none',
  'data-highlighted:bg-surface-hover data-[state=open]:bg-surface-hover',
  'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
  '[&_svg]:size-4 [&_svg]:shrink-0',
];

export interface DropdownMenuItemProps extends ComponentPropsWithRef<typeof Menu.Item> {
  /** Critical tone, for actions that destroy data. */
  destructive?: boolean;
}

/** One action. `onSelect` runs it; the menu closes afterwards unless you `preventDefault`. */
export function DropdownMenuItem({ destructive, className, ...props }: DropdownMenuItemProps) {
  return (
    <Menu.Item
      data-destructive={destructive || undefined}
      className={cn(
        itemClasses,
        'data-highlighted:[&_svg]:text-fg [&_svg]:text-fg-muted',
        destructive &&
          'text-critical-subtle-fg [&_svg]:text-critical-subtle-fg data-highlighted:bg-critical-subtle data-highlighted:text-critical-subtle-fg data-highlighted:[&_svg]:text-critical-subtle-fg',
        'data-disabled:text-fg-disabled data-disabled:[&_svg]:text-fg-disabled',
        className,
      )}
      {...props}
    />
  );
}

/** A toggle item with a check mark. */
export function DropdownMenuCheckboxItem({ className, children, ...props }: ComponentPropsWithRef<typeof Menu.CheckboxItem>) {
  return (
    <Menu.CheckboxItem className={cn(itemClasses, 'ps-8', className)} {...props}>
      <span className="absolute start-2 inline-flex size-4 items-center justify-center" aria-hidden>
        <Menu.ItemIndicator>
          <Check />
        </Menu.ItemIndicator>
      </span>
      {children}
    </Menu.CheckboxItem>
  );
}

/** One choice in a `DropdownMenuRadioGroup`. */
export function DropdownMenuRadioItem({ className, children, ...props }: ComponentPropsWithRef<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem className={cn(itemClasses, 'ps-8', className)} {...props}>
      <span className="absolute start-2 inline-flex size-4 items-center justify-center" aria-hidden>
        <Menu.ItemIndicator>
          <Circle className="size-2! fill-current" />
        </Menu.ItemIndicator>
      </span>
      {children}
    </Menu.RadioItem>
  );
}

/** A section title. Not focusable. */
export function DropdownMenuLabel({ className, ...props }: ComponentPropsWithRef<typeof Menu.Label>) {
  return (
    <Menu.Label
      className={cn('px-2 pb-1 pt-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase', className)}
      {...props}
    />
  );
}

/** A divider between groups. */
export function DropdownMenuSeparator({ className, ...props }: ComponentPropsWithRef<typeof Menu.Separator>) {
  return <Menu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />;
}

/** Opens a nested menu. Keep nesting to one level. */
export function DropdownMenuSubTrigger({ className, children, ...props }: ComponentPropsWithRef<typeof Menu.SubTrigger>) {
  return (
    <Menu.SubTrigger className={cn(itemClasses, '[&_svg]:text-fg-muted', className)} {...props}>
      {children}
      <ChevronRight className="ms-auto" aria-hidden />
    </Menu.SubTrigger>
  );
}

/** A nested menu’s surface. */
export function DropdownMenuSubContent({ className, ...props }: ComponentPropsWithRef<typeof Menu.SubContent>) {
  return (
    <Menu.Portal>
      <Menu.SubContent collisionPadding={8} className={cn(surface, className)} {...props} />
    </Menu.Portal>
  );
}

/* -------------------------------------------------------------------------- */
/* ActionMenu                                                                 */
/* -------------------------------------------------------------------------- */

/** One action in an ActionMenu or PageActions. */
export interface ActionMenuItem {
  /** Label. A verb phrase: “Duplicate order”. */
  content: string;
  /** Leading icon (lucide). */
  icon?: ReactNode;
  /** Runs the action. */
  onAction?: () => void;
  /** Navigate instead of acting: the item renders as a link. */
  href?: string;
  /** Critical tone, for actions that destroy data. */
  destructive?: boolean;
  /** Prevents selection. Explain why with `helpText`. */
  disabled?: boolean;
  /** A second, muted line under the label. */
  helpText?: ReactNode;
  /** Trailing content: a keyboard shortcut, a count. */
  suffix?: ReactNode;
}

/** A titled group of items. Sections are separated by a divider. */
export interface ActionMenuSection {
  /** Section heading, announced as the group’s name. */
  title?: string;
  /** The actions. */
  items: ActionMenuItem[];
}

function ActionMenuItemView({ item }: { item: ActionMenuItem }) {
  const body = (
    <>
      {item.icon ? (
        <span aria-hidden className={cn('inline-flex', item.helpText && 'self-start pt-0.5')}>
          {item.icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{item.content}</span>
        {item.helpText ? (
          <span
            className={cn(
              'text-sm',
              item.disabled ? 'text-fg-disabled' : item.destructive ? 'text-critical-subtle-fg' : 'text-fg-muted',
            )}
          >
            {item.helpText}
          </span>
        ) : null}
      </span>
      {item.suffix ? (
        <span className={cn('ms-4 shrink-0 text-sm', item.disabled ? 'text-fg-disabled' : 'text-fg-subtle')}>
          {item.suffix}
        </span>
      ) : null}
    </>
  );
  return (
    <DropdownMenuItem
      destructive={item.destructive}
      disabled={item.disabled}
      textValue={item.content}
      onSelect={item.onAction}
      asChild={Boolean(item.href)}
    >
      {item.href ? <a href={item.href}>{body}</a> : body}
    </DropdownMenuItem>
  );
}

function Section({ section, index }: { section: ActionMenuSection; index: number }) {
  const id = useId();
  return (
    <>
      {index > 0 ? <DropdownMenuSeparator /> : null}
      <DropdownMenuGroup aria-labelledby={section.title ? id : undefined}>
        {section.title ? <DropdownMenuLabel id={id}>{section.title}</DropdownMenuLabel> : null}
        {section.items.map((item) => (
          <ActionMenuItemView key={item.content} item={item} />
        ))}
      </DropdownMenuGroup>
    </>
  );
}

export interface ActionMenuProps {
  /** The element that opens the menu, usually `<Button trailingIcon={<ChevronDown />}>More actions</Button>`. */
  trigger: ReactNode;
  /** Grouped actions. */
  sections?: ActionMenuSection[];
  /** Ungrouped actions; shorthand for one untitled section. Rendered before `sections`. */
  items?: ActionMenuItem[];
  /** Controlled open state. */
  open?: boolean;
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Horizontal alignment against the trigger. */
  align?: 'start' | 'center' | 'end';
  /** Which side of the trigger the menu prefers. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * Modal menus lock page scroll and hide the rest of the page from
   * assistive technology while open. Off by default: an action menu is a
   * transient popup, and locking scroll shifts page layout.
   */
  modal?: boolean;
  /** Classes for the menu surface. */
  className?: string;
}

/**
 * A button that opens a list of actions.
 *
 * Use to group secondary actions on a page, a card or a row (“More
 * actions”). Keyboard: arrows move, typing jumps to an item, Enter runs it,
 * Escape closes. Don’t use for navigation between pages (use Navigation or
 * Tabs), for choosing a value in a form (use a Select), or to hide the one
 * action merchants need most — that belongs in a visible Button.
 */
export function ActionMenu({
  trigger,
  sections = [],
  items,
  open,
  onOpenChange,
  defaultOpen,
  align = 'end',
  side,
  modal = false,
  className,
}: ActionMenuProps) {
  const all = items?.length ? [{ items }, ...sections] : sections;
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen} modal={modal}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className={className}>
        {all.map((section, index) => (
          <Section key={section.title ?? index} section={section} index={index} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */
/* PageActions                                                                */
/* -------------------------------------------------------------------------- */

export interface PageActionsProps {
  /** Actions in priority order. The first `maxVisible` render as buttons; the rest go in the menu. */
  actions: ActionMenuItem[];
  /** How many actions stay visible as buttons. */
  maxVisible?: number;
  /** Label of the overflow menu’s button. */
  moreLabel?: string;
  /** Button size. */
  size?: 'sm' | 'md' | 'lg';
  /** Classes for the wrapper. */
  className?: string;
}

/**
 * Secondary page actions: the first few as buttons, the rest in a “More
 * actions” menu.
 *
 * Use in a page or card header where there are more actions than room.
 * Order actions by how often merchants use them. Don’t put the primary
 * action here — render it as a primary Button beside this.
 */
export function PageActions({ actions, maxVisible = 2, moreLabel = 'More actions', size = 'md', className }: PageActionsProps) {
  const visible = actions.slice(0, maxVisible);
  const overflow = actions.slice(maxVisible);
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {visible.map((action) =>
        action.href ? (
          <Button
            key={action.content}
            asChild
            size={size}
            variant="secondary"
            disabled={action.disabled}
            className={cn(action.destructive && 'text-critical-subtle-fg')}
          >
            <a href={action.href}>
              {action.icon ? <span aria-hidden className="inline-flex">{action.icon}</span> : null}
              {action.content}
            </a>
          </Button>
        ) : (
          <Button
            key={action.content}
            size={size}
            variant="secondary"
            icon={action.icon ? <span aria-hidden className="inline-flex">{action.icon}</span> : undefined}
            disabled={action.disabled}
            onClick={action.onAction}
            className={cn(action.destructive && 'text-critical-subtle-fg')}
          >
            {action.content}
          </Button>
        ),
      )}
      {overflow.length ? (
        <ActionMenu
          items={overflow}
          trigger={
            <Button size={size} variant="secondary" trailingIcon={<ChevronDown aria-hidden />}>
              {moreLabel}
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
