import { PageHeader, SearchField, Select, Text } from '@repo/ui';
import { useState } from 'react';
import { table } from '../components/ui';
import { useStore } from '../data/store';
import { formatDateTime } from '../lib/format';

export function Audit() {
  const { state, staff } = useStore();
  const [who, setWho] = useState('');
  const [q, setQ] = useState('');
  const rows = state.audit
    .filter((a) => (!who || a.staffId === who) && (!q || `${a.action} ${a.target} ${a.detail ?? ''}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <PageHeader title="Audit log" subtitle="Every change staff make in the console, who made it and when. Entries can’t be edited or deleted." />
      <div className="flex flex-wrap items-end gap-3">
        <SearchField label="Search the log" labelHidden placeholder="Action, workspace or lead" value={q} onChange={setQ} onClear={() => setQ('')} className="w-full sm:w-72" />
        <Select
          aria-label="Staff member"
          value={who}
          onChange={(e) => setWho(e.target.value)}
          options={[{ value: '', label: 'Everyone' }, ...state.staff.map((s) => ({ value: s.id, label: s.name }))]}
          className="w-48"
        />
      </div>
      <Text variant="bodySm" tone="muted" aria-live="polite">
        {rows.length} entries
      </Text>
      <div className={table.wrap}>
        <table className={table.table}>
          <caption className="sr-only">Audit log</caption>
          <thead>
            <tr>
              <th className={table.th}>When</th>
              <th className={table.th}>Who</th>
              <th className={table.th}>Action</th>
              <th className={table.th}>On</th>
              <th className={table.th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className={table.row}>
                <td className={`${table.td} font-mono text-sm whitespace-nowrap text-fg-muted`}>
                  <time dateTime={a.at}>{formatDateTime(a.at)}</time>
                </td>
                <td className={`${table.td} whitespace-nowrap`}>{staff(a.staffId).name}</td>
                <td className={table.td}>{a.action}</td>
                <td className={table.td}>{a.target}</td>
                <td className={`${table.td} text-sm text-fg-muted`}>{a.detail ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
