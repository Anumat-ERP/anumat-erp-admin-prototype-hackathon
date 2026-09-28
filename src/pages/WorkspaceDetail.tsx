import {
  Avatar,
  Banner,
  Button,
  Card,
  CardHeader,
  DescriptionList,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  RadioGroup,
  RadioGroupItem,
  Select,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
  useToast,
} from '@repo/ui';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ColumnChart } from '../components/charts';
import { headerLink } from '../components/links';
import { Time } from '../components/Time';
import { Dot, Stat, WorkspaceStatusDot, table } from '../components/ui';
import { FLAG_LABEL, PLAN_LABEL, STAGE_LABEL, attentionReasons, requests30d, useStore } from '../data/store';
import type { Flag, Plan } from '../data/types';
import { daysUntil, formatDate, formatHours, formatShortDate } from '../lib/format';
import { DEPLOYMENT_LABEL } from './Workspaces';

const FLAG_HELP: Record<Flag, string> = {
  telegram: 'People can connect Telegram and approve from it.',
  surveys: 'Admins can send team surveys.',
  stepForms: 'Approval steps can ask the approver for details.',
  aiBrief: 'Summary and risks on each request, from the Claude API. Beta: pilot customers only.',
};

export function WorkspaceDetail() {
  const { id } = useParams();
  const { state, staff, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const w = state.workspaces.find((x) => x.id === id);
  const [modal, setModal] = useState<'plan' | 'extend' | 'suspend' | 'view' | null>(null);
  const [plan, setPlan] = useState<Plan>(w?.plan ?? 'pilot');
  const [days, setDays] = useState('30');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string>();
  const [note, setNote] = useState('');

  if (!w) {
    return (
      <EmptyState heading="This workspace doesn’t exist" action={<Button onClick={() => navigate('/workspaces')}>Back to workspaces</Button>}>
        It may have been removed.
      </EmptyState>
    );
  }

  const reasons = attentionReasons(state, w);
  const lead = state.leads.find((l) => l.id === w.leadId);
  const feedback = state.feedback.filter((f) => f.workspaceId === w.id);
  const deliveries = state.deliveries.filter((d) => d.workspaceId === w.id);
  const history = state.audit.filter((a) => a.target === w.name);
  const close = () => (setModal(null), setReasonError(undefined));

  const weeks = w.weekly.map((v, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (7 - i) * 7);
    return { label: `${d.getDate()}/${d.getMonth() + 1}`, value: v, detail: `Week of ${formatShortDate(d.toISOString())}: ${v} requests` };
  });

  return (
    <>
      <PageHeader
        title={w.name}
        titleMetadata={<WorkspaceStatusDot status={w.status} />}
        subtitle={`${w.industry} · ${w.city} · ${w.sizeBand} people · customer since ${formatDate(w.createdAt)}`}
        backAction={{ content: 'Workspaces', href: '/workspaces' }}
        renderLink={headerLink}
        primaryAction={{ content: 'View as owner', onAction: () => setModal('view') }}
        secondaryActions={[
          { content: 'Change plan', onAction: () => (setPlan(w.plan), setModal('plan')) },
          ...(w.plan === 'pilot' ? [{ content: 'Extend pilot', onAction: () => setModal('extend') }] : []),
          w.status === 'suspended'
            ? {
                content: 'Reactivate',
                onAction: () => {
                  dispatch({ type: 'reactivate', workspaceId: w.id });
                  toast({ tone: 'success', title: `${w.name} is active again`, description: 'People can sign in and work as before.' });
                },
              }
            : { content: 'Suspend', destructive: true, onAction: () => (setReason(''), setModal('suspend')) },
        ]}
        maxVisibleSecondaryActions={1}
      />

      {w.status === 'suspended' ? (
        <Banner tone="warning" title="Suspended">
          {w.suspendedReason} People can’t sign in; their data is kept.
        </Banner>
      ) : reasons.length ? (
        <Banner tone="warning" title="Needs attention">
          {reasons.join(' · ')}
        </Banner>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Active people, 7 days" value={w.activeUsers7d} hint={`of ${w.memberCount} members`} />
        <Stat label="Requests, 30 days" value={requests30d(w)} hint={`${w.weekly.at(-1)} this week`} />
        <Stat label="Median decision" value={formatHours(w.medianHours)} hint="Submit to final decision" />
        <Stat label="Recommend score" value={w.nps === undefined ? '—' : `${w.nps > 0 ? '+' : ''}${w.nps}`} hint="From in-app surveys" />
        <Stat
          label="Seats"
          value={`${w.memberCount} / ${w.seats}`}
          hint={`${PLAN_LABEL[w.plan]}${w.plan === 'pilot' && w.pilotEndsAt ? `, ends ${formatShortDate(w.pilotEndsAt)}` : ''}`}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList aria-label="Workspace">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="people" badge={w.memberCount}>
            People
          </TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="notes" badge={w.notes.length || undefined}>
            Notes and history
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Card>
              <CardHeader title="Requests per week" description="Last 8 weeks." />
              <div className="mt-4">
                <ColumnChart caption={`Requests per week at ${w.name}`} points={weeks} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Account" />
              <DescriptionList
                className="mt-3"
                layout="inline"
                dividers
                items={[
                  { term: 'Plan', description: PLAN_LABEL[w.plan] },
                  ...(w.plan === 'pilot' && w.pilotEndsAt
                    ? [{ term: 'Pilot ends', description: `${formatDate(w.pilotEndsAt)} (${Math.max(0, daysUntil(w.pilotEndsAt))} days)` }]
                    : []),
                  { term: 'Deployment', description: DEPLOYMENT_LABEL[w.deployment] },
                  { term: 'Owner', description: `${w.members[0]?.name} · ${w.members[0]?.email}` },
                  { term: 'Workspace ID', description: <span className="font-mono text-sm">{w.id}</span> },
                  {
                    term: 'Came from',
                    description: lead ? (
                      <Link to={`/leads/${lead.id}`} className="text-fg-link underline">
                        Lead · {STAGE_LABEL[lead.stage]}
                      </Link>
                    ) : (
                      'Self sign-up'
                    ),
                  },
                ]}
              />
            </Card>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col gap-3">
              <CardHeader title="Feedback" actions={<Link to="/feedback" className="text-md text-fg-link underline">All feedback</Link>} />
              {feedback.length ? (
                <ul className="flex flex-col gap-3">
                  {feedback.map((f) => (
                    <li key={f.id} className="flex flex-col gap-0.5 text-md">
                      <span className="flex items-center gap-2 text-sm text-fg-muted">
                        {f.kind === 'survey' ? `Score ${f.score}/10` : f.kind === 'problem' ? 'Problem report' : 'Feedback'} · {f.person} · <Time iso={f.at} />
                      </span>
                      {f.text ? <span>{f.text}</span> : <span className="text-fg-subtle">No comment</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <Text tone="muted">No feedback yet.</Text>
              )}
            </Card>
            <Card className="flex flex-col gap-3">
              <CardHeader title="Messages sent" actions={<Link to="/system" className="text-md text-fg-link underline">All messages</Link>} />
              {deliveries.length ? (
                <ul className="flex flex-col gap-2">
                  {deliveries.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-md">
                      <Dot tone={d.status === 'sent' ? 'bg-success' : d.status === 'failed' ? 'bg-critical' : 'bg-warning'}>
                        {d.status === 'sent' ? 'Sent' : d.status === 'failed' ? 'Failed' : 'Retrying'}
                      </Dot>
                      <span className="font-mono text-sm">{d.template}</span>
                      <span className="text-sm text-fg-muted">
                        {d.channel} · {d.to} · <Time iso={d.at} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text tone="muted">No messages in the last 7 days.</Text>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="people" className="flex flex-col gap-3 pt-4">
          {w.memberCount > w.members.length ? (
            <Text variant="bodySm" tone="muted">
              The {w.members.length} most recently active of {w.memberCount} people.
            </Text>
          ) : null}
          <div className={table.wrap}>
            <table className={table.table}>
              <caption className="sr-only">People in {w.name}</caption>
              <thead>
                <tr>
                  <th className={table.th}>Name</th>
                  <th className={table.th}>Email</th>
                  <th className={table.th}>Access</th>
                  <th className={table.th}>Department</th>
                  <th className={table.th}>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {w.members.map((m) => (
                  <tr key={m.id} className={table.row}>
                    <td className={table.td}>
                      <span className="inline-flex items-center gap-2">
                        <Avatar name={m.name} size="xs" decorative />
                        {m.name}
                      </span>
                    </td>
                    <td className={`${table.td} font-mono text-sm text-fg-muted`}>{m.email}</td>
                    <td className={table.td}>{m.access === 'owner' ? 'Owner' : m.access === 'admin' ? 'Admin' : 'Member'}</td>
                    <td className={table.td}>{m.department}</td>
                    <td className={`${table.td} text-fg-muted`}>
                      <Time iso={m.lastSeenAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="features" className="pt-4">
          <Card className="flex flex-col divide-y divide-border-subtle p-0">
            {(Object.keys(FLAG_LABEL) as Flag[]).map((f) => (
              <div key={f} className="p-4">
                <Switch
                  label={FLAG_LABEL[f]}
                  helpText={FLAG_HELP[f]}
                  checked={w.flags[f]}
                  onCheckedChange={(on) => {
                    dispatch({ type: 'setFlag', workspaceId: w.id, flag: f, on });
                    toast({ title: `${FLAG_LABEL[f]} ${on ? 'on' : 'off'} for ${w.name}` });
                  }}
                />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="pt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col gap-4">
              <CardHeader title="Notes" description="For the Anumat team only; the customer never sees these." />
              <ol className="flex flex-col gap-3">
                {w.notes.map((n) => (
                  <li key={n.id} className="flex flex-col gap-1">
                    <span className="text-sm text-fg-muted">
                      {staff(n.staffId).name} · <Time iso={n.at} />
                    </span>
                    <p className="rounded-md bg-surface-sunken px-3 py-2 text-md">{n.text}</p>
                  </li>
                ))}
                {!w.notes.length ? <Text tone="muted">No notes yet.</Text> : null}
              </ol>
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!note.trim()) return;
                  dispatch({ type: 'addNote', workspaceId: w.id, text: note.trim() });
                  setNote('');
                }}
              >
                <Field label="Add a note" labelHidden>
                  <Textarea rows={2} autoGrow placeholder="What happened, what's next…" value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
                <Button type="submit" className="self-start" disabled={!note.trim()}>
                  Add note
                </Button>
              </form>
            </Card>
            <Card className="flex flex-col gap-3">
              <CardHeader title="History" description="Everything staff did to this workspace." />
              <ol className="flex flex-col gap-2.5">
                {history.map((a) => (
                  <li key={a.id} className="flex flex-col text-md">
                    <span>
                      <span className="font-medium">{staff(a.staffId).name}</span> · {a.action}
                    </span>
                    {a.detail ? <span className="text-sm text-fg-muted">{a.detail}</span> : null}
                    <Time iso={a.at} className="text-sm text-fg-subtle" />
                  </li>
                ))}
                {!history.length ? <Text tone="muted">Nothing yet.</Text> : null}
              </ol>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Modal
        open={modal === 'view'}
        onOpenChange={(o) => (o ? undefined : close())}
        size="sm"
        title="View as owner?"
        primaryAction={{
          content: 'Start read-only session',
          onAction: () => {
            dispatch({ type: 'viewAsOwner', workspaceId: w.id });
            close();
            toast({ title: `Viewing ${w.name} as ${w.members[0]?.name}`, description: 'Read-only for 30 minutes. Logged in the audit log and shown to the customer.' });
          },
        }}
        secondaryActions={[{ content: 'Cancel', onAction: close }]}
      >
        <Text>
          You’ll see {w.name} exactly as {w.members[0]?.name} does, without being able to change anything. The session lasts 30 minutes, is recorded in the
          audit log, and the owner can see that support looked in.
        </Text>
      </Modal>

      <Modal
        open={modal === 'plan'}
        onOpenChange={(o) => (o ? undefined : close())}
        size="sm"
        title="Change plan"
        description={w.name}
        primaryAction={{
          content: 'Change plan',
          disabled: plan === w.plan,
          onAction: () => {
            dispatch({ type: 'setPlan', workspaceId: w.id, plan });
            close();
            toast({ tone: 'success', title: `${w.name} is now on ${PLAN_LABEL[plan]}` });
          },
        }}
        secondaryActions={[{ content: 'Cancel', onAction: close }]}
      >
        <Field label="Plan">
          <Select value={plan} onChange={(e) => setPlan(e.target.value as Plan)} options={(Object.keys(PLAN_LABEL) as Plan[]).map((p) => ({ value: p, label: PLAN_LABEL[p] }))} />
        </Field>
      </Modal>

      <Modal
        open={modal === 'extend'}
        onOpenChange={(o) => (o ? undefined : close())}
        size="sm"
        title="Extend pilot"
        description={w.pilotEndsAt ? `Currently ends ${formatDate(w.pilotEndsAt)}` : undefined}
        primaryAction={{
          content: `Extend by ${days} days`,
          onAction: () => {
            dispatch({ type: 'extendPilot', workspaceId: w.id, days: Number(days) });
            close();
            toast({ tone: 'success', title: `Pilot extended by ${days} days`, description: 'The owner gets an email about the new date.' });
          },
        }}
        secondaryActions={[{ content: 'Cancel', onAction: close }]}
      >
        <RadioGroup legend="Extend by" value={days} onValueChange={setDays}>
          {['14', '30', '60'].map((d) => (
            <RadioGroupItem key={d} value={d} label={`${d} days`} />
          ))}
        </RadioGroup>
      </Modal>

      <Modal
        open={modal === 'suspend'}
        onOpenChange={(o) => (o ? undefined : close())}
        size="sm"
        title={`Suspend ${w.name}?`}
        primaryAction={{
          content: 'Suspend workspace',
          destructive: true,
          onAction: () => {
            if (!reason.trim()) {
              setReasonError('Say why, so the rest of the team knows.');
              return;
            }
            dispatch({ type: 'suspend', workspaceId: w.id, reason: reason.trim() });
            close();
            toast({ title: `${w.name} suspended`, description: 'Nobody can sign in until it’s reactivated. Data is kept.' });
          },
        }}
        secondaryActions={[{ content: 'Cancel', onAction: close }]}
      >
        <div className="flex flex-col gap-3">
          <Text>Nobody in the workspace can sign in until someone reactivates it. Their data stays as it is.</Text>
          <Field label="Reason" required error={reasonError} helpText="Recorded in the audit log.">
            <Textarea rows={3} value={reason} onChange={(e) => (setReason(e.target.value), setReasonError(undefined))} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
