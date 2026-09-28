import type { ReactNode } from 'react';
import type { ResourceName } from './bulk-actions';
import { DataTable, type DataTableProps } from './data-table';
import { Filters, type FiltersProps } from './filters';

export interface IndexTableProps<T> extends Omit<DataTableProps<T>, 'toolbar' | 'resourceName'> {
  /** Record name for counts, selection and destructive labels (“Delete 50 orders”). Required here. */
  resourceName: ResourceName;
  /** Props for the Filters bar above the table. Omit for no filter bar. */
  filters?: FiltersProps;
  /** Extra toolbar content under the filters (e.g. view tabs). */
  toolbar?: ReactNode;
}

/**
 * The index page of a record type — “all orders”, “all invoices”: a filter
 * bar, a sortable DataTable with row selection, and bulk actions, wired to
 * work together.
 *
 * Use for a module’s main list screen, where people filter, select many
 * records and act on them in bulk. Don’t use for a read-only report — use
 * DataTable without selection — or for finding one record by name among
 * few columns — use ResourceList.
 *
 * Selection is controlled and scope-honest: the header checkbox selects the
 * visible page; “Select all 1,284 orders” is a separate step to `'All'`.
 * Clear the selection when filters change, so “all” never silently means a
 * different set.
 */
export function IndexTable<T>({ filters, toolbar, selectable = true, stickyHeader = true, ...props }: IndexTableProps<T>) {
  const bar =
    filters || toolbar ? (
      <div className="flex flex-col gap-3">
        {filters ? <Filters {...filters} /> : null}
        {toolbar}
      </div>
    ) : undefined;
  return <DataTable selectable={selectable} stickyHeader={stickyHeader} toolbar={bar} {...props} />;
}
