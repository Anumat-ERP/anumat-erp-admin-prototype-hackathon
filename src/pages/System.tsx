import { Banner, Button, Card, PageHeader, Select, Text, useToast } from '@repo/ui';
import { useState } from 'react';
import { Link } from 'react-router';
import { Time } from '../components/Time';
import { Dot, table } from '../components/ui';
import { useStore } from '../data/store';
import type { Delivery } from '../data/types';

const SERVICE = {
  operational: { label: 'Operational', dot: 'bg-success' },
  degraded: { label: 'Degraded', dot: 'bg-warning' },
  down: { label: 'Down', dot: 'bg-critical' },
} as const;
const DELIVERY: Record<Delivery['status'], { label: string; dot: string }> = {
  sent: { label: 'Sent', dot: 'bg-success' },
  retrying: { label: 'Retrying', dot: 'bg-warning' },
  failed: { label: 'Failed', dot: 'bg-critical' },
};

export function System() {
  const { state, workspace, dispatch } = useStore();
  const { toast } = useToast();
  const [show, setShow] = useState<'all' | 'problems'>('problems');
  const issues = state.services.filter((s) => s.status !== 'operational');
  const rows = state.deliveries
    .filter((d) => show === 'all' || d.status !== 'sent')
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <PageHeader title="System" subtitle="Service health and every email and Telegram message Anumat sends." />
      {issues.length ? (
        <Banner tone="warning" title={`${issues.length} ${issues.length === 1 ? 'service is' : 'services are'} degraded`}>
          {issues.map((s) => `${s.name}: ${s.note ?? 'slower than usual'}`).join(' ')} Customers are not affected otherwise.
        </Banner>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {state.services.map((s) => (
          <li key={s.id}>
            <Card className="flex h-full flex-col gap-2">
              <span className="flex items-start justify-between gap-2">
                <span className="flex flex-col">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-sm text-fg-subtle">{s.provider}</span>
                </span>
                <Dot tone={SERVICE[s.status].dot} className="text-sm">
                  {SERVICE[s.status].label}
                </Dot>
              </span>
              <span className="flex gap-6 text-sm text-fg-muted tabular-nums">
                <span>
                  <span className="font-medium text-fg">{s.uptime30d.toFixed(2)}%</span> uptime, 30 d
                </span>
                <span>
                  <span className="font-medium text-fg">{s.p95Ms.toLocaleString()} ms</span> p95
                </span>
              </span>
            </Card>
          </li>
        ))}
      </ul>

      <section aria-labelledby="deliveries" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text as="h2" id="deliveries" variant="title">
            Messages
          </Text>
          <Select
            size="sm"
            aria-label="Show"
            value={show}
            onChange={(e) => setShow(e.target.value as 'all' | 'problems')}
            options={[
              { value: 'problems', label: 'Failed and retrying' },
              { value: 'all', label: 'All messages, 7 days' },
            ]}
            className="w-52"
          />
        </div>
        <div className={table.wrap}>
          <table className={table.table}>
            <caption className="sr-only">Messages sent by Anumat</caption>
            <thead>
              <tr>
                <th className={table.th}>Status</th>
                <th className={table.th}>Message</th>
                <th className={table.th}>To</th>
                <th className={table.th}>Workspace</th>
                <th className={`${table.th} text-end`}>Tries</th>
                <th className={table.th}>When</th>
                <th className={table.th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className={table.row}>
                  <td className={table.td}>
                    <Dot tone={DELIVERY[d.status].dot}>{DELIVERY[d.status].label}</Dot>
                  </td>
                  <td className={table.td}>
                    <span className="font-mono text-sm">{d.template}</span>
                    <div className="text-sm text-fg-subtle">{d.channel === 'email' ? 'Email' : 'Telegram'}</div>
                    {d.error ? <div className="text-sm text-critical-subtle-fg">{d.error}</div> : null}
                  </td>
                  <td className={`${table.td} font-mono text-sm text-fg-muted`}>{d.to}</td>
                  <td className={table.td}>
                    <Link to={`/workspaces/${d.workspaceId}`} className="text-fg-link hover:underline">
                      {workspace(d.workspaceId)?.name}
                    </Link>
                  </td>
                  <td className={`${table.td} text-end tabular-nums`}>{d.attempts}</td>
                  <td className={`${table.td} whitespace-nowrap text-fg-muted`}>
                    <Time iso={d.at} />
                  </td>
                  <td className={`${table.td} text-end`}>
                    {d.status === 'failed' ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          dispatch({ type: 'retryDelivery', deliveryId: d.id });
                          toast({ tone: 'success', title: 'Sent', description: `${d.template} to ${d.to}` });
                        }}
                      >
                        Retry
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-fg-muted">
                    No failed or retrying messages.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Text variant="bodySm" tone="muted">
          Addresses are masked: staff can fix a delivery without seeing who it was for.
        </Text>
      </section>
    </>
  );
}
