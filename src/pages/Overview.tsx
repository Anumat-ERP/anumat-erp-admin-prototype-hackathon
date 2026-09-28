import { Card, CardHeader, PageHeader, Text } from '@repo/ui';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { BarTable, ColumnChart } from '../components/charts';
import { AppLink } from '../components/links';
import { Time } from '../components/Time';
import { Dot, Stat, WorkspaceStatusDot } from '../components/ui';
import { STAGE_LABEL, attentionReasons, nps, requests30d, useStore } from '../data/store';
import type { LeadStage } from '../data/types';
import { formatHours, formatNumber, formatShortDate } from '../lib/format';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function Overview() {
  const { state, me, staff } = useStore();
  const live = state.workspaces.filter((w) => w.status !== 'churned' && w.status !== 'suspended');
  const wau = live.reduce((a, w) => a + w.activeUsers7d, 0);
  const seats = live.reduce((a, w) => a + w.memberCount, 0);
  const req30 = state.workspaces.reduce((a, w) => a + requests30d(w), 0);
  const reqPrev = state.workspaces.reduce((a, w) => a + w.weekly.slice(0, 4).reduce((x, y) => x + y, 0), 0);
  const change = reqPrev ? Math.round(((req30 - reqPrev) / reqPrev) * 100) : 0;
  const withTime = live.filter((w) => w.medianHours > 0);
  const median = withTime.reduce((a, w) => a + w.medianHours * requests30d(w), 0) / Math.max(1, withTime.reduce((a, w) => a + requests30d(w), 0));
  const scores = state.feedback.filter((f) => f.kind === 'survey' && f.score !== undefined).map((f) => f.score as number);
  const score = nps(scores);
  const attention = state.workspaces
    .map((w) => ({ w, reasons: attentionReasons(state, w) }))
    .filter((x) => x.reasons.length)
    .sort((a, b) => b.reasons.length - a.reasons.length);

  // Requests per week across every workspace, last 8 weeks.
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const total = state.workspaces.reduce((a, w) => a + (w.weekly[i] ?? 0), 0);
    const start = new Date();
    start.setDate(start.getDate() - (7 - i) * 7);
    return { label: `${start.getDate()}/${start.getMonth() + 1}`, value: total, detail: `Week of ${formatShortDate(start.toISOString())}: ${total} requests` };
  });

  const stages: LeadStage[] = ['new', 'contacted', 'demo', 'pilot', 'won'];
  const pipelineMax = Math.max(1, ...stages.map((s) => state.leads.filter((l) => l.stage === s).length));
  const issues = state.services.filter((s) => s.status !== 'operational');

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${me.name.split(' ')[0]}`}
        subtitle={`${live.length} live workspaces · ${attention.length ? `${attention.length} need attention` : 'nothing needs attention'}`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Live workspaces" value={live.length} hint={`${state.workspaces.length} in total`} />
        <Stat label="Active people, 7 days" value={formatNumber(wau)} hint={`of ${seats} members`} />
        <Stat
          label="Requests, 30 days"
          value={formatNumber(req30)}
          hint={`${change >= 0 ? '+' : ''}${change}% on the 30 days before`}
        />
        <Stat label="Median time to decision" value={formatHours(median)} hint="Weighted by requests" />
        <Stat
          label="Recommend score"
          value={score === null ? '—' : `${score > 0 ? '+' : ''}${score}`}
          hint={`${scores.length} answers, −100 to +100`}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card flush>
          <div className="p-4 pb-2">
            <CardHeader
              title="Needs attention"
              description="Quiet workspaces, pilots about to end, failed messages and open problems."
              actions={<AppLink to="/workspaces?filter=attention">All</AppLink>}
            />
          </div>
          {attention.length ? (
            <ul className="divide-y divide-border-subtle">
              {attention.slice(0, 6).map(({ w, reasons }) => (
                <li key={w.id}>
                  <Link
                    to={`/workspaces/${w.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-medium text-fg">{w.name}</span>
                        <WorkspaceStatusDot status={w.status} />
                      </span>
                      <span className="text-sm text-fg-muted">{reasons.join(' · ')}</span>
                    </span>
                    <ChevronRight aria-hidden className="size-4 text-fg-subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Text tone="muted" className="p-4">
              Nothing needs attention.
            </Text>
          )}
        </Card>

        <Card>
          <CardHeader title="Requests per week" description="Submitted across all workspaces, last 8 weeks." />
          <div className="mt-4">
            <ColumnChart caption="Requests submitted per week, all workspaces" points={weeks} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Sales pipeline" actions={<AppLink to="/leads">Leads</AppLink>} />
          <div className="mt-3">
            <BarTable
              caption="Leads by stage"
              valueHeader="Leads"
              max={pipelineMax}
              rows={stages.map((s) => {
                const n = state.leads.filter((l) => l.stage === s).length;
                return { id: s, label: STAGE_LABEL[s], segments: [{ value: n, color: 'var(--an-chart-1)', label: STAGE_LABEL[s] }], display: String(n), detail: `${STAGE_LABEL[s]}: ${n}` };
              })}
            />
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <CardHeader title="System" actions={<AppLink to="/system">Details</AppLink>} />
          {issues.length ? (
            <ul className="flex flex-col gap-2">
              {issues.map((s) => (
                <li key={s.id} className="flex flex-col gap-0.5">
                  <Dot tone={s.status === 'down' ? 'bg-critical' : 'bg-warning'}>
                    {s.name} · {s.status === 'down' ? 'Down' : 'Degraded'}
                  </Dot>
                  {s.note ? <Text variant="bodySm" tone="muted" className="ps-3.5">{s.note}</Text> : null}
                </li>
              ))}
            </ul>
          ) : null}
          <Dot tone="bg-success">
            {state.services.length - issues.length} of {state.services.length} services operational
          </Dot>
          <Text variant="bodySm" tone="muted">
            {state.deliveries.filter((d) => d.status === 'failed').length} failed and {state.deliveries.filter((d) => d.status === 'retrying').length} retrying
            messages.
          </Text>
        </Card>

        <Card className="flex flex-col gap-3">
          <CardHeader title="Recent staff activity" actions={<AppLink to="/audit">Audit log</AppLink>} />
          <ol className="flex flex-col gap-2.5">
            {state.audit.slice(0, 5).map((a) => (
              <li key={a.id} className="flex flex-col text-md">
                <span>
                  <span className="font-medium">{staff(a.staffId).name.split(' ')[0]}</span> {a.action.charAt(0).toLowerCase() + a.action.slice(1)} ·{' '}
                  <span className="text-fg-muted">{a.target}</span>
                </span>
                <Time iso={a.at} className="text-sm text-fg-subtle" />
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
