import type { NavigationLinkProps, PageHeaderRenderLinkProps } from '@repo/ui';
import { Link as UiLink } from '@repo/ui';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

/** Navigation items rendered as router links (keeps the GitHub Pages base path). */
export function navLink({ href, ...props }: NavigationLinkProps) {
  if (props.target === '_blank') return <a href={href} {...props} />;
  return <Link to={href} {...props} />;
}

/** PageHeader back links rendered as router links. */
export function headerLink({ href, ...props }: PageHeaderRenderLinkProps) {
  return <Link to={href} {...props} />;
}

/** A design-system Link that navigates with the router. */
export function AppLink({ to, children, tone }: { to: string; children: ReactNode; tone?: 'default' | 'muted' }) {
  return (
    <UiLink asChild tone={tone}>
      <Link to={to}>{children}</Link>
    </UiLink>
  );
}
