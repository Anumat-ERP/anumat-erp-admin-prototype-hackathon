'use client';

import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { Toast as ToastPrimitive } from 'radix-ui';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';

export type ToastTone = 'default' | 'critical' | 'success';

export interface ToastAction {
  /** Short verb shown on the button: "Undo", "View". */
  label: string;
  onAction: () => void;
  /**
   * Required. How a keyboard or screen reader user can do the same thing
   * without the toast ("Undo from the Orders page, or press Ctrl+Z"). Radix
   * announces this instead of the button, because the toast may be gone
   * before they reach it.
   */
  altText: string;
}

export interface ToastOptions {
  /** One short sentence: "Product archived". No trailing period needed. */
  title: ReactNode;
  /** Optional second line. Keep it short; long content belongs in a Banner. */
  description?: ReactNode;
  /**
   * `default` for confirmations. `success` adds a check. `critical` for
   * failures: announced assertively (Radix `type="foreground"`).
   */
  tone?: ToastTone;
  /** A single follow-up action, typically "Undo". */
  action?: ToastAction;
  /** ms before auto-dismiss. Defaults to the provider's (5000). Paused on hover and focus. */
  duration?: number;
}

interface ToastRecord extends ToastOptions {
  id: string;
  open: boolean;
}

interface ToastContextValue {
  toasts: ToastRecord[];
  toast: (options: ToastOptions) => string;
  dismiss: (id?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Time to let the exit animation play before the toast leaves the DOM. */
const EXIT_MS = 200;

export interface ToastProviderProps {
  children?: ReactNode;
  /** Default auto-dismiss time in ms. */
  duration?: number;
  /**
   * Label of the notifications region, announced when a user jumps there with
   * the hotkey (F8). `{hotkey}` is replaced by the key.
   */
  label?: string;
  /** Render the Toaster automatically. Set `false` to place `<Toaster />` yourself. */
  withToaster?: boolean;
}

/**
 * Holds the toast queue and renders the notification region. Mount once near
 * the app root; call `useToast()` anywhere below it.
 */
export function ToastProvider({
  children,
  duration = 5000,
  label = 'Notifications ({hotkey})',
  withToaster = true,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const counter = useRef(0);

  const toast = useCallback((options: ToastOptions) => {
    counter.current += 1;
    const id = `toast-${counter.current}`;
    setToasts((current) => [...current, { ...options, id, open: true }]);
    return id;
  }, []);

  const dismiss = useCallback(
    (id?: string) => {
      setToasts((current) => current.map((t) => (id === undefined || t.id === id ? { ...t, open: false } : t)));
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.open || (id !== undefined && t.id !== id)));
      }, EXIT_MS);
    },
    [],
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider duration={duration} label={label} swipeDirection="down">
        {children}
        {withToaster ? <Toaster /> : null}
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

/**
 * `const { toast, dismiss } = useToast()`. `toast({...})` returns the id, which
 * `dismiss(id)` accepts; `dismiss()` with no id closes all.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  const { toast, dismiss } = context;
  return useMemo(() => ({ toast, dismiss }), [toast, dismiss]);
}

const TONE_CLASS: Record<ToastTone, string> = {
  default: 'bg-surface-inverse text-fg-inverse',
  success: 'bg-surface-inverse text-fg-inverse',
  critical: 'bg-critical text-critical-fg',
};

const TONE_ICON: Partial<Record<ToastTone, typeof CircleCheck>> = { success: CircleCheck, critical: CircleAlert };

export interface ToastProps
  extends Omit<ComponentPropsWithRef<typeof ToastPrimitive.Root>, 'title' | 'type'>,
    Omit<ToastOptions, 'duration'> {
  /** Called after the close button, swipe, Escape or timeout closes it. */
  onDismiss?: () => void;
}

/**
 * One toast. Usually rendered for you by `<Toaster />` from the queue; use
 * directly only for a controlled, one-off toast inside a `ToastProvider`.
 */
export function Toast({
  title,
  description,
  tone = 'default',
  action,
  onDismiss,
  onOpenChange,
  className,
  ...props
}: ToastProps) {
  const Icon = TONE_ICON[tone];
  return (
    <ToastPrimitive.Root
      type={tone === 'critical' ? 'foreground' : 'background'}
      data-tone={tone}
      onOpenChange={(open) => {
        onOpenChange?.(open);
        if (!open) onDismiss?.();
      }}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-lg py-3 pl-4 pr-2 shadow-lg',
        'animate-toast-in data-[state=closed]:animate-fade-out',
        'data-[swipe=move]:translate-y-(--radix-toast-swipe-move-y) data-[swipe=cancel]:translate-y-0',
        'data-[swipe=cancel]:transition-transform data-[swipe=end]:animate-fade-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {Icon ? <Icon aria-hidden className="mt-0.5 size-5 shrink-0" /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-0.5">
        <ToastPrimitive.Title className="text-md font-medium [overflow-wrap:anywhere]">{title}</ToastPrimitive.Title>
        {description ? (
          <ToastPrimitive.Description className="text-sm opacity-85 [overflow-wrap:anywhere]">
            {description}
          </ToastPrimitive.Description>
        ) : null}
      </div>
      {action ? (
        <ToastPrimitive.Action altText={action.altText} asChild>
          <button
            type="button"
            onClick={action.onAction}
            className={cn(
              'h-control-sm shrink-0 rounded-md border border-current/40 px-2.5 text-sm font-semibold',
              'hover:bg-current/10 active:bg-current/20',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            )}
          >
            {action.label}
          </button>
        </ToastPrimitive.Action>
      ) : null}
      <ToastPrimitive.Close asChild>
        <button
          type="button"
          aria-label="Dismiss notification"
          title="Dismiss"
          className={cn(
            'inline-flex size-control-sm shrink-0 items-center justify-center rounded-md opacity-80',
            'hover:bg-current/10 hover:opacity-100',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          )}
        >
          <X aria-hidden className="size-4" />
        </button>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

export type ToasterProps = ComponentPropsWithRef<typeof ToastPrimitive.Viewport>;

/**
 * The on-screen region toasts appear in: bottom-centre, above everything
 * else. Rendered by `ToastProvider` unless `withToaster={false}`.
 */
export function Toaster({ className, ...props }: ToasterProps) {
  const context = useContext(ToastContext);
  if (!context) throw new Error('<Toaster /> must be used inside <ToastProvider>.');
  const { toasts, dismiss } = context;

  return (
    <>
      {toasts.map(({ id, open, duration, ...options }) => (
        <Toast
          key={id}
          {...options}
          open={open}
          duration={duration}
          onOpenChange={(next) => {
            if (!next) dismiss(id);
          }}
        />
      ))}
      <ToastPrimitive.Viewport
        className={cn(
          'fixed bottom-0 left-1/2 z-(--a-z-index-toast) m-0 flex w-full max-w-md -translate-x-1/2 list-none flex-col gap-2 p-4 outline-none',
          'pointer-events-none',
          className,
        )}
        {...props}
      />
    </>
  );
}
