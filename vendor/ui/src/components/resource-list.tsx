'use client';

import {
  createContext,
  useContext,
  useId,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { formatCount } from '../lib/format';
import { BulkActions, useBulkSelection, type BulkAction, type ResourceName, type Selection } from './bulk-actions';
import { SelectionCheckbox } from './selection-checkbox';
import { Spinner } from './spinner';

/* -------------------------------------------------------------------------- */
/* Context                                                                     */
/* -------------------------------------------------------------------------- */

interface ResourceListContextValue {
  selectable: boolean;
  /** At least one item is selected — Space on a row toggles it. */
  selectMode: boolean;
  isSelected: (id: string) => boolean;
  toggle: (id: string, next?: boolean) => void;
  resourceName: ResourceName;
}

const ResourceListContext = createContext<ResourceListContextValue>({
  selectable: false,
  selectMode: false,
  isSelected: () => false,
  toggle: () => {},
  resourceName: { singular: 'item', plural: 'items' },
});

/* -------------------------------------------------------------------------- */
/* ResourceList                                                                */
/* -------------------------------------------------------------------------- */

export interface ResourceListSortOption {
  label: string;
  value: string;
}

export interface ResourceListProps<T> extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The records on this page. */
  items: T[];
  /** Render one record — usually a `ResourceItem`. */
  renderItem: (item: T, id: string, index: number) => ReactNode;
  /** Stable id for a record. Defaults to `item.id`. */
  idForItem?: (item: T, index: number) => string;
  /** Record name used in counts and labels. */
  resourceName?: ResourceName;
  /** Records matching the current filters across all pages. Enables "Showing 50 of 1,284" and "Select all". */
  totalItemsCount?: number;
  /** Show selection checkboxes. Implied by `onSelectionChange`. */
  selectable?: boolean;
  /** Controlled selection: ids, or `'All'` for every matching record across pages. */
  selectedItems?: Selection;
  /** Called with the next selection. The header checkbox selects this page only; "Select all N" yields `'All'`. */
  onSelectionChange?: (selected: Selection) => void;
  /** Bulk actions shown as buttons while items are selected. */
  promotedBulkActions?: BulkAction[];
  /** Bulk actions in the "More actions" menu. */
  bulkActions?: BulkAction[];
  /** Sort choices for the header select. */
  sortOptions?: ResourceListSortOption[];
  /** Current sort value. */
  sortValue?: string;
  /** Called with the chosen sort value. */
  onSortChange?: (value: string) => void;
  /** Filters (usually `<Filters>`) rendered above the header. Stays visible when empty. */
  filterControl?: ReactNode;
  /** Loading: keeps the current rows, dims them, and shows a spinner overlay. Sets `aria-busy`. */
  loading?: boolean;
  /** Shown instead of the list when `items` is empty and not loading. Pick the right empty for the situation. */
  emptyState?: ReactNode;
  /** Shown instead of the list when loading failed. Include a retry. */
  error?: ReactNode;
  /** Content above the list, below the filters — e.g. an offline banner. */
  alert?: ReactNode;
  /** Disable row shortcut actions and bulk actions, e.g. offline; say why in `alert`. */
  actionsDisabled?: boolean;
  /** Why actions are disabled, shown in the bulk actions bar. */
  actionsDisabledReason?: string;
  /** Hide the header row (count, sort, select-all). */
  showHeader?: boolean;
}

const defaultId = (item: unknown, index: number) => {
  const id = (item as { id?: unknown } | null)?.id;
  return id === undefined || id === null ? String(index) : String(id);
};

/**
 * A list of records — customers, products, suppliers — to find and act on.
 * Each row leads to the record; rows can be selected for bulk actions.
 *
 * Use when people scan for a record by name and open it, or act on a few
 * at once. Don't use to analyse or compare numbers across records — use
 * DataTable, which aligns figures in columns and sorts them. Don't use for
 * fewer than a handful of fixed items — a plain list in a Card is enough.
 *
 * Selection is controlled: the header checkbox selects the visible page,
 * and "Select all 1,284 customers" is a separate, explicit step to `'All'`.
 */
export function ResourceList<T>({
  items,
  renderItem,
  idForItem = defaultId,
  resourceName = { singular: 'item', plural: 'items' },
  totalItemsCount,
  selectable: selectableProp,
  selectedItems = [],
  onSelectionChange,
  promotedBulkActions,
  bulkActions,
  sortOptions,
  sortValue,
  onSortChange,
  filterControl,
  loading = false,
  emptyState,
  error,
  alert,
  actionsDisabled = false,
  actionsDisabledReason,
  showHeader = true,
  className,
  ...props
}: ResourceListProps<T>) {
  const sortId = useId();
  const ids = items.map((item, index) => idForItem(item, index));
  const selectable = selectableProp ?? Boolean(onSelectionChange);
  const total = totalItemsCount ?? items.length;
  const selection = useBulkSelection({ pageIds: ids, selected: selectedItems, onChange: onSelectionChange, totalCount: total });
  const selectMode = selectable && selection.selectedCount > 0;
  const isEmpty = items.length === 0 && !loading;
  const noun = total === 1 ? resourceName.singular : resourceName.plural;

  const countText =
    total > items.length
      ? `Showing ${formatCount(items.length)} of ${formatCount(total)} ${noun}`
      : `Showing ${formatCount(items.length)} ${items.length === 1 ? resourceName.singular : resourceName.plural}`;

  const header = showHeader && !isEmpty && !error && (
    <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2">
      {selectable ? (
        <SelectionCheckbox
          checked={selection.pageState}
          onCheckedChange={selection.togglePage}
          label={`Select all ${formatCount(items.length)} ${resourceName.plural} on this page`}
          disabled={items.length === 0}
        />
      ) : null}
      {selectMode ? (
        <BulkActions
          className="min-w-0 flex-1"
          selectedCount={selection.selectedCount}
          pageItemCount={items.length}
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
        <>
          {/* Keep the live region mounted so the first selection is announced. */}
          <BulkActions selectedCount={0} pageItemCount={items.length} resourceName={resourceName} />
          <p className="min-w-0 flex-1 text-sm text-fg-muted tabular-nums">{countText}</p>
          {sortOptions && sortOptions.length > 0 ? (
            <div className="flex items-center gap-2">
              <label htmlFor={sortId} className="text-sm whitespace-nowrap text-fg-muted">
                Sort by
              </label>
              <select
                id={sortId}
                value={sortValue}
                onChange={(event) => onSortChange?.(event.target.value)}
                className={cn(
                  'h-control-sm rounded-md border border-border-input bg-surface ps-2 pe-7 text-sm text-fg',
                  'hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <ResourceListContext.Provider
      value={{
        selectable,
        selectMode,
        isSelected: selection.isSelected,
        toggle: selection.toggle,
        resourceName,
      }}
    >
      <div className={cn('flex flex-col', className)} data-slot="resource-list" {...props}>
        {filterControl ? <div className="border-b border-border px-4 py-3">{filterControl}</div> : null}
        {alert ? <div className="border-b border-border px-4 py-3">{alert}</div> : null}
        {header}
        {error ? (
          <div className="px-4 py-8">{error}</div>
        ) : isEmpty ? (
          <div className="px-4 py-8">{emptyState}</div>
        ) : (
          <div className="relative" aria-busy={loading || undefined}>
            <ul
              aria-label={resourceName.plural.charAt(0).toUpperCase() + resourceName.plural.slice(1)}
              className={cn('flex flex-col', loading && 'pointer-events-none opacity-50')}
            >
              {items.map((item, index) => {
                const id = ids[index] ?? String(index);
                return <ResourceItemIdContext.Provider key={id} value={id}>{renderItem(item, id, index)}</ResourceItemIdContext.Provider>;
              })}
            </ul>
            {loading ? (
              <div className="absolute inset-0 flex items-start justify-center pt-12">
                <span className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg-muted shadow-sm">
                  <Spinner size="sm" label={null} />
                  Loading {resourceName.plural}…
                </span>
              </div>
            ) : null}
            {items.length === 0 && loading ? <div className="h-32" /> : null}
          </div>
        )}
      </div>
    </ResourceListContext.Provider>
  );
}

const ResourceItemIdContext = createContext<string | null>(null);

/* -------------------------------------------------------------------------- */
/* ResourceItem                                                                */
/* -------------------------------------------------------------------------- */

export interface ResourceItemProps extends Omit<ComponentPropsWithRef<'li'>, 'onClick' | 'id'> {
  /** Record id. Defaults to the id ResourceList passes to `renderItem`. */
  id?: string;
  /** The record's name, rendered as the row's link (or button) text. */
  name?: ReactNode;
  /** Link to the record. Makes the whole row a link, with a real `<a>` on `name`. */
  url?: string;
  /** Called when the row is activated. Without `url` the row becomes a button. */
  onClick?: (id: string) => void;
  /**
   * Accessible name of the row's link and checkbox, e.g. "View Acme Trading".
   * Required when there is no text `name`.
   */
  accessibilityLabel?: string;
  /** Avatar, thumbnail or icon before the content. */
  media?: ReactNode;
  /** Actions shown on hover and focus, at the end of the row. Keep to one or two. */
  shortcutActions?: ReactNode;
  /** Always show the shortcut actions (touch screens can't hover). */
  persistActions?: boolean;
  /** Secondary content under the name. */
  children?: ReactNode;
}

/**
 * One record in a ResourceList: optional media, the name as a real link,
 * secondary content, and shortcut actions revealed on hover or focus.
 *
 * The selection checkbox stops its events so selecting never opens the
 * record. With the row's link focused and items selected, Space toggles the
 * row's selection.
 */
export function ResourceItem({
  id: idProp,
  name,
  url,
  onClick,
  accessibilityLabel,
  media,
  shortcutActions,
  persistActions = false,
  children,
  className,
  onKeyDown,
  ...props
}: ResourceItemProps) {
  const ctx = useContext(ResourceListContext);
  const contextId = useContext(ResourceItemIdContext);
  const id = idProp ?? contextId ?? '';
  const selected = ctx.selectable && ctx.isSelected(id);
  const textName = typeof name === 'string' ? name : undefined;
  const label = accessibilityLabel ?? textName ?? id;
  const interactive = Boolean(url || onClick);

  const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === ' ' && ctx.selectable && ctx.selectMode && event.target === event.currentTarget.querySelector('[data-row-primary]')) {
      event.preventDefault();
      ctx.toggle(id);
    }
  };

  const primaryClass = cn(
    'min-w-0 truncate text-start text-md font-semibold text-fg hover:underline',
    // Stretch the link over the whole row.
    'after:absolute after:inset-0 after:content-[""]',
    'focus-visible:outline-none focus-visible:after:rounded-sm focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring',
  );

  const primary = !interactive ? (
    name ? <span className="min-w-0 truncate text-md font-semibold text-fg">{name}</span> : null
  ) : url ? (
    <a
      href={url}
      data-row-primary=""
      aria-label={accessibilityLabel}
      onClick={onClick ? () => onClick(id) : undefined}
      className={primaryClass}
    >
      {name ?? <span className="sr-only">{label}</span>}
    </a>
  ) : (
    <button
      type="button"
      data-row-primary=""
      aria-label={accessibilityLabel}
      onClick={() => onClick?.(id)}
      className={primaryClass}
    >
      {name ?? <span className="sr-only">{label}</span>}
    </button>
  );

  return (
    <li
      className={cn(
        'group relative flex items-start gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0',
        interactive && 'hover:bg-surface-hover',
        selected && 'bg-surface-selected hover:bg-surface-selected',
        className,
      )}
      data-selected={selected || undefined}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {ctx.selectable ? (
        <span className="relative z-1 flex h-6 items-center">
          <SelectionCheckbox checked={selected} onCheckedChange={(next) => ctx.toggle(id, next)} label={`Select ${label}`} />
        </span>
      ) : null}
      {media ? <div className="relative shrink-0">{media}</div> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {primary}
        {children ? <div className="min-w-0 text-sm text-fg-muted">{children}</div> : null}
      </div>
      {shortcutActions ? (
        <div
          className={cn(
            'relative z-1 flex shrink-0 items-center gap-1',
            !persistActions &&
              'opacity-0 transition-opacity duration-(--a-duration-fast) group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100',
          )}
        >
          {shortcutActions}
        </div>
      ) : null}
    </li>
  );
}
