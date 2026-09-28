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
  Select,
  Text,
  Textarea,
  useToast,
} from '@repo/ui';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { headerLink } from '../components/links';
import { Time } from '../components/Time';
import { Dot } from '../components/ui';
import { STAGE_LABEL, useStore } from '../data/store';
import type { Lead, LeadStage } from '../data/types';
import { formatDate } from '../lib/format';

const STAGES: LeadStage[] = ['new', 'contacted', 'demo', 'pilot', 'won', 'lost'];
const STAGE_DOT: Record<LeadStage, string> = {
  new: 'bg-info',
  contacted: 'bg-fg-subtle',
  demo: 'bg-primary',
  pilot: 'bg-warning',
  won: 'bg-success',
  lost: 'bg-critical',
};
const DEPLOY: Record<Lead['deployment'], string> = { cloud: 'Anumat Cloud', 'own-cloud': 'Own cloud', 'on-premise': 'On-premise', 'not-sure': 'Not sure yet' };

function LeadCard({ lead }: { lead: Lead }) {
  const { staff } = useStore();
  return (
    <Link
      to={`/leads/${lead.id}`}
      className="flex flex-col gap-1.5 rounded-md border border-border bg-surface p-3 hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="font-medium text-fg">{lead.company}</span>
      <span className="text-sm text-fg-muted">
        {lead.contact} · {lead.sizeBand} people
      </span>
      <span className="text-sm text-fg-subtle">{DEPLOY[lead.deployment]}</span>
      <span className="flex items-center justify-between gap-2 text-sm">
        {lead.ownerId ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-fg-muted">
            <Avatar name={staff(lead.ownerId).name} size="xs" decorative />
            <span className="truncate">{staff(lead.ownerId).name.split(' ')[0]}</span>
          </span>
        ) : (
          <span className="text-warning-subtle-fg">No owner</span>
        )}
        <Time iso={lead.updatedAt} className="shrink-0 text-xs text-fg-subtle" />
      </span>
    </Link>
  );
}

export function Leads() {
  const { state } = useStore();
  const open = state.leads.filter((l) => l.stage !== 'won' && l.stage !== 'lost').length;
  return (
    <>
      <PageHeader title="Leads" subtitle={`${open} open · from the pricing page, referrals and events. Oldest activity at the bottom of each column.`} />
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => {
          const leads = state.leads.filter((l) => l.stage === stage).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          return (
            <section key={stage} aria-labelledby={`stage-${stage}`} className="flex min-w-0 flex-col gap-2 rounded-lg bg-surface-sunken p-2">
              <h2 id={`stage-${stage}`} className="flex items-center justify-between px-1 pt-1 text-sm font-medium text-fg-muted">
                <Dot tone={STAGE_DOT[stage]} className="text-sm">
                  {STAGE_LABEL[stage]}
                </Dot>
                <span className="tabular-nums">{leads.length}</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {leads.map((l) => (
                  <li key={l.id}>
                    <LeadCard lead={l} />
                  </li>
                ))}
                {!leads.length ? <li className="px-1 py-3 text-sm text-fg-subtle">None</li> : null}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

export function LeadDetail() {
  const { id } = useParams();
  const { state, staff, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const lead = state.leads.find((l) => l.id === id);
  const [note, setNote] = useState('');
  const [losing, setLosing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string>();

  if (!lead) {
    return (
      <EmptyState heading="This lead doesn’t exist" action={<Button onClick={() => navigate('/leads')}>Back to leads</Button>}>
        It may have been removed.
      </EmptyState>
    );
  }
  const canConvert = !lead.workspaceId && lead.stage !== 'lost';

  return (
    <>
      <PageHeader
        title={lead.company}
        titleMetadata={<Dot tone={STAGE_DOT[lead.stage]}>{STAGE_LABEL[lead.stage]}</Dot>}
        subtitle={`${lead.contact} · ${lead.sizeBand} people · via ${lead.source}, ${formatDate(lead.createdAt)}`}
        backAction={{ content: 'Leads', href: '/leads' }}
        renderLink={headerLink}
        primaryAction={
          lead.workspaceId
            ? { content: 'Open workspace', onAction: () => navigate(`/workspaces/${lead.workspaceId}`) }
            : canConvert
              ? { content: 'Start a pilot', onAction: () => setConverting(true) }
              : undefined
        }
        secondaryActions={lead.stage !== 'lost' && lead.stage !== 'won' ? [{ content: 'Mark as lost', destructive: true, onAction: () => (setReason(''), setLosing(true)) }] : undefined}
      />

      {lead.stage === 'lost' && lead.lostReason ? <Banner tone="info" title="Lost">{lead.lostReason}</Banner> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <CardHeader title="What they said" />
            <blockquote className="border-s-2 border-border-strong ps-3 text-md">{lead.message}</blockquote>
            <DescriptionList
              layout="inline"
              dividers
              items={[
                { term: 'Contact', description: `${lead.contact} · ${lead.email}` },
                { term: 'Company size', description: `${lead.sizeBand} people` },
                { term: 'Wants', description: DEPLOY[lead.deployment] },
                { term: 'Source', description: lead.source },
              ]}
            />
          </Card>
          <Card className="flex flex-col gap-4">
            <CardHeader title="Notes" />
            <ol className="flex flex-col gap-3">
              {lead.notes.map((n) => (
                <li key={n.id} className="flex flex-col gap-1">
                  <span className="text-sm text-fg-muted">
                    {staff(n.staffId).name} · <Time iso={n.at} />
                  </span>
                  <p className="rounded-md bg-surface-sunken px-3 py-2 text-md">{n.text}</p>
                </li>
              ))}
              {!lead.notes.length ? <Text tone="muted">No notes yet.</Text> : null}
            </ol>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                dispatch({ type: 'addLeadNote', leadId: lead.id, text: note.trim() });
                setNote('');
              }}
            >
              <Field label="Add a note" labelHidden>
                <Textarea rows={2} autoGrow placeholder="Call summary, next step…" value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <Button type="submit" className="self-start" disabled={!note.trim()}>
                Add note
              </Button>
            </form>
          </Card>
        </div>
        <Card className="flex flex-col gap-4 self-start">
          <CardHeader title="Pipeline" />
          <Field label="Stage">
            <Select
              value={lead.stage}
              onChange={(e) => {
                const stage = e.target.value as LeadStage;
                if (stage === 'lost') return (setReason(''), setLosing(true));
                dispatch({ type: 'moveLead', leadId: lead.id, stage });
                toast({ title: `Moved to ${STAGE_LABEL[stage]}` });
              }}
              options={STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))}
            />
          </Field>
          <Field label="Owner">
            <Select
              value={lead.ownerId ?? ''}
              placeholder="Unassigned"
              onChange={(e) => {
                dispatch({ type: 'assignLead', leadId: lead.id, staffId: e.target.value });
                toast({ title: `Assigned to ${staff(e.target.value).name}` });
              }}
              options={state.staff.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Field>
          <Text variant="bodySm" tone="muted">
            Last updated <Time iso={lead.updatedAt} />.
          </Text>
        </Card>
      </div>

      <Modal
        open={converting}
        onOpenChange={setConverting}
        size="sm"
        title={`Start a pilot for ${lead.company}?`}
        primaryAction={{
          content: 'Create workspace',
          onAction: () => {
            dispatch({ type: 'convertLead', leadId: lead.id });
            setConverting(false);
            toast({ tone: 'success', title: `${lead.company} workspace created`, description: `90-day pilot. Invite sent to ${lead.email}.` });
            navigate(`/workspaces/${lead.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`);
          },
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setConverting(false) }]}
      >
        <ul className="flex list-disc flex-col gap-1.5 ps-5 text-md">
          <li>Creates the workspace on {DEPLOY[lead.deployment === 'not-sure' ? 'cloud' : lead.deployment]}, with a 90-day pilot.</li>
          <li>{lead.contact} becomes the owner and gets an invitation at {lead.email}.</li>
          <li>The lead moves to “In pilot”.</li>
        </ul>
      </Modal>

      <Modal
        open={losing}
        onOpenChange={setLosing}
        size="sm"
        title="Mark as lost?"
        primaryAction={{
          content: 'Mark as lost',
          destructive: true,
          onAction: () => {
            if (!reason.trim()) return setReasonError('Say why, so we learn from it.');
            dispatch({ type: 'moveLead', leadId: lead.id, stage: 'lost', reason: reason.trim() });
            setLosing(false);
            toast({ title: `${lead.company} marked as lost` });
          },
        }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setLosing(false) }]}
      >
        <Field label="Why?" required error={reasonError}>
          <Textarea rows={3} value={reason} onChange={(e) => (setReason(e.target.value), setReasonError(undefined))} placeholder="Chose another tool, no budget this year…" />
        </Field>
      </Modal>
    </>
  );
}
