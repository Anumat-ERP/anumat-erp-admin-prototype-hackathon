import { Button, PageHeader, SearchField, Select, Text } from '@repo/ui';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { Time } from '../components/Time';
import { Sparkline, WorkspaceStatusDot, table } from '../components/ui';
import { PLAN_LABEL, attentionReasons, requests30d, useStore } from '../data/store';
import type { Deployment, Plan, Workspace, WorkspaceStatus } from '../data/types';
import { daysUntil, formatHours } from '../lib/format';

export const DEPLOYMENT_LABEL: Record<Deployment, string> = { cloud: 'Anumat Cloud', 'own-cloud': 'Own cloud', 'on-premise': 'On-premise' };

type Sort = 'attention' | 'requests' | 'newest' | 'name';

export function Workspaces() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const status = (params.get('status') ?? '') as WorkspaceStatus | '';
  const plan = (params.get('plan') ?? '') as Plan | '';
  const onlyAttention = params.get('filter') === 'attention';
  const sort = (params.get('sort') ?? 'attention') as Sort;
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const rows = state.workspaces
    .map((w) => ({ w, reasons: attentionReasons(state, w) }))
    .filter(({ w, reasons }) => {
      if (status && w.status !== status) return false;
      if (plan && w.plan !== plan) return false;
      if (onlyAttention && !reasons.length) return false;
      if (q) {
        const hay = `${w.name} ${w.industry} ${w.city} ${w.members.map((m) => `${m.name} ${m.email}`).join(' ')}`.toLowerCase();
        if (!q.toLowerCase().split(/\s+/).every((word) => hay.includes(word))) return false;
      }
      return true;
    })
    .sort((a, b) =>
      sort === 'requests'
        ? requests30d(b.w) - requests30d(a.w)
        : sort === 'newest'
          ? b.w.createdAt.localeCompare(a.w.createdAt)
          : sort === 'name'
            ? a.w.name.localeCompare(b.w.name)
            : b.reasons.length - a.reasons.length || requests30d(b.w) - requests30d(a.w),
    );
  const filtered = Boolean(q || status || plan || onlyAttention);

  const planCell = (w: Workspace) => (
    <span className="flex flex-col">
      {PLAN_LABEL[w.plan]}
      {w.plan === 'pilot' && w.pilotEndsAt ? (
        <span className={daysUntil(w.pilotEndsAt) <= 14 ? 'text-sm text-warning-subtle-fg' : 'text-sm text-fg-subtle'}>
          ends in {Math.max(0, daysUntil(w.pilotEndsAt))} days
        </span>
      ) : null}
    </span>
  );

  return (
    <>
      <PageHeader title="Workspaces" subtitle="Every customer company, how they use Anumat, and what needs a look." />

      <div className="flex flex-wrap items-end gap-3">
        <SearchField
          label="Search workspaces"
          labelHidden
          placeholder="Name, city, member or email"
          value={q}
          onChange={(v) => set('q', v)}
          onClear={() => set('q', '')}
          className="w-full sm:w-72"
        />
        <Select
          aria-label="Status"
          value={status}
          onChange={(e) => set('status', e.target.value)}
          options={[
            { value: '', label: 'Any status' },
            { value: 'onboarding', label: 'Onboarding' },
            { value: 'active', label: 'Active' },
            { value: 'at-risk', label: 'At risk' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'churned', label: 'Churned' },
          ]}
          className="w-40"
        />
        <Select
          aria-label="Plan"
          value={plan}
          onChange={(e) => set('plan', e.target.value)}
          options={[{ value: '', label: 'Any plan' }, ...(Object.keys(PLAN_LABEL) as Plan[]).map((p) => ({ value: p, label: PLAN_LABEL[p] }))]}
          className="w-36"
        />
        <Select
          aria-label="Sort by"
          value={sort}
          onChange={(e) => set('sort', e.target.value === 'attention' ? '' : e.target.value)}
          options={[
            { value: 'attention', label: 'Needs attention first' },
            { value: 'requests', label: 'Most requests' },
            { value: 'newest', label: 'Newest' },
            { value: 'name', label: 'Name' },
          ]}
          className="w-52"
        />
        <Button variant={onlyAttention ? 'primary' : 'secondary'} aria-pressed={onlyAttention} onClick={() => set('filter', onlyAttention ? '' : 'attention')}>
          Needs attention
        </Button>
        {filtered ? (
          <Button variant="plain" onClick={() => setParams({}, { replace: true })}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <Text variant="bodySm" tone="muted" aria-live="polite">
        {rows.length} of {state.workspaces.length} workspaces
      </Text>

      {/* Phones: one card per workspace. */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map(({ w, reasons }) => (
          <li key={w.id}>
            <Link to={`/workspaces/${w.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 active:bg-surface-hover">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-medium text-fg">{w.name}</span>
                <span className="flex flex-wrap items-center gap-x-3 text-sm text-fg-muted">
                  <WorkspaceStatusDot status={w.status} /> {PLAN_LABEL[w.plan]} · {requests30d(w)} requests / 30 d
                </span>
                {reasons.length ? <span className="text-sm text-warning-subtle-fg">{reasons[0]}</span> : null}
              </span>
              <ChevronRight aria-hidden className="size-4 text-fg-subtle" />
            </Link>
          </li>
        ))}
      </ul>

      <div className={`${table.wrap} hidden md:block`}>
        <table className={table.table}>
          <caption className="sr-only">Workspaces</caption>
          <thead>
            <tr>
              <th className={table.th}>Workspace</th>
              <th className={table.th}>Status</th>
              <th className={table.th}>Plan</th>
              <th className={`${table.th} text-end`}>Active, 7 d</th>
              <th className={`${table.th} text-end`}>Requests, 30 d</th>
              <th className={`${table.th} text-end`}>Median decision</th>
              <th className={table.th}>Last active</th>
              <th className={table.th}>
                <span className="sr-only">Attention</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ w, reasons }) => (
              <tr key={w.id} className={table.row}>
                <td className={table.td}>
                  <Link to={`/workspaces/${w.id}`} className="font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                    {w.name}
                  </Link>
                  <div className="text-sm text-fg-subtle">
                    {w.industry} · {w.city} · {DEPLOYMENT_LABEL[w.deployment]}
                  </div>
                </td>
                <td className={table.td}>
                  <WorkspaceStatusDot status={w.status} />
                </td>
                <td className={table.td}>{planCell(w)}</td>
                <td className={`${table.td} text-end tabular-nums`}>
                  {w.activeUsers7d}
                  <span className="text-fg-subtle"> / {w.memberCount}</span>
                </td>
                <td className={`${table.td} text-end`}>
                  <span className="inline-flex items-center gap-3">
                    <Sparkline values={w.weekly} label={`Requests per week: ${w.weekly.join(', ')}`} />
                    <span className="w-8 tabular-nums">{requests30d(w)}</span>
                  </span>
                </td>
                <td className={`${table.td} text-end tabular-nums`}>{formatHours(w.medianHours)}</td>
                <td className={`${table.td} whitespace-nowrap text-fg-muted`}>
                  <Time iso={w.lastActiveAt} />
                </td>
                <td className={table.td}>
                  {reasons.length ? (
                    <span className="inline-flex items-center gap-1 text-sm text-warning-subtle-fg" title={reasons.join('\n')}>
                      <AlertTriangle aria-hidden className="size-4" />
                      <span className="sr-only">Needs attention: {reasons.join('; ')}</span>
                      <span aria-hidden>{reasons.length}</span>
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-fg-muted">
                  No workspaces match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
