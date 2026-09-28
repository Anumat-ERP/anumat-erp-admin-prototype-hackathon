import { Text, Tooltip, cn } from '@repo/ui';
import type { ReactNode } from 'react';

export interface BarSegment {
  value: number;
  /** CSS colour, usually var(--an-chart-n). */
  color: string;
  label: string;
}

export interface BarRow {
  id: string;
  label: ReactNode;
  segments: BarSegment[];
  /** Text shown after the bar (the row's headline value). */
  display: string;
  /** Extra detail in the hover tooltip. */
  detail?: ReactNode;
  /** Optional target marker, in the same units as the values. */
  target?: number;
}

/**
 * Horizontal bars as a real table: row label, bar, value. The table is the
 * accessible view; bars are decorative. Segments stack with a 2px gap.
 */
export function BarTable({
  caption,
  rows,
  max,
  valueHeader,
  targetLabel,
}: {
  caption: string;
  rows: BarRow[];
  max?: number;
  valueHeader: string;
  targetLabel?: string;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => Math.max(r.target ?? 0, r.segments.reduce((a, s) => a + s.value, 0))));
  return (
    <table className="w-full border-collapse text-md">
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Chart</th>
          <th scope="col">{valueHeader}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, row) => (
          <tr key={r.id}>
            <th scope="row" className="w-36 py-2 pe-3 text-start align-middle font-regular text-fg-muted">
              {r.label}
            </th>
            <td className="py-2 align-middle" aria-hidden>
              <Tooltip content={r.detail ?? r.display} side="top">
                <div className="relative flex h-6 items-center">
                  <div className="flex h-3 w-full items-center gap-0.5">
                    {r.segments
                      .filter((s) => s.value > 0)
                      .map((s, i, list) => (
                        <div
                          key={s.label}
                          className={cn('an-grow-x h-full', i === list.length - 1 && 'rounded-e-sm')}
                          style={{ width: `${(s.value / top) * 100}%`, background: s.color, animationDelay: `${row * 40}ms` }}
                        />
                      ))}
                  </div>
                  {r.target !== undefined ? (
                    <div
                      className="absolute top-0 h-6 w-0.5 rounded-full bg-fg"
                      style={{ left: `calc(${(r.target / top) * 100}% - 1px)` }}
                      title={targetLabel}
                    />
                  ) : null}
                </div>
              </Tooltip>
            </td>
            <td className="w-24 py-2 ps-3 text-end align-middle font-medium text-fg tabular-nums">{r.display}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Legend row: a swatch and a text label per series (text stays in ink). */
export function Legend({ items }: { items: { label: string; color?: string; marker?: 'target' }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.marker === 'target' ? (
            <span aria-hidden className="h-3.5 w-0.5 rounded-full bg-fg" />
          ) : (
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: i.color }} />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** Vertical columns over time. Labels only the latest and the highest column. */
export function ColumnChart({ caption, points }: { caption: string; points: { label: string; value: number; detail: string }[] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  // Round the top up to a multiple of 4 with headroom, so ticks are whole numbers.
  const nice = Math.ceil((max * 1.1) / 4) * 4;
  const maxIndex = points.findIndex((p) => p.value === max);
  const ticks = [nice, nice / 2, 0];
  return (
    <div className="flex flex-col gap-2">
      <div className="relative mt-3 flex h-44 gap-3 ps-8">
        {ticks.map((t) => (
          <div key={t} aria-hidden className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${(t / nice) * 100}%` }}>
            <span className="w-6 -translate-y-px text-end text-xs text-fg-subtle tabular-nums">{t}</span>
            <span className={cn('h-px flex-1', t === 0 ? 'bg-border-strong' : 'bg-border-subtle')} />
          </div>
        ))}
        {points.map((p, i) => {
          const labelled = i === points.length - 1 || i === maxIndex;
          return (
            <Tooltip key={p.label} content={p.detail}>
              <div className="relative flex flex-1 flex-col items-center justify-end" aria-hidden>
                {labelled ? <Text as="span" variant="caption" weight="medium" numeric className="mb-1">{p.value}</Text> : null}
                <div
                  className="an-grow-y w-full max-w-10 rounded-t-sm"
                  style={{ height: `${(p.value / nice) * 100}%`, background: 'var(--an-chart-1)', minHeight: p.value ? 2 : 0, animationDelay: `${i * 30}ms` }}
                />
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div aria-hidden className="flex gap-3 ps-8">
        {points.map((p) => (
          <span key={p.label} className="flex min-w-0 flex-1 justify-center whitespace-nowrap text-xs text-fg-subtle">
            {p.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.label}>
              <th scope="row">{p.label}</th>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
