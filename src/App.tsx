import { Button, EmptyState } from '@repo/ui';
import { Fragment, useEffect, type ReactNode } from 'react';
import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { Shell } from './layout/Shell';
import { Audit } from './pages/Audit';
import { Feedback } from './pages/Feedback';
import { LeadDetail, Leads } from './pages/Leads';
import { Overview } from './pages/Overview';
import { Staff } from './pages/Staff';
import { System } from './pages/System';
import { WorkspaceDetail } from './pages/WorkspaceDetail';
import { Workspaces } from './pages/Workspaces';

/** Move focus to the main region on navigation, so screen readers start at the new page. */
function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

/** Remounts a detail page when its :id changes, so nothing from the previous item carries over. */
function Keyed({ children }: { children: ReactNode }) {
  const { id } = useParams();
  return <Fragment key={id}>{children}</Fragment>;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <EmptyState heading="Page not found" action={<Button onClick={() => navigate('/')}>Go to Overview</Button>}>
      The link may be wrong, or the page has moved.
    </EmptyState>
  );
}

export function App() {
  return (
    <>
      <RouteFocus />
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Overview />} />
          <Route path="workspaces" element={<Workspaces />} />
          <Route path="workspaces/:id" element={<Keyed><WorkspaceDetail /></Keyed>} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<Keyed><LeadDetail /></Keyed>} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="system" element={<System />} />
          <Route path="audit" element={<Audit />} />
          <Route path="staff" element={<Staff />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
