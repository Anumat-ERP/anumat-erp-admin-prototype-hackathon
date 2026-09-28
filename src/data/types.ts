export type StaffRole = 'owner' | 'support' | 'sales' | 'engineer';

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

export type Plan = 'pilot' | 'free' | 'business' | 'enterprise';
export type Deployment = 'cloud' | 'own-cloud' | 'on-premise';
export type WorkspaceStatus = 'onboarding' | 'active' | 'at-risk' | 'suspended' | 'churned';
export type Flag = 'telegram' | 'surveys' | 'stepForms' | 'aiBrief';

export interface Member {
  id: string;
  name: string;
  email: string;
  access: 'owner' | 'admin' | 'member';
  department: string;
  lastSeenAt: string;
}

export interface Note {
  id: string;
  at: string;
  staffId: string;
  text: string;
}

export interface Workspace {
  id: string;
  name: string;
  industry: string;
  city: string;
  sizeBand: string;
  plan: Plan;
  deployment: Deployment;
  status: WorkspaceStatus;
  createdAt: string;
  pilotEndsAt?: string;
  /** A sample of members, most recently active first. */
  members: Member[];
  /** Everyone in the workspace (the sample above may be shorter). */
  memberCount: number;
  seats: number;
  /** Requests submitted per week, oldest first (last 8 weeks). */
  weekly: number[];
  /** Median hours from submit to final decision, last 30 days. */
  medianHours: number;
  activeUsers7d: number;
  lastActiveAt: string;
  nps?: number;
  flags: Record<Flag, boolean>;
  notes: Note[];
  suspendedReason?: string;
  leadId?: string;
}

export type LeadStage = 'new' | 'contacted' | 'demo' | 'pilot' | 'won' | 'lost';

export interface Lead {
  id: string;
  company: string;
  contact: string;
  email: string;
  sizeBand: string;
  deployment: Deployment | 'not-sure';
  message: string;
  source: 'pricing page' | 'referral' | 'event' | 'landing page';
  stage: LeadStage;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  workspaceId?: string;
  notes: Note[];
  lostReason?: string;
}

export interface FeedbackItem {
  id: string;
  workspaceId: string;
  person: string;
  kind: 'survey' | 'feedback' | 'problem';
  score?: number;
  text: string;
  at: string;
  /** Problems are worked like tickets. */
  status?: 'open' | 'in-progress' | 'resolved';
  assigneeId?: string;
}

export interface Delivery {
  id: string;
  channel: 'email' | 'telegram';
  /** Masked: staff never need the full address to fix a delivery. */
  to: string;
  template: string;
  workspaceId: string;
  status: 'sent' | 'failed' | 'retrying';
  attempts: number;
  at: string;
  error?: string;
}

export interface Service {
  id: string;
  name: string;
  provider: string;
  status: 'operational' | 'degraded' | 'down';
  uptime30d: number;
  p95Ms: number;
  note?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  staffId: string;
  action: string;
  target: string;
  detail?: string;
}

export interface ConsoleState {
  meId: string;
  staff: Staff[];
  workspaces: Workspace[];
  leads: Lead[];
  feedback: FeedbackItem[];
  deliveries: Delivery[];
  services: Service[];
  audit: AuditEntry[];
}
