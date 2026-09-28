'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { BulkActions, useBulkSelection, type BulkAction, type ResourceName, type Selection } from './bulk-actions';
import { SelectionCheckbox } from './selection-checkbox';
import { Spinner } from './spinner';

export type SortDirection = 'ascending' | 'descending';

export interface DataTableSort {
  /** Id of the sorted column. */
  columnId: string;
  direction: SortDirection;
}

export type SortValue = string | number | boolean | Date | null | undefined;

export interface DataTableColumn<T> {
  /** Stable id. Also the default key read from each row (`row[id]`). */
  id: string;
  /** Header content. */
  header: ReactNode;
  /** Horizontal alignment. Numeric columns default to `end`. */
  align?: 'start' | 'end';
  /** Figures: end-aligned, tabular numerals, sorted numerically. */
  numeric?: boolean;
  /** Clicking the header sorts by this column. */
  sortable?: boolean;
  /** Column width (CSS length or px). Also caps truncated cells. */
  width?: number | string;
  /** Keep to one line with an ellipsis; the full text is in the `title`. */
  truncate?: boolean;
  /** Render the cell. Defaults to `row[id]`. */
  cell?: (row: T, index: number) => ReactNode;
  /** Value to sort by, when the rendered cell isn't it (e.g. format currency, sort by amount). */
  sortValue?: (row: T) => SortValue;
}

export interface DataTableProps<T> extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Names the table for assistive tech and labels the scroll region. */
  caption: string;
  /** Hide the caption visually; it's still announced. */
  captionHidden?: boolean;
  /** Column definitions. */
  columns: DataTableColumn<T>[];
  /** Rows on this page. */
  rows: T[];
  /** Stable row id. Defaults to `row.id`. */
  getRowId?: (row: T, index: number) => string;
  /** Short name of a row, for its checkbox label ("Select order #1024"). Defaults to the id. */
  getRowLabel?: (row: T) => string;

  /** Controlled sort. When set, `rows` are shown as given — sort them yourself (e.g. on the server). */
  sort?: DataTableSort | null;
  /** Initial sort when uncontrolled. */
  defaultSort?: DataTableSort | null;
  /** Called with the next sort. Headers cycle ascending → descending. */
  onSort?: (sort: DataTableSort) => void;

  /** Totals, keyed by column id. The first column shows `totalsLabel` if it has no total. */
  totals?: Partial<Record<string, ReactNode>>;
  /** Where totals sit: `top` (in the header) or `bottom` (in the footer). */
  totalsPosition?: 'top' | 'bottom';
  /** Label for the totals row. */
  totalsLabel?: string;

  /** Keep the header visible while scrolling. Needs `maxHeight` so the table scrolls inside itself. */
  stickyHeader?: boolean;
  /** Keep the first column visible while scrolling sideways — for wide tables. */
  stickyFirstColumn?: boolean;
  /** Max height of the scroll area (CSS length or px). */
  maxHeight?: number | string;
  /** Row spacing. `dense` for analysis screens; `comfortable` for short tables. */
  density?: 'dense' | 'comfortable';
  /** Outer border and radius. Turn off inside a `Card flush`. */
  bordered?: boolean;

  /** Loading. Keeps the header; shows skeleton rows when there are no rows yet, otherwise dims rows under a spinner. */
  loading?: boolean;
  /** Force a loading style instead of choosing by whether rows exist. */
  loadingVariant?: 'auto' | 'skeleton' | 'overlay';
  /** Skeleton rows to show. */
  loadingRows?: number;
  /** Shown in the body when there are no rows. Pick the right empty for the situation. */
  emptyState?: ReactNode;
  /** Shown in the body when loading failed. Include a retry. */
  error?: ReactNode;
  /** Content above the table — filters, a toolbar. */
  toolbar?: ReactNode;
  /** A notice above the table, e.g. an offline banner. */
  alert?: ReactNode;
  /** Content below the table, e.g. pagination. */
  footer?: ReactNode;

  /** Show row checkboxes. Implied by `onSelectionChange`. */
  selectable?: boolean;
  /** Controlled selection: ids, or `'All'` for every matching row across pages. */
  selectedRows?: Selection;
  /** Called with the next selection. The header checkbox selects this page only. */
  onSelectionChange?: (selected: Selection) => void;
  /** Rows matching the current filters across all pages — enables "Select all N". */
  totalCount?: number;
  /** Record name for selection counts ("50 orders selected"). */
  resourceName?: ResourceName;
  /** Bulk actions shown as buttons. */
  promotedBulkActions?: BulkAction[];
  /** Bulk actions in "More actions". */
  bulkActions?: BulkAction[];
  /** Disable bulk actions (e.g. offline). */
  actionsDisabled?: boolean;
  /** Why bulk actions are disabled. */
  actionsDisabledReason?: string;
}

const defaultRowId = (row: unknown, index: number) => {
  const id = (row as { id?: unknown } | null)?.id;
  return id === undefined || id === null ? String(index) : String(id);
};

const read = (row: unknown, key: string) => (row as Record<string, unknown> | null)?.[key];

const isBlank = (v: unknown) => v === null || v === undefined || v === '';

/** Numbers numerically, dates by time, strings with `localeCompare` (numeric-aware). */
export function compareValues(a: unknown, b: unknown) {
  const x = a instanceof Date ? a.getTime() : a;
  const y = b instanceof Date ? b.getTime() : b;
  if (typeof x === 'number' && typeof y === 'number') return x - y;
  if (typeof x === 'boolean' && typeof y === 'boolean') return Number(x) - Number(y);
  return String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' });
}

const toCss = (v: number | string | undefined) => (typeof v === 'number' ? `${v}px` : v);

/**
 * A table for reading and comparing figures across records: orders by
 * value, stock by warehouse, invoices by age.
 *
 * Use when people analyse numbers — sort a column, scan totals, compare
 * rows. Don't use to find and open one record by name — use ResourceList.
 * Don't use for layout, and don't use for fewer than three columns — a
 * description list reads better.
 *
 * A real `<table>`: caption, `th` headers with `aria-sort`, numeric columns
 * end-aligned in tabular figures, totals in `thead`/`tfoot`. Wide tables
 * scroll inside a focusable region so keyboard users can scroll them.
 */
export function DataTable<T>({
  caption,
  captionHidden = false,
  columns,
  rows,
  getRowId = defaultRowId,
  getRowLabel,
  sort: sortProp,
  defaultSort = null,
  onSort,
  totals,
  totalsPosition = 'bottom',
  totalsLabel = 'Total',
  stickyHeader = false,
  stickyFirstColumn = false,
  maxHeight,
  density = 'dense',
  bordered = true,
  loading = false,
  loadingVariant = 'auto',
  loadingRows = 5,
  emptyState,
  error,
  toolbar,
  alert,
  footer,
  selectable: selectableProp,
  selectedRows = [],
  onSelectionChange,
  totalCount,
  resourceName = { singular: 'row', plural: 'rows' },
  promotedBulkActions,
  bulkActions,
  actionsDisabled = false,
  actionsDisabledReason,
  className,
  style,
  ...props
}: DataTableProps<T>) {
  const controlled = sortProp !== undefined;
  const [innerSort, setInnerSort] = useState<DataTableSort | null>(defaultSort);
  const sort = controlled ? sortProp : innerSort;

  const sortedRows = useMemo(() => {
    if (controlled || !sort) return rows;
    const column = columns.find((c) => c.id === sort.columnId);
    if (!column) return rows;
    const valueOf = (row: T) => (column.sortValue ? column.sortValue(row) : read(row, column.id));
    const factor = sort.direction === 'ascending' ? 1 : -1;
    return [...rows].sort((ra, rb) => {
      const a = valueOf(ra);
      const b = valueOf(rb);
      // Blanks sort last in either direction.
      if (isBlank(a) || isBlank(b)) return isBlank(a) === isBlank(b) ? 0 : isBlank(a) ? 1 : -1;
      return compareValues(a, b) * factor;
    });
  }, [controlled, sort, rows, columns]);

  const ids = useMemo(() => sortedRows.map((row, index) => getRowId(row, index)), [sortedRows, getRowId]);
  const selectable = selectableProp ?? Boolean(onSelectionChange);
  const total = totalCount ?? rows.length;
  const selection = useBulkSelection({ pageIds: ids, selected: selectedRows, onChange: onSelectionChange, totalCount: total });

  const handleSort = (columnId: string) => {
    const next: DataTableSort =
      sort?.columnId === columnId && sort.direction === 'ascending'
        ? { columnId, direction: 'descending' }
        : { columnId, direction: 'ascending' };
    if (!controlled) setInnerSort(next);
    onSort?.(next);
  };

  const cellPad = density === 'dense' ? 'px-3 py-2' : 'px-4 py-3';
  const showSkeleton = loading && (loadingVariant === 'skeleton' || (loadingVariant === 'auto' && rows.length === 0));
  const showOverlay = loading && !showSkeleton;
  const bodyMessage = !loading && error ? error : !loading && rows.length === 0 ? emptyState : null;
  const hasMessage = bodyMessage !== null && bodyMessage !== undefined;

  const alignOf = (c: DataTableColumn<T>) => c.align ?? (c.numeric ? 'end' : 'start');

  // Sticky positioning. The selection column is 40px (w-10) wide.
  const stickyFirst = (index: number, kind: 'head' | 'body') =>
    stickyFirstColumn && index === 0
      ? cn('sticky border-e border-border-subtle', selectable ? 'left-10' : 'left-0', kind === 'head' ? 'z-3' : 'z-1')
      : undefined;
  const stickySelect = (kind: 'head' | 'body') =>
    stickyFirstColumn ? cn('sticky left-0', kind === 'head' ? 'z-3' : 'z-1') : undefined;
  const headSticky = stickyHeader ? 'sticky top-0 z-2' : undefined;

  const cellClass = (c: DataTableColumn<T>) =>
    cn(cellPad, 'border-b border-border-subtle align-middle whitespace-nowrap', alignOf(c) === 'end' ? 'text-end' : 'text-start', c.numeric && 'tabular-nums');

  const totalsRow = totals ? (
    <tr className="bg-surface-muted">
      {selectable ? <td className={cn(cellPad, 'w-10 bg-inherit', stickySelect('body'), totalsBorder(totalsPosition))} /> : null}
      {columns.map((c, index) => {
        const value = totals[c.id];
        const content = index === 0 && (value === undefined || value === null) ? totalsLabel : value;
        const Cell = index === 0 ? 'th' : 'td';
        return (
          <Cell
            key={c.id}
            scope={index === 0 ? 'row' : undefined}
            className={cn(
              cellClass(c),
              'bg-inherit font-semibold text-fg',
              totalsBorder(totalsPosition),
              stickyFirst(index, 'body'),
              totalsPosition === 'top' && stickyHeader && 'sticky top-(--dt-head-h) z-2',
            )}
          >
            {content}
          </Cell>
        );
      })}
    </tr>
  ) : null;

  return (
    <div
      className={cn('relative flex min-w-0 flex-col', bordered && 'overflow-hidden rounded-lg border border-border bg-surface', className)}
      style={style}
      data-slot="data-table"
      {...props}
    >
      {captionHidden ? null : (
        // The real <caption> is visually hidden so the visible title can sit above the toolbar and bulk bar.
        <div aria-hidden className="px-3 pt-3 pb-2 text-lg font-semibold text-fg">
          {caption}
        </div>
      )}
      {toolbar ? <div className="border-b border-border px-3 py-3">{toolbar}</div> : null}
      {alert ? <div className="border-b border-border px-3 py-3">{alert}</div> : null}
      {selectable ? (
        selection.selectedCount > 0 ? (
          <BulkActions
            className="border-b border-border bg-surface-muted px-3 py-2"
            selectedCount={selection.selectedCount}
            pageItemCount={rows.length}
            totalCount={total}
            allSelected={selection.allSelected}
            selectedIds={selection.scope.ids}
            resourceName={resourceName}
            promotedActions={promotedBulkActions}
            actions={bulkActions}
            onSelectAll={selection.selectAll}
            onClearSelection={selection.clear}
            onUndoSelectAll={selection.selectPage}
            disabled={actionsDisabled}
            disabledReason={actionsDisabledReason}
          />
        ) : (
          <BulkActions selectedCount={0} pageItemCount={rows.length} resourceName={resourceName} />
        )
      ) : null}

      <div
        role="region"
        aria-label={caption}
        tabIndex={0}
        className="relative min-w-0 overflow-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        style={{ maxHeight: toCss(maxHeight), ['--dt-head-h' as string]: density === 'dense' ? '2.25rem' : '2.75rem' } as CSSProperties}
      >
        <table
          className={cn(
            'w-full border-separate border-spacing-0 text-md text-fg',
            // The container's border closes the table; the last row doesn't need its own.
            '[&>tbody>tr:last-child>*]:border-b-0',
          )}
          aria-busy={loading || undefined}
        >
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-surface-muted">
              {selectable ? (
                <th scope="col" className={cn(cellPad, 'w-10 border-b border-border bg-inherit', headSticky, stickySelect('head'))}>
                  <span className="flex items-center">
                    <SelectionCheckbox
                      checked={selection.pageState}
                      onCheckedChange={selection.togglePage}
                      label={`Select all ${rows.length} ${resourceName.plural} on this page`}
                      disabled={rows.length === 0 || loading}
                    />
                  </span>
                </th>
              ) : null}
              {columns.map((c, index) => {
                const sorted = sort?.columnId === c.id ? sort.direction : undefined;
                const end = alignOf(c) === 'end';
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={sorted}
                    style={{ width: toCss(c.width) }}
                    className={cn(
                      cellPad,
                      'border-b border-border bg-inherit text-sm font-medium whitespace-nowrap text-fg-muted',
                      end ? 'text-end' : 'text-start',
                      headSticky,
                      stickyFirst(index, 'head'),
                    )}
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(c.id)}
                        className={cn(
                          '-mx-1 inline-flex items-center gap-1 rounded-sm px-1 align-middle font-medium hover:text-fg',
                          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                          end && 'flex-row-reverse',
                          sorted && 'text-fg',
                          '[&_svg]:size-3.5 [&_svg]:shrink-0',
                        )}
                      >
                        <span>{c.header}</span>
                        {sorted === 'ascending' ? (
                          <ArrowUp aria-hidden />
                        ) : sorted === 'descending' ? (
                          <ArrowDown aria-hidden />
                        ) : (
                          <ArrowUpDown aria-hidden className="text-fg-subtle" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
            {totalsPosition === 'top' && !showSkeleton && rows.length > 0 ? totalsRow : null}
          </thead>
          <tbody className={cn(showOverlay && 'opacity-50')}>
            {showSkeleton
              ? Array.from({ length: loadingRows }, (_, r) => (
                  <tr key={`skeleton-${r}`} aria-hidden className="bg-surface">
                    {selectable ? (
                      <td className={cn(cellPad, 'w-10 border-b border-border-subtle bg-inherit', stickySelect('body'))}>
                        <div className="size-4 rounded-sm bg-skeleton" />
                      </td>
                    ) : null}
                    {columns.map((c, index) => (
                      <td key={c.id} className={cn(cellClass(c), 'bg-inherit', stickyFirst(index, 'body'))}>
                        <div
                          className={cn('my-1 h-3.5 animate-pulse rounded-sm bg-skeleton', alignOf(c) === 'end' && 'ms-auto')}
                          style={{ width: c.numeric ? '4rem' : `${55 + ((r * 17 + index * 23) % 40)}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : hasMessage
                ? null
                : sortedRows.map((row, r) => {
                    const id = ids[r] ?? String(r);
                    const isSelected = selectable && selection.isSelected(id);
                    return (
                      <tr
                        key={id}
                        data-selected={isSelected || undefined}
                        className={cn('bg-surface hover:bg-surface-hover', isSelected && 'bg-surface-selected hover:bg-surface-selected')}
                      >
                        {selectable ? (
                          <td className={cn(cellPad, 'w-10 border-b border-border-subtle bg-inherit', stickySelect('body'))}>
                            <span className="flex items-center">
                              <SelectionCheckbox
                                checked={isSelected}
                                onCheckedChange={(next) => selection.toggle(id, next)}
                                label={`Select ${getRowLabel ? getRowLabel(row) : id}`}
                              />
                            </span>
                          </td>
                        ) : null}
                        {columns.map((c, index) => {
                          const content = c.cell ? c.cell(row, r) : (read(row, c.id) as ReactNode);
                          const RowCell = index === 0 ? 'th' : 'td';
                          return (
                            <RowCell
                              key={c.id}
                              scope={index === 0 ? 'row' : undefined}
                              className={cn(cellClass(c), 'bg-inherit', index === 0 && 'font-medium', stickyFirst(index, 'body'))}
                            >
                              {c.truncate ? (
                                <div
                                  className={cn('truncate', alignOf(c) === 'end' && 'ms-auto')}
                                  style={{ maxWidth: toCss(c.width) ?? '16rem' }}
                                  title={typeof content === 'string' ? content : undefined}
                                >
                                  {content}
                                </div>
                              ) : (
                                content
                              )}
                            </RowCell>
                          );
                        })}
                      </tr>
                    );
                  })}
          </tbody>
          {totalsPosition === 'bottom' && totals && !showSkeleton && rows.length > 0 && !error ? <tfoot>{totalsRow}</tfoot> : null}
        </table>
      </div>

      {/* Outside the scroll area so it stays centred in view however wide the table is. */}
      {hasMessage ? <div className="px-4 py-8">{bodyMessage}</div> : null}

      {showOverlay ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg-muted shadow-sm">
            <Spinner size="sm" label={null} />
            Loading {resourceName.plural}…
          </span>
        </div>
      ) : null}

      {footer ? <div className="border-t border-border px-3 py-2">{footer}</div> : null}
    </div>
  );
}

function totalsBorder(position: 'top' | 'bottom') {
  return position === 'top' ? 'border-b border-border' : 'border-t border-b-0 border-border';
}
