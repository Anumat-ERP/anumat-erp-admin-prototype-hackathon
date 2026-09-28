import { Button, Card, PageHeader, Select, Tabs, TabsContent, TabsList, TabsTrigger, Text, useToast } from '@repo/ui';
import { Link } from 'react-router';
import { BarTable } from '../components/charts';
import { Time } from '../components/Time';
import { Dot, Stat } from '../components/ui';
import { nps, useStore } from '../data/store';
import type { FeedbackItem } from '../data/types';
import { Changed } from '../lib/motion';

const PROBLEM: Record<NonNullable<FeedbackItem['status']>, { label: string; dot: string }> = {
  open: { label: 'Open', dot: 'bg-critical' },
  'in-progress': { label: 'In progress', dot: 'bg-warning' },
  resolved: { label: 'Resolved', dot: 'bg-success' },
};

export function Feedback() {
  const { state, staff, workspace, dispatch } = useStore();
  const { toast } = useToast();
  const surveys = state.feedback.filter((f) => f.kind === 'survey' && f.score !== undefined).sort((a, b) => b.at.localeCompare(a.at));
  const scores = surveys.map((f) => f.score as number);
  const score = nps(scores);
  const promoters = scores.filter((s) => s >= 9).length;
  const passives = scores.filter((s) => s >= 7 && s <= 8).length;
  const detractors = scores.filter((s) => s <= 6).length;
  const order = { open: 0, 'in-progress': 1, resolved: 2 } as const;
  const problems = state.feedback
    .filter((f) => f.kind === 'problem')
    .sort((a, b) => order[a.status ?? 'open'] - order[b.status ?? 'open'] || b.at.localeCompare(a.at));
  const ideas = state.feedback.filter((f) => f.kind === 'feedback').sort((a, b) => b.at.localeCompare(a.at));
  const open = problems.filter((p) => p.status === 'open').length;

  const wsLink = (id: string) => (
    <Link to={`/workspaces/${id}`} className="text-fg-link hover:underline">
      {workspace(id)?.name ?? id}
    </Link>
  );

  return (
    <>
      <PageHeader title="Feedback" subtitle="What customers tell us inside Anumat: survey scores, suggestions and problem reports." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Recommend score" value={score === null ? '—' : `${score > 0 ? '+' : ''}${score}`} hint="% 9–10 minus % 0–6" />
        <Stat label="Survey answers" value={scores.length} hint="Last 30 days" />
        <Stat label="Open problems" value={open} hint={`${problems.length} reported in total`} />
        <Stat label="Suggestions" value={ideas.length} hint="Waiting for the roadmap review" />
      </div>

      <Tabs defaultValue="problems">
        <TabsList aria-label="Feedback">
          <TabsTrigger value="problems" badge={open || undefined}>
            Problem reports
          </TabsTrigger>
          <TabsTrigger value="scores">Survey answers</TabsTrigger>
          <TabsTrigger value="ideas">Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="pt-4">
          <ul className="flex flex-col gap-3">
            {problems.map((p) => {
              const s = PROBLEM[p.status ?? 'open'];
              return (
                <li key={p.id}>
                  <Card className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
                        <Changed value={p.status} className="-mx-1 px-1"><Dot tone={s.dot}>{s.label}</Dot></Changed>
                        {wsLink(p.workspaceId)} · {p.person} · <Time iso={p.at} />
                      </span>
                      <Text>{p.text}</Text>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Select
                        size="sm"
                        aria-label="Assigned to"
                        value={p.assigneeId ?? ''}
                        placeholder="Unassigned"
                        onChange={(e) => dispatch({ type: 'assignProblem', feedbackId: p.id, staffId: e.target.value })}
                        options={state.staff.map((m) => ({ value: m.id, label: m.name }))}
                        className="w-40"
                      />
                      {p.status === 'open' ? (
                        <Button size="sm" onClick={() => (dispatch({ type: 'setProblem', feedbackId: p.id, status: 'in-progress' }), toast({ title: 'You took it' }))}>
                          Take it
                        </Button>
                      ) : null}
                      {p.status !== 'resolved' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => (dispatch({ type: 'setProblem', feedbackId: p.id, status: 'resolved' }), toast({ tone: 'success', title: 'Marked resolved', description: `${p.person} gets a reply in the app.` }))}
                        >
                          Resolve
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => dispatch({ type: 'setProblem', feedbackId: p.id, status: 'open' })}>
                          Reopen
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
          {problems.some((p) => p.assigneeId) ? (
            <Text variant="bodySm" tone="muted" className="mt-3">
              Assigned: {[...new Set(problems.filter((p) => p.assigneeId && p.status !== 'resolved').map((p) => staff(p.assigneeId).name))].join(', ') || 'nobody'}.
            </Text>
          ) : null}
        </TabsContent>

        <TabsContent value="scores" className="pt-4">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Card>
              <BarTable
                caption="Survey answers by group"
                valueHeader="People"
                max={Math.max(1, scores.length)}
                rows={[
                  { id: 'p', label: 'Promoters (9–10)', segments: [{ value: promoters, color: 'var(--an-chart-1)', label: 'Promoters' }], display: String(promoters) },
                  { id: 's', label: 'Passives (7–8)', segments: [{ value: passives, color: 'var(--an-chart-1)', label: 'Passives' }], display: String(passives) },
                  { id: 'd', label: 'Detractors (0–6)', segments: [{ value: detractors, color: 'var(--an-chart-1)', label: 'Detractors' }], display: String(detractors) },
                ]}
              />
            </Card>
            <Card flush>
              <ul className="divide-y divide-border-subtle">
                {surveys.map((f) => (
                  <li key={f.id} className="flex gap-4 p-4">
                    <span className="w-10 shrink-0 text-lg font-semibold tabular-nums">{f.score}</span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm text-fg-muted">
                        {wsLink(f.workspaceId)} · {f.person} · <Time iso={f.at} />
                      </span>
                      {f.text ? <span>{f.text}</span> : <span className="text-fg-subtle">No comment</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ideas" className="pt-4">
          <Card flush>
            <ul className="divide-y divide-border-subtle">
              {ideas.map((f) => (
                <li key={f.id} className="flex flex-col gap-0.5 p-4">
                  <span className="text-sm text-fg-muted">
                    {wsLink(f.workspaceId)} · {f.person} · <Time iso={f.at} />
                  </span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
