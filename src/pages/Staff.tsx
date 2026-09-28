import { Avatar, Card, CardHeader, PageHeader, Text } from '@repo/ui';
import { Check, Minus } from 'lucide-react';
import { table } from '../components/ui';
import { useStore } from '../data/store';
import type { StaffRole } from '../data/types';

const ROLES: { id: StaffRole; name: string; about: string }[] = [
  { id: 'owner', name: 'Owner', about: 'Runs Anumat. Everything, including staff and plans.' },
  { id: 'support', name: 'Support', about: 'Helps customers: notes, features, problem reports, read-only view.' },
  { id: 'sales', name: 'Sales', about: 'Leads, pilots and plans.' },
  { id: 'engineer', name: 'Engineer', about: 'System health, message retries and feature switches.' },
];

const CAN: [string, StaffRole[]][] = [
  ['See all workspaces and leads', ['owner', 'support', 'sales', 'engineer']],
  ['Add notes', ['owner', 'support', 'sales', 'engineer']],
  ['View a workspace as its owner (read-only, logged)', ['owner', 'support', 'engineer']],
  ['Turn features on or off', ['owner', 'support', 'engineer']],
  ['Change plans and extend pilots', ['owner', 'sales']],
  ['Move leads and start pilots', ['owner', 'sales']],
  ['Suspend or reactivate a workspace', ['owner', 'support']],
  ['Work problem reports', ['owner', 'support', 'engineer']],
  ['Retry failed messages', ['owner', 'engineer']],
  ['Manage staff', ['owner']],
];

export function Staff() {
  const { state, me } = useStore();
  return (
    <>
      <PageHeader title="Staff" subtitle="The Anumat team and what each role can do in the console." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {state.staff.map((s) => (
          <Card key={s.id} className="flex items-center gap-3">
            <Avatar name={s.name} size="md" decorative />
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">
                {s.name}
                {s.id === me.id ? <span className="text-fg-subtle"> (you)</span> : null}
              </span>
              <span className="text-sm text-fg-muted">{ROLES.find((r) => r.id === s.role)?.name}</span>
              <span className="truncate font-mono text-xs text-fg-subtle">{s.email}</span>
            </span>
          </Card>
        ))}
      </div>
      <Card flush>
        <div className="p-4 pb-2">
          <CardHeader title="Roles" description="Staff sign in with Clerk and two-factor authentication. Every action is in the audit log." />
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-md">
            <caption className="sr-only">What each staff role can do</caption>
            <thead>
              <tr>
                <th className={table.th}>Can</th>
                {ROLES.map((r) => (
                  <th key={r.id} className={`${table.th} text-center`} title={r.about}>
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAN.map(([what, who]) => (
                <tr key={what} className={table.row}>
                  <th scope="row" className={`${table.td} text-start font-regular`}>
                    {what}
                  </th>
                  {ROLES.map((r) => (
                    <td key={r.id} className={`${table.td} text-center`}>
                      {who.includes(r.id) ? (
                        <>
                          <Check aria-hidden className="mx-auto size-4 text-success" />
                          <span className="sr-only">Yes</span>
                        </>
                      ) : (
                        <>
                          <Minus aria-hidden className="mx-auto size-4 text-fg-subtle" />
                          <span className="sr-only">No</span>
                        </>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Text variant="bodySm" tone="muted">
        In this prototype everyone can do everything so you can try it; use the account menu to switch staff member and see it in the audit log.
      </Text>
    </>
  );
}
