import { ActionMenu, AppShell, Avatar, Badge, IconButton, KbdShortcut, Navigation, useToast, type NavigationSection } from '@repo/ui';
import { Activity, Building2, Check, LayoutDashboard, MessageSquareText, Moon, RotateCcw, ScrollText, Search, Sun, Target, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { CommandPalette, commandKey } from '../components/CommandPalette';
import { Logo } from '../components/Logo';
import { navLink } from '../components/links';
import { attentionReasons, useStore } from '../data/store';

type Theme = 'light' | 'dark';
const ROLE = { owner: 'Owner', support: 'Support', sales: 'Sales', engineer: 'Engineer' } as const;

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('anumat-theme', theme);
    } catch {
      // Theme still applies for this visit.
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

export function Shell() {
  const { state, me, dispatch } = useStore();
  const { pathname } = useLocation();
  const { toast } = useToast();
  const [theme, setTheme] = useTheme();
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearching((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const at = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
  const attention = state.workspaces.filter((w) => attentionReasons(state, w).length).length;
  const newLeads = state.leads.filter((l) => l.stage === 'new').length;
  const openProblems = state.feedback.filter((f) => f.kind === 'problem' && f.status === 'open').length;
  const failing = state.deliveries.filter((d) => d.status === 'failed').length + state.services.filter((s) => s.status !== 'operational').length;

  const sections: NavigationSection[] = [
    { items: [{ label: 'Overview', href: '/', icon: <LayoutDashboard />, selected: at('/') }] },
    {
      title: 'Customers',
      items: [
        {
          label: 'Workspaces',
          href: '/workspaces',
          icon: <Building2 />,
          selected: at('/workspaces'),
          badge: attention || undefined,
          badgeLabel: `${attention} need attention`,
        },
        { label: 'Leads', href: '/leads', icon: <Target />, selected: at('/leads'), badge: newLeads || undefined, badgeLabel: `${newLeads} new leads` },
        {
          label: 'Feedback',
          href: '/feedback',
          icon: <MessageSquareText />,
          selected: at('/feedback'),
          badge: openProblems || undefined,
          badgeLabel: `${openProblems} open problem reports`,
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'System', href: '/system', icon: <Activity />, selected: at('/system'), badge: failing || undefined, badgeLabel: `${failing} issues` },
        { label: 'Audit log', href: '/audit', icon: <ScrollText />, selected: at('/audit') },
        { label: 'Staff', href: '/staff', icon: <UsersRound />, selected: at('/staff') },
      ],
    },
  ];

  const topBar = (
    <>
      <Link to="/" className="flex shrink-0 items-center gap-2 rounded-md text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <Logo className="h-7 w-auto" />
      </Link>
      <Badge tone="neutral" size="sm" className="hidden sm:inline-flex">
        Console · staff only
      </Badge>
      <button
        type="button"
        onClick={() => setSearching(true)}
        aria-keyshortcuts="Meta+K Control+K"
        className="ms-auto hidden h-8 w-full max-w-80 items-center gap-2 rounded-md border border-border-input/60 bg-surface px-2.5 text-start text-md text-fg-subtle hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex"
      >
        <Search aria-hidden className="size-4" />
        <span className="flex-1">Search workspaces, leads…</span>
        <KbdShortcut size="sm" keys={[commandKey, 'K']} />
      </button>
      <IconButton icon={<Search />} label="Search" className="ms-auto sm:hidden" onClick={() => setSearching(true)} />
      <IconButton
        icon={theme === 'dark' ? <Sun /> : <Moon />}
        label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
      <ActionMenu
        align="end"
        trigger={
          <button
            type="button"
            aria-label={`Signed in as ${me.name}, ${ROLE[me.role]}. Switch staff member.`}
            className="flex items-center gap-2 rounded-full py-0.5 ps-0.5 pe-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Avatar name={me.name} size="sm" decorative />
            <span className="hidden flex-col text-start leading-tight lg:flex">
              <span className="text-sm font-medium text-fg">{me.name}</span>
              <span className="text-xs text-fg-muted">{ROLE[me.role]}</span>
            </span>
          </button>
        }
        sections={[
          {
            title: 'Signed in as (demo)',
            items: state.staff.map((s) => ({
              content: s.name,
              helpText: ROLE[s.role],
              icon: s.id === me.id ? <Check /> : undefined,
              onAction: () => {
                dispatch({ type: 'switchStaff', staffId: s.id });
                toast({ title: `Now signed in as ${s.name}`, description: ROLE[s.role] });
              },
            })),
          },
          {
            items: [
              {
                content: 'Reset demo data',
                icon: <RotateCcw />,
                helpText: 'Undo everything changed in this console.',
                onAction: () => {
                  dispatch({ type: 'reset' });
                  toast({ title: 'Demo data reset' });
                },
              },
            ],
          },
        ]}
      />
    </>
  );

  return (
    <AppShell topBar={topBar} navigation={<Navigation sections={sections} renderLink={navLink} />} mainClassName="md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Outlet />
      </div>
      <CommandPalette open={searching} onOpenChange={setSearching} />
    </AppShell>
  );
}
