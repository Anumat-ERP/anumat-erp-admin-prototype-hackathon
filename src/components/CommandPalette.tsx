import { Kbd, Modal, cn } from '@repo/ui';
import { ArrowRight, Building2, CornerDownLeft, Search, Target, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../data/store';

interface Item {
  id: string;
  group: 'Go to' | 'Workspaces' | 'Leads' | 'Staff';
  label: string;
  hint?: string;
  href: string;
  icon: ReactNode;
  /** Extra words that should match, e.g. the request ID. */
  keywords?: string;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const commandKey = isMac ? '⌘' : 'Ctrl';

/**
 * Search or jump anywhere: pages, workspaces (and their members), leads and staff.
 * Opens with ⌘K / Ctrl+K from anywhere, or the search button in the top bar.
 * A combobox: arrow keys move, Enter opens, Escape closes.
 */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { state } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo<Item[]>(() => {
    const go = (label: string, href: string, keywords = ''): Item => ({ id: `go-${href}`, group: 'Go to', label, href, icon: <ArrowRight />, keywords });
    return [
      go('Overview', '/', 'home dashboard'),
      go('Workspaces', '/workspaces', 'customers companies'),
      go('Leads', '/leads', 'sales pipeline enquiries'),
      go('Feedback', '/feedback', 'nps problems survey'),
      go('System', '/system', 'status deliveries email telegram'),
      go('Audit log', '/audit', 'history'),
      go('Staff', '/staff', 'team roles'),
      ...state.workspaces.map((w) => ({
        id: `w-${w.id}`,
        group: 'Workspaces' as const,
        label: w.name,
        hint: `${w.city} · ${w.plan}`,
        href: `/workspaces/${w.id}`,
        icon: <Building2 />,
        keywords: `${w.industry} ${w.members.map((m) => `${m.name} ${m.email}`).join(' ')}`,
      })),
      ...state.leads.map((l) => ({
        id: `l-${l.id}`,
        group: 'Leads' as const,
        label: l.company,
        hint: l.contact,
        href: `/leads/${l.id}`,
        icon: <Target />,
        keywords: `${l.email} ${l.stage}`,
      })),
      ...state.staff.map((m) => ({ id: `s-${m.id}`, group: 'Staff' as const, label: m.name, hint: m.role, href: '/staff', icon: <User /> })),
    ];
  }, [state]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return items.filter((i) => i.group === 'Go to');
    const words = q.split(/\s+/);
    const found = items.filter((i) => {
      const hay = `${i.label} ${i.hint ?? ''} ${i.keywords ?? ''}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    // At most 6 per group, so one long list can't bury the rest.
    const perGroup = new Map<string, number>();
    return found.filter((i) => {
      const n = (perGroup.get(i.group) ?? 0) + 1;
      perGroup.set(i.group, n);
      return n <= 6;
    });
  }, [items, q]);

  useEffect(() => setActive(0), [q, open]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (item: Item | undefined) => {
    if (!item) return;
    onOpenChange(false);
    setQuery('');
    navigate(item.href);
  };

  let lastGroup = '';
  return (
    <Modal open={open} onOpenChange={(o) => (onOpenChange(o), o ? undefined : setQuery(''))} title="Search" hideTitle size="md">
      <div className="-m-2 flex flex-col">
        <div className="flex items-center gap-2 border-b border-border px-2 pb-3">
          <Search aria-hidden className="size-4 shrink-0 text-fg-muted" />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
            aria-label="Search pages, workspaces, members, leads and staff"
            placeholder="Search or jump to…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(results.length - 1, a + 1)));
              else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(0, a - 1)));
              else if (e.key === 'Enter') (e.preventDefault(), choose(results[active]));
            }}
            className="h-9 min-w-0 flex-1 bg-transparent text-md text-fg outline-none placeholder:text-fg-subtle"
          />
        </div>
        <ul id="command-list" role="listbox" aria-label="Results" ref={listRef} className="max-h-[min(24rem,60vh)] overflow-y-auto py-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-md text-fg-muted" role="presentation">
              Nothing matches “{query}”.
            </li>
          ) : null}
          {results.map((item, i) => {
            const heading = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.id} role="presentation">
                {heading ? (
                  <div role="presentation" className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-fg-subtle uppercase">
                    {heading}
                  </div>
                ) : null}
                <div
                  id={`cmd-${item.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => choose(item)}
                  className={cn(
                    'mx-1 flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-md',
                    i === active ? 'bg-surface-selected text-fg' : 'text-fg',
                  )}
                >
                  <span aria-hidden className="text-fg-muted [&_svg]:size-4">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint ? <span className="shrink-0 font-mono text-xs text-fg-subtle">{item.hint}</span> : null}
                  {i === active ? <CornerDownLeft aria-hidden className="size-3.5 shrink-0 text-fg-subtle" /> : null}
                </div>
              </li>
            );
          })}
        </ul>
        <div aria-hidden className="flex items-center gap-4 border-t border-border px-3 pt-3 text-xs text-fg-subtle">
          <span className="inline-flex items-center gap-1">
            <Kbd size="sm">↑</Kbd>
            <Kbd size="sm">↓</Kbd> move
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd size="sm">↵</Kbd> open
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd size="sm">Esc</Kbd> close
          </span>
        </div>
      </div>
    </Modal>
  );
}
