'use client';

import { Menu } from 'lucide-react';
import { useState, type ComponentPropsWithRef, type MouseEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { IconButton } from './button';
import { DrawerBody, DrawerContent, DrawerHeader, DrawerRoot } from './drawer';

export interface AppShellProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Content of the top bar after the menu button: logo, search, account menu. */
  topBar?: ReactNode;
  /** The sidebar content, usually `<Navigation />`. Rendered in the sidebar at md and up, and in a drawer below. */
  navigation?: ReactNode;
  /** The page. Rendered inside `<main>`. */
  children?: ReactNode;
  /** `id` of `<main>`, the skip link’s target. */
  mainId?: string;
  /** Text of the skip link, the first focusable element on the page. */
  skipLinkLabel?: string;
  /** Title of the mobile navigation drawer (visually hidden; its accessible name). */
  navigationLabel?: string;
  /** Controlled open state of the mobile navigation drawer. */
  navigationOpen?: boolean;
  /** Called when the mobile navigation drawer opens or closes. */
  onNavigationOpenChange?: (open: boolean) => void;
  /** Classes for `<main>`, e.g. to change its padding or max width. */
  mainClassName?: string;
}

/**
 * The application frame: a top bar, a sidebar with the primary navigation
 * and a main region, with a “Skip to content” link first in the tab order.
 * Below the `md` breakpoint the sidebar moves into a drawer opened from a
 * menu button in the top bar; following a link closes it.
 *
 * Use once, at the root of the app’s authenticated layout. Don’t nest it,
 * and don’t use it for marketing or auth pages — they have no sidebar.
 */
export function AppShell({
  topBar,
  navigation,
  children,
  mainId = 'main-content',
  skipLinkLabel = 'Skip to content',
  navigationLabel = 'Navigation',
  navigationOpen,
  onNavigationOpenChange,
  mainClassName,
  className,
  ...props
}: AppShellProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = navigationOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (navigationOpen === undefined) setInternalOpen(next);
    onNavigationOpenChange?.(next);
  };

  // Close the mobile drawer when a link inside it is followed.
  const closeOnNavigate = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement).closest('a[href]');
    if (link && link.getAttribute('aria-disabled') !== 'true') setOpen(false);
  };

  return (
    <div className={cn('flex min-h-dvh flex-col bg-bg text-fg', className)} {...props}>
      <a
        href={`#${mainId}`}
        className={cn(
          'sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-(--a-z-index-toast)',
          'focus:rounded-md focus:border focus:border-border focus:bg-surface focus:px-3 focus:py-2 focus:text-md focus:font-medium focus:text-fg focus:shadow-md',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        )}
      >
        {skipLinkLabel}
      </a>

      <header className="sticky top-0 z-(--a-z-index-sticky) flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 md:px-4">
        {navigation ? (
          <IconButton
            icon={<Menu />}
            label="Open navigation"
            className="md:hidden"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          />
        ) : null}
        <div className="flex min-w-0 flex-1 items-center gap-3">{topBar}</div>
      </header>

      <div className="flex flex-1">
        {navigation ? (
          <aside
            aria-label={navigationLabel}
            className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-border bg-surface md:block"
          >
            {navigation}
          </aside>
        ) : null}
        <main
          id={mainId}
          tabIndex={-1}
          className={cn('min-w-0 flex-1 p-4 outline-none md:p-6', mainClassName)}
        >
          {children}
        </main>
      </div>

      {navigation ? (
        <DrawerRoot open={open} onOpenChange={setOpen}>
          <DrawerContent side="left" size="sm" aria-describedby={undefined}>
            <DrawerHeader title={navigationLabel} hideTitle />
            <DrawerBody className="p-0" onClick={closeOnNavigate}>
              {navigation}
            </DrawerBody>
          </DrawerContent>
        </DrawerRoot>
      ) : null}
    </div>
  );
}
