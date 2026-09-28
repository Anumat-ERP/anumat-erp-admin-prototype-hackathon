import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { seed } from './seed';
import type { AuditEntry, ConsoleState, FeedbackItem, Flag, Lead, LeadStage, Plan, Workspace } from './types';

const STORAGE_KEY = 'anumat-console-v1';

export type Action =
  | { type: 'addNote'; workspaceId: string; text: string }
  | { type: 'setPlan'; workspaceId: string; plan: Plan }
  | { type: 'extendPilot'; workspaceId: string; days: number }
  | { type: 'suspend'; workspaceId: string; reason: string }
  | { type: 'reactivate'; workspaceId: string }
  | { type: 'setFlag'; workspaceId: string; flag: Flag; on: boolean }
  | { type: 'viewAsOwner'; workspaceId: string }
  | { type: 'moveLead'; leadId: string; stage: LeadStage; reason?: string }
  | { type: 'assignLead'; leadId: string; staffId: string }
  | { type: 'addLeadNote'; leadId: string; text: string }
  | { type: 'convertLead'; leadId: string }
  | { type: 'setProblem'; feedbackId: string; status: NonNullable<FeedbackItem['status']> }
  | { type: 'assignProblem'; feedbackId: string; staffId: string }
  | { type: 'retryDelivery'; deliveryId: string }
  | { type: 'switchStaff'; staffId: string }
  | { type: 'reset' };

let counter = 0;
export const uid = (p: string) => `${p}-${Date.now().toString(36)}${(counter++).toString(36)}`;
const now = () => new Date().toISOString();

export const FLAG_LABEL: Record<Flag, string> = {
  telegram: 'Telegram notifications',
  surveys: 'Surveys',
  stepForms: 'Approver step forms',
  aiBrief: 'AI decision brief (beta)',
};
export const PLAN_LABEL: Record<Plan, string> = { pilot: 'Pilot', free: 'Free', business: 'Business', enterprise: 'Enterprise' };
export const STAGE_LABEL: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  demo: 'Demo booked',
  pilot: 'In pilot',
  won: 'Won',
  lost: 'Lost',
};

function log(state: ConsoleState, action: string, target: string, detail?: string): AuditEntry[] {
  return [{ id: uid('a'), at: now(), staffId: state.meId, action, target, detail }, ...state.audit];
}

function updateWs(state: ConsoleState, id: string, fn: (w: Workspace) => Workspace, action: string, detail?: string): ConsoleState {
  const w = state.workspaces.find((x) => x.id === id);
  if (!w) return state;
  return { ...state, workspaces: state.workspaces.map((x) => (x.id === id ? fn(x) : x)), audit: log(state, action, w.name, detail) };
}

function updateLead(state: ConsoleState, id: string, fn: (l: Lead) => Lead, action: string, detail?: string): ConsoleState {
  const l = state.leads.find((x) => x.id === id);
  if (!l) return state;
  return { ...state, leads: state.leads.map((x) => (x.id === id ? { ...fn(x), updatedAt: now() } : x)), audit: log(state, action, l.company, detail) };
}

function reducer(state: ConsoleState, action: Action): ConsoleState {
  switch (action.type) {
    case 'addNote':
      return updateWs(
        state,
        action.workspaceId,
        (w) => ({ ...w, notes: [...w.notes, { id: uid('n'), at: now(), staffId: state.meId, text: action.text }] }),
        'Added a note',
      );
    case 'setPlan':
      return updateWs(
        state,
        action.workspaceId,
        (w) => ({ ...w, plan: action.plan, pilotEndsAt: action.plan === 'pilot' ? w.pilotEndsAt : undefined }),
        `Changed plan to ${PLAN_LABEL[action.plan]}`,
      );
    case 'extendPilot':
      return updateWs(
        state,
        action.workspaceId,
        (w) => {
          const from = w.pilotEndsAt && new Date(w.pilotEndsAt) > new Date() ? new Date(w.pilotEndsAt) : new Date();
          from.setDate(from.getDate() + action.days);
          return { ...w, pilotEndsAt: from.toISOString() };
        },
        `Extended pilot by ${action.days} days`,
      );
    case 'suspend':
      return updateWs(state, action.workspaceId, (w) => ({ ...w, status: 'suspended', suspendedReason: action.reason }), 'Suspended workspace', action.reason);
    case 'reactivate':
      return updateWs(state, action.workspaceId, (w) => ({ ...w, status: 'active', suspendedReason: undefined }), 'Reactivated workspace');
    case 'setFlag':
      return updateWs(
        state,
        action.workspaceId,
        (w) => ({ ...w, flags: { ...w.flags, [action.flag]: action.on } }),
        `${action.on ? 'Turned on' : 'Turned off'} ${FLAG_LABEL[action.flag]}`,
      );
    case 'viewAsOwner':
      return updateWs(state, action.workspaceId, (w) => w, 'Viewed workspace as owner (read-only)', 'Support session, 30 minutes');
    case 'moveLead':
      return updateLead(
        state,
        action.leadId,
        (l) => ({ ...l, stage: action.stage, lostReason: action.stage === 'lost' ? action.reason : undefined }),
        `Moved lead to ${STAGE_LABEL[action.stage]}`,
        action.reason,
      );
    case 'assignLead':
      return updateLead(
        state,
        action.leadId,
        (l) => ({ ...l, ownerId: action.staffId }),
        `Assigned lead to ${state.staff.find((s) => s.id === action.staffId)?.name ?? 'someone'}`,
      );
    case 'addLeadNote':
      return updateLead(state, action.leadId, (l) => ({ ...l, notes: [...l.notes, { id: uid('ln'), at: now(), staffId: state.meId, text: action.text }] }), 'Added a note');
    case 'convertLead': {
      const l = state.leads.find((x) => x.id === action.leadId);
      if (!l || l.workspaceId) return state;
      const id = l.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const ends = new Date();
      ends.setDate(ends.getDate() + 90);
      const ws: Workspace = {
        id,
        name: l.company,
        industry: '—',
        city: '—',
        sizeBand: l.sizeBand,
        plan: 'pilot',
        deployment: l.deployment === 'not-sure' ? 'cloud' : l.deployment,
        status: 'onboarding',
        createdAt: now(),
        pilotEndsAt: ends.toISOString(),
        members: [
          { id: `${id}-m1`, name: l.contact, email: l.email, access: 'owner', department: 'Leadership', lastSeenAt: now() },
        ],
        memberCount: 1,
        seats: 10,
        weekly: [0, 0, 0, 0, 0, 0, 0, 0],
        medianHours: 0,
        activeUsers7d: 0,
        lastActiveAt: now(),
        flags: { telegram: true, surveys: true, stepForms: true, aiBrief: false },
        notes: [{ id: uid('n'), at: now(), staffId: state.meId, text: `Created from lead. ${l.message}` }],
        leadId: l.id,
      };
      return {
        ...state,
        workspaces: [ws, ...state.workspaces],
        leads: state.leads.map((x) => (x.id === l.id ? { ...x, stage: 'pilot', workspaceId: id, updatedAt: now() } : x)),
        audit: log(state, 'Converted lead to workspace', l.company, `Pilot until ${ends.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}; invite sent to ${l.email}`),
      };
    }
    case 'setProblem': {
      const f = state.feedback.find((x) => x.id === action.feedbackId);
      if (!f) return state;
      const ws = state.workspaces.find((w) => w.id === f.workspaceId)?.name ?? '—';
      const label = action.status === 'resolved' ? 'Resolved problem report' : action.status === 'in-progress' ? 'Took problem report' : 'Reopened problem report';
      return {
        ...state,
        feedback: state.feedback.map((x) =>
          x.id === f.id ? { ...x, status: action.status, assigneeId: action.status === 'in-progress' ? (x.assigneeId ?? state.meId) : x.assigneeId } : x,
        ),
        audit: log(state, label, ws, f.text.slice(0, 80)),
      };
    }
    case 'assignProblem': {
      const f = state.feedback.find((x) => x.id === action.feedbackId);
      if (!f) return state;
      const ws = state.workspaces.find((w) => w.id === f.workspaceId)?.name ?? '—';
      return {
        ...state,
        feedback: state.feedback.map((x) => (x.id === f.id ? { ...x, assigneeId: action.staffId } : x)),
        audit: log(state, `Assigned problem to ${state.staff.find((s) => s.id === action.staffId)?.name}`, ws),
      };
    }
    case 'retryDelivery': {
      const d = state.deliveries.find((x) => x.id === action.deliveryId);
      if (!d) return state;
      const ws = state.workspaces.find((w) => w.id === d.workspaceId)?.name ?? '—';
      return {
        ...state,
        deliveries: state.deliveries.map((x) => (x.id === d.id ? { ...x, status: 'sent', attempts: x.attempts + 1, at: now(), error: undefined } : x)),
        audit: log(state, `Retried ${d.channel} delivery`, ws, `${d.template} to ${d.to}`),
      };
    }
    case 'switchStaff':
      return { ...state, meId: action.staffId };
    case 'reset':
      return seed;
  }
}

function load(): ConsoleState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ConsoleState;
  } catch {
    // Start from the demo data.
  }
  return seed;
}

interface Store {
  state: ConsoleState;
  dispatch: (a: Action) => void;
  staff: (id?: string) => ConsoleState['staff'][number];
  me: ConsoleState['staff'][number];
  workspace: (id: string) => Workspace | undefined;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Changes last for this visit only.
    }
  }, [state]);
  const staff = (id?: string) => state.staff.find((s) => s.id === id) ?? { id: '?', name: 'Unassigned', email: '', role: 'support' as const };
  return (
    <Ctx.Provider value={{ state, dispatch, staff, me: staff(state.meId), workspace: (id) => state.workspaces.find((w) => w.id === id) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

/* ── Derived numbers ─────────────────────────────────────────────── */

export const requests30d = (w: Workspace) => w.weekly.slice(-4).reduce((a, b) => a + b, 0);

/** Why a workspace needs someone to look at it, most urgent first. Empty if all good. */
export function attentionReasons(state: ConsoleState, w: Workspace): string[] {
  const out: string[] = [];
  if (w.status === 'suspended' || w.status === 'churned') return out;
  const idle = Math.floor((Date.now() - new Date(w.lastActiveAt).getTime()) / 86_400_000);
  if (idle >= 7) out.push(`No activity for ${idle} days`);
  if (w.plan === 'pilot' && w.pilotEndsAt) {
    const left = Math.ceil((new Date(w.pilotEndsAt).getTime() - Date.now()) / 86_400_000);
    if (left <= 14) out.push(left <= 0 ? 'Pilot has ended' : `Pilot ends in ${left} ${left === 1 ? 'day' : 'days'}`);
  }
  const last = w.weekly.at(-1) ?? 0;
  const before = (w.weekly.at(-4) ?? 0) + 0.001;
  if (w.status !== 'onboarding' && last / before < 0.5 && (w.weekly.at(-4) ?? 0) >= 4) out.push('Requests down by more than half in 4 weeks');
  if (w.nps !== undefined && w.nps < 10) out.push(`Low recommend score (${w.nps})`);
  const failed = state.deliveries.filter((d) => d.workspaceId === w.id && d.status === 'failed').length;
  if (failed) out.push(`${failed} failed ${failed === 1 ? 'delivery' : 'deliveries'}`);
  const open = state.feedback.filter((f) => f.workspaceId === w.id && f.kind === 'problem' && f.status === 'open').length;
  if (open) out.push(`${open} open problem ${open === 1 ? 'report' : 'reports'}`);
  return out;
}

/** Net Promoter Score from 0–10 answers. */
export function nps(scores: number[]) {
  if (!scores.length) return null;
  return Math.round(((scores.filter((s) => s >= 9).length - scores.filter((s) => s <= 6).length) / scores.length) * 100);
}
