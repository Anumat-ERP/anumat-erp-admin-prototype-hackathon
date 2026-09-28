'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Dialog } from 'radix-ui';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';
import {
  ModalBody,
  ModalClose,
  ModalDescription,
  ModalFooter,
  ModalFooterActions,
  ModalHeader,
  ModalTitle,
  type ModalFooterActionsProps,
} from './modal';

/** The state container. Controlled with `open`/`onOpenChange`, or uncontrolled with `defaultOpen`. */
export const DrawerRoot = Dialog.Root;
/** The element that opens the drawer. Use `asChild` with a Button. Focus returns here on close. */
export const DrawerTrigger = Dialog.Trigger;
/** Closes the drawer. Use `asChild` with a Button. */
export const DrawerClose = ModalClose;
/** Sticky top band with the title, description and close button. Same as `ModalHeader`. */
export const DrawerHeader = ModalHeader;
/** Scrolling middle. Same as `ModalBody`. */
export const DrawerBody = ModalBody;
/** Sticky bottom band for actions. Same as `ModalFooter`. */
export const DrawerFooter = ModalFooter;
/** The drawer’s accessible name, for custom headers. */
export const DrawerTitle = ModalTitle;
/** The drawer’s accessible description, for custom headers. */
export const DrawerDescription = ModalDescription;

/*
 * motion.css only ships a right-hand slide. The left-hand keyframes live here
 * and are hoisted (and de-duplicated) into <head> by React 19.
 */
const LEFT_KEYFRAMES = `@keyframes a-slide-in-left{from{transform:translateX(-100%)}}@keyframes a-slide-out-left{to{transform:translateX(-100%)}}`;

export const drawerContentVariants = cva(
  [
    'fixed inset-y-0 z-(--a-z-index-modal) flex h-dvh w-[calc(100%-3rem)] flex-col bg-surface text-fg shadow-lg outline-none',
  ],
  {
    variants: {
      side: {
        right:
          'right-0 border-l border-border animate-slide-in-right data-[state=closed]:animate-slide-out-right',
        left: [
          'left-0 border-r border-border',
          'animate-[a-slide-in-left_var(--a-duration-slow)_var(--a-ease-enter)]',
          'data-[state=closed]:animate-[a-slide-out-left_var(--a-duration-base)_var(--a-ease-exit)]',
        ],
      },
      size: {
        sm: 'max-w-[20rem]',
        md: 'max-w-[28rem]',
        lg: 'max-w-[40rem]',
      },
    },
    defaultVariants: { side: 'right', size: 'md' },
  },
);

type DrawerVariants = VariantProps<typeof drawerContentVariants>;

export interface DrawerContentProps extends ComponentPropsWithRef<typeof Dialog.Content> {
  /** Edge the drawer slides from. `right` for details and filters; `left` for navigation. */
  side?: NonNullable<DrawerVariants['side']>;
  /** Width: `sm` 320px (navigation), `md` 448px (filters, details), `lg` 640px (rich previews). */
  size?: NonNullable<DrawerVariants['size']>;
}

/**
 * The side sheet surface with its backdrop, portalled. Traps focus, closes
 * on Escape or a backdrop click and returns focus to the trigger. Must
 * contain a `DrawerHeader` (or `DrawerTitle`).
 */
export function DrawerContent({ side, size, className, children, ...props }: DrawerContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-(--a-z-index-modal) bg-overlay animate-fade-in data-[state=closed]:animate-fade-out" />
      <Dialog.Content className={cn(drawerContentVariants({ side, size }), className)} {...props}>
        {side === 'left' ? (
          <style href="a-drawer-left-keyframes" precedence="default">
            {LEFT_KEYFRAMES}
          </style>
        ) : null}
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export interface DrawerProps extends ModalFooterActionsProps {
  /** Controlled open state. */
  open?: boolean;
  /** Called when the drawer asks to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Element that opens the drawer, usually a Button. */
  trigger?: ReactNode;
  /** Title. Required — it is the drawer’s accessible name. */
  title: ReactNode;
  /** Visually hide the title while keeping it as the accessible name. */
  hideTitle?: boolean;
  /** Supporting line under the title. */
  description?: ReactNode;
  /** Edge the drawer slides from. */
  side?: DrawerContentProps['side'];
  /** Width. */
  size?: DrawerContentProps['size'];
  /** The body. Scrolls; header and footer stay visible. */
  children?: ReactNode;
  /** Classes for the drawer surface. */
  className?: string;
}

/**
 * A panel that slides in from the edge of the screen over the page.
 *
 * Use for details of a row (an order preview), filters, and secondary
 * editing where the page behind still gives context. Don’t use for a task
 * that needs the merchant’s full attention (use a Modal) or for content
 * worth a URL (use a page). Don’t stack drawers.
 */
export function Drawer({
  open,
  onOpenChange,
  defaultOpen,
  trigger,
  title,
  hideTitle,
  description,
  side,
  size,
  primaryAction,
  secondaryActions,
  footer,
  children,
  className,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <DrawerContent
        side={side}
        size={size}
        className={className}
        {...(description ? {} : { 'aria-describedby': undefined })}
      >
        <DrawerHeader title={title} description={description} hideTitle={hideTitle} />
        {children ? <DrawerBody>{children}</DrawerBody> : null}
        <ModalFooterActions primaryAction={primaryAction} secondaryActions={secondaryActions} footer={footer} />
      </DrawerContent>
    </Dialog.Root>
  );
}
