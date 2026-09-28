'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { AlertDialog, Dialog } from 'radix-ui';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { Button, IconButton } from './button';

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

/** One button in a modal or drawer footer. */
export interface ModalAction {
  /** Button label. A verb that names the outcome: “Save product”, not “OK”. */
  content: string;
  /**
   * Called on click. On a secondary action, leaving it out makes the button
   * close the overlay — the usual “Cancel”.
   */
  onAction?: () => void;
  /** Shows a spinner while keeping the button’s size. */
  loading?: boolean;
  /** Renders the critical tone. Use only for actions that destroy data. */
  destructive?: boolean;
  /** Prevents interaction. Say why in the body. */
  disabled?: boolean;
}

/** Tracks whether an element overflows, so a scroll region can take keyboard focus only when it needs to. */
export function useOverflows<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setOverflows(node.scrollHeight > node.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of Array.from(node.children)) observer.observe(child);
    return () => observer.disconnect();
  }, []);
  return [ref, overflows] as const;
}

const overlayClasses =
  'fixed inset-0 z-(--a-z-index-modal) bg-overlay animate-fade-in data-[state=closed]:animate-fade-out';

/* -------------------------------------------------------------------------- */
/* Composable parts                                                           */
/* -------------------------------------------------------------------------- */

/** The state container. Controlled with `open`/`onOpenChange`, or uncontrolled with `defaultOpen`. */
export const ModalRoot = Dialog.Root;
/** The element that opens the modal. Use `asChild` with a Button. Focus returns here on close. */
export const ModalTrigger = Dialog.Trigger;
/** Closes the modal. Use `asChild` with a Button. */
export const ModalClose = Dialog.Close;

export const modalContentVariants = cva(
  [
    'fixed z-(--a-z-index-modal) flex flex-col overflow-hidden bg-surface text-fg shadow-lg outline-none',
    'animate-pop-in data-[state=closed]:animate-pop-out',
  ],
  {
    variants: {
      size: {
        sm: 'left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border',
        md: 'left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[35rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border',
        lg: 'left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border',
        fullscreen: 'inset-0 h-dvh w-full',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export interface ModalContentProps extends ComponentPropsWithRef<typeof Dialog.Content> {
  /** Width. `sm` for confirmations, `md` for most forms, `lg` for dense content, `fullscreen` for editors. */
  size?: NonNullable<VariantProps<typeof modalContentVariants>['size']>;
}

/**
 * The dialog surface, portalled with its backdrop. Traps focus, closes on
 * Escape and on a backdrop click, and returns focus to the trigger.
 * Must contain a `ModalHeader` (or a `ModalTitle`) so it has a name.
 */
export function ModalContent({ size, className, children, ...props }: ModalContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className={overlayClasses} />
      <Dialog.Content className={cn(modalContentVariants({ size }), className)} {...props}>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

/** The dialog’s accessible name. Rendered by `ModalHeader`; use directly only in custom headers. */
export function ModalTitle({ className, ...props }: ComponentPropsWithRef<typeof Dialog.Title>) {
  return <Dialog.Title className={cn('min-w-0 text-lg font-semibold text-fg', className)} {...props} />;
}

/** The dialog’s accessible description. Rendered by `ModalHeader` from `description`. */
export function ModalDescription({ className, ...props }: ComponentPropsWithRef<typeof Dialog.Description>) {
  return <Dialog.Description className={cn('text-md text-fg-muted', className)} {...props} />;
}

export interface ModalHeaderProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** The dialog’s title. Required: it is the dialog’s accessible name. */
  title: ReactNode;
  /** Supporting line under the title, announced as the dialog’s description. */
  description?: ReactNode;
  /** Keep the title for assistive technology but hide it visually (e.g. media viewers). */
  hideTitle?: boolean;
  /** Hide the close button. Escape still closes. Rarely right. */
  hideClose?: boolean;
  /** Accessible name of the close button. */
  closeLabel?: string;
}

/** Sticky top band with the title, optional description and a close button. */
export function ModalHeader({
  title,
  description,
  hideTitle,
  hideClose,
  closeLabel = 'Close',
  className,
  children,
  ...props
}: ModalHeaderProps) {
  const visible = !hideTitle || description || children || !hideClose;
  return (
    <div
      className={cn(
        'flex shrink-0 items-start gap-3 bg-surface px-5 py-4',
        hideTitle ? 'pb-0' : 'border-b border-border',
        !visible && 'sr-only',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <ModalTitle className={cn(hideTitle && 'sr-only')}>{title}</ModalTitle>
        {description ? <ModalDescription className={cn(hideTitle && 'sr-only')}>{description}</ModalDescription> : null}
        {children}
      </div>
      {hideClose ? null : (
        <Dialog.Close asChild>
          <IconButton icon={<X />} label={closeLabel} size="sm" className="-me-1.5 -mt-0.5" />
        </Dialog.Close>
      )}
    </div>
  );
}

/**
 * The scrolling middle of a modal or drawer. Header and footer stay put while
 * this scrolls; when it overflows it becomes focusable so keyboard users can
 * scroll it.
 */
export function ModalBody({ className, children, ...props }: ComponentPropsWithRef<'div'>) {
  const [ref, overflows] = useOverflows<HTMLDivElement>();
  return (
    <div
      ref={ref}
      tabIndex={overflows ? 0 : undefined}
      className={cn(
        'min-h-0 flex-1 overflow-y-auto px-5 py-4 text-md text-fg',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Sticky bottom band. Actions sit at the end; put secondary content (help text, a checkbox) first. */
export function ModalFooter({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-surface px-5 py-3',
        className,
      )}
      {...props}
    />
  );
}

export interface ModalFooterActionsProps {
  /** The main action, shown last as a primary (or critical) button. */
  primaryAction?: ModalAction;
  /** Other actions, shown before the primary as secondary buttons. One without `onAction` closes. */
  secondaryActions?: ModalAction[];
  /** Content at the start of the footer, e.g. help text or a “Don’t ask again” checkbox. */
  footer?: ReactNode;
}

/** Renders `footer` content and the action buttons for Modal and Drawer. */
export function ModalFooterActions({ primaryAction, secondaryActions, footer }: ModalFooterActionsProps) {
  if (!primaryAction && !secondaryActions?.length && !footer) return null;
  return (
    <ModalFooter>
      {footer ? <div className="me-auto min-w-0 text-sm text-fg-muted">{footer}</div> : null}
      {secondaryActions?.map((action) => {
        const button = (
          <Button
            key={action.content}
            variant="secondary"
            loading={action.loading}
            disabled={action.disabled}
            onClick={action.onAction}
            className={cn(action.destructive && 'text-critical-subtle-fg')}
          >
            {action.content}
          </Button>
        );
        return action.onAction ? (
          button
        ) : (
          <Dialog.Close key={action.content} asChild>
            {button}
          </Dialog.Close>
        );
      })}
      {primaryAction ? (
        <Button
          variant={primaryAction.destructive ? 'critical' : 'primary'}
          loading={primaryAction.loading}
          disabled={primaryAction.disabled}
          onClick={primaryAction.onAction}
        >
          {primaryAction.content}
        </Button>
      ) : null}
    </ModalFooter>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal (simple API)                                                         */
/* -------------------------------------------------------------------------- */

export interface ModalProps extends ModalFooterActionsProps {
  /** Controlled open state. */
  open?: boolean;
  /** Called when the modal asks to open or close (trigger, Escape, backdrop, close button). */
  onOpenChange?: (open: boolean) => void;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Element that opens the modal, usually a Button. Focus returns to it on close. */
  trigger?: ReactNode;
  /** Title. Required — it is the dialog’s accessible name. */
  title: ReactNode;
  /** Visually hide the title while keeping it as the accessible name. */
  hideTitle?: boolean;
  /** Supporting line under the title. */
  description?: ReactNode;
  /** Width. */
  size?: ModalContentProps['size'];
  /** The body. Scrolls when long; header and footer stay visible. */
  children?: ReactNode;
  /** Classes for the dialog surface. */
  className?: string;
}

/**
 * A dialog that blocks the page until the merchant finishes or dismisses a
 * focused task.
 *
 * Use for short, self-contained tasks (edit a note, confirm a change) that
 * need the merchant’s full attention. Don’t use for long forms or content the
 * merchant wants to compare with the page — use a Drawer or a page. Don’t
 * open a modal from a modal. For destructive confirmations use
 * `ConfirmDialog`.
 */
export function Modal({
  open,
  onOpenChange,
  defaultOpen,
  trigger,
  title,
  hideTitle,
  description,
  size,
  primaryAction,
  secondaryActions,
  footer,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <ModalContent size={size} className={className} {...(description ? {} : { 'aria-describedby': undefined })}>
        <ModalHeader title={title} description={description} hideTitle={hideTitle} />
        {children ? <ModalBody>{children}</ModalBody> : null}
        <ModalFooterActions primaryAction={primaryAction} secondaryActions={secondaryActions} footer={footer} />
      </ModalContent>
    </Dialog.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* ConfirmDialog                                                              */
/* -------------------------------------------------------------------------- */

function useControllable(value: boolean | undefined, defaultValue: boolean, onChange?: (next: boolean) => void) {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const set = useCallback(
    (next: boolean) => {
      if (!controlled) setInternal(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [current, set] as const;
}

export interface ConfirmDialogProps {
  /** Controlled open state. */
  open?: boolean;
  /** Called when the dialog opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Element that opens the dialog, usually a critical or tertiary Button. */
  trigger?: ReactNode;
  /** What is being deleted: `{ singular: 'order', plural: 'orders' }`. */
  resourceName: { singular: string; plural: string };
  /** How many items the action affects. Stated in the title and the button. */
  count?: number;
  /** Names of the affected items. One item is named in the title; several are listed (the first 5, then “and N more”). */
  items?: string[];
  /** The verb. Defaults to “Delete”. */
  verb?: string;
  /** Override the generated title. */
  title?: ReactNode;
  /** What happens next. Defaults to “This can’t be undone.” */
  consequence?: ReactNode;
  /**
   * Called on confirm. Return a promise to keep the dialog open with a
   * loading button until it settles; it closes on success and stays open on
   * failure (pass `error`).
   */
  onConfirm: () => void | Promise<unknown>;
  /** Shows the confirm button as loading (for controlled flows). */
  loading?: boolean;
  /** An error from the last attempt, shown above the buttons. */
  error?: ReactNode;
  /** Cancel button label. */
  cancelLabel?: string;
}

const MAX_LISTED = 5;

/**
 * Asks the merchant to confirm a destructive action, stating exactly what
 * will be affected and how many.
 *
 * Use before deleting or irreversibly changing data. The dialog is an
 * `alertdialog`: it does not close on a backdrop click and focuses Cancel
 * first. Don’t use for reversible actions — do them and offer Undo in a
 * toast. Don’t use for general tasks — use `Modal`.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  defaultOpen = false,
  trigger,
  resourceName,
  count = 1,
  items,
  verb = 'Delete',
  title,
  consequence = 'This can’t be undone.',
  onConfirm,
  loading,
  error,
  cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const [pending, setPending] = useState(false);
  const noun = count === 1 ? resourceName.singular : resourceName.plural;
  const single = count === 1 && items?.length === 1 ? items[0] : undefined;
  const heading = title ?? (single ? `${verb} “${single}”?` : `${verb} ${count.toLocaleString()} ${noun}?`);
  const confirmLabel = `${verb} ${count === 1 ? resourceName.singular : `${count.toLocaleString()} ${noun}`}`;
  const busy = loading || pending;

  const handleConfirm = async () => {
    const result = onConfirm();
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      setPending(true);
      try {
        await result;
        setOpen(false);
      } catch {
        // Stay open; the caller shows `error`.
      } finally {
        setPending(false);
      }
    } else if (loading === undefined) {
      setOpen(false);
    }
  };

  const listed = items && items.length > 1 ? items.slice(0, MAX_LISTED) : undefined;
  const more = listed ? Math.max(count, items?.length ?? 0) - listed.length : 0;

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={(next) => !busy && setOpen(next)}>
      {trigger ? <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger> : null}
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={overlayClasses} />
        <AlertDialog.Content className={modalContentVariants({ size: 'sm' })}>
          <div className="flex shrink-0 flex-col gap-1 px-5 pt-5">
            <AlertDialog.Title className="text-lg font-semibold text-fg">{heading}</AlertDialog.Title>
            <AlertDialog.Description className="text-md text-fg-muted">
              {single ? (
                <>This permanently deletes 1 {resourceName.singular}. </>
              ) : (
                <>
                  This permanently deletes {count.toLocaleString()} {noun}.{' '}
                </>
              )}
              {consequence}
            </AlertDialog.Description>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-3">
            {listed ? (
              <ul className="flex flex-col gap-1 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-fg">
                {listed.map((item) => (
                  <li key={item} className="truncate">
                    {item}
                  </li>
                ))}
                {more > 0 ? <li className="text-fg-muted">and {more.toLocaleString()} more</li> : null}
              </ul>
            ) : null}
            {error ? (
              <p
                role="alert"
                className="mt-3 rounded-md border border-critical-border bg-critical-subtle px-3 py-2 text-sm text-critical-subtle-fg"
              >
                {error}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={busy}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <Button variant="critical" loading={busy} onClick={handleConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
