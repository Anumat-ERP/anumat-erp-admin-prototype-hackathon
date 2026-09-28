import { Card, Text, cn } from '@repo/ui';
import type { ReactNode } from 'react';
import type { WorkspaceStatus } from '../data/types';

const STATUS: Record<WorkspaceStatus, { label: string; dot: string }> = {
  onboarding: { label: 'Onboarding', dot: 'bg-info' },
  active: { label: 'Active', dot: 'bg-success' },
  'at-risk': { label: 'At risk', dot: 'bg-warning' },
  suspended: { label: 'Suspended', dot: 'bg-fg-subtle' },
  churned: { label: 'Churned', dot: 'bg-critical' },
};

/** A coloured dot and a word. Colour never carries the meaning alone. */
export function Dot({ tone, children, className }: { tone: string; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-md font-medium whitespace-nowrap text-fg', className)}>
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', tone)} />
      {children}
    </span>
  );
}

export function WorkspaceStatusDot({ status }: { status: WorkspaceStatus }) {
  return <Dot tone={STATUS[status].dot}>{STATUS[status].label}</Dot>;
}
export const statusLabel = (s: WorkspaceStatus) => STATUS[s].label;

/** A number with its label and a line of context. */
export function Stat({ label, value, hint, className }: { label: string; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <Card className={cn('flex flex-col gap-1', className)}>
      <Text as="span" variant="bodySm" tone="muted">
        {label}
      </Text>
      <span className="text-[1.75rem] leading-9 font-semibold tracking-tight text-fg tabular-nums">{value}</span>
      {hint ? (
        <Text as="span" variant="caption" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

/** Dense table styling shared by every list in the console. */
export const table = {
  wrap: 'overflow-x-auto rounded-lg border border-border bg-surface',
  table: 'w-full min-w-[40rem] border-collapse text-md',
  th: 'sticky top-0 border-b border-border bg-surface-muted px-3 py-2 text-start text-sm font-medium whitespace-nowrap text-fg-muted',
  td: 'border-b border-border-subtle px-3 py-2.5 align-middle',
  row: 'hover:bg-surface-hover [&:last-child>td]:border-0',
};

/** Tiny inline bar chart of weekly counts. Decorative: the number next to it says it. */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values);
  return (
    <span className="inline-flex h-6 items-end gap-[2px]" role="img" aria-label={label}>
      {values.map((v, i) => (
        <span
          key={i}
          className={cn('w-1.5 rounded-t-[2px]', i === values.length - 1 ? 'bg-[var(--an-chart-1)]' : 'bg-[var(--an-chart-1)] opacity-40')}
          style={{ height: `${Math.max(2, (v / max) * 24)}px` }}
        />
      ))}
    </span>
  );
}
