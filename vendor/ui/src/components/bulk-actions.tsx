'use client';

import { ChevronDown } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { Fragment, useCallback, useMemo, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { formatCount } from '../lib/format';
import { Button } from './button';
import type { SelectionState } from './selection-checkbox';

/** How a record type is named in counts: `{ singular: 'order', plural: 'orders' }`. */
export interface ResourceName {
  singular: string;
  plural: string;
}

/**
 * The selection shared by ResourceList, DataTable and IndexTable: the ids
 * selected, or `'All'` — every record matching the current filters, across
 * all pages, including ones not loaded.
 */
export type Selection = string[] | 'All';

/** What a bulk action is about to act on. */
export interface SelectionScope {
  /** `true` when the selection is every matching record, not just loaded ids. */
  all: boolean;
  /** Number of records acted on. */
  count: number;
  /** The selected ids; empty when `all` — resolve "all" on the server with the current filters. */
  ids: string[];
}

export interface BulkAction {
  /** Verb, without the count: "Delete", "Mark as paid". Destructive actions get the count appended. */
  content: string;
  /** Called with what is selected. */
  onAction: (scope: SelectionScope) => void;
  /**
   * Destructive: styled critical and labelled with the count and scope
   * ("Delete 50 orders", "Delete all 1,284 orders") so nobody deletes more than they meant.
   */
  destructive?: boolean;
  /** Unavailable. Pair with `disabledReason`. */
  disabled?: boolean;
  /** Why it is disabled; shown as a tooltip and announced. */
  disabledReason?: string;
  /** Leading icon. */
  icon?: ReactNode;
}

function nounFor(n: number, name: ResourceName) {
  return n === 1 ? name.singular : name.plural;
}

/** "50 orders" / "all 1,284 orders" — the scope phrase used in destructive labels. */
export function scopeLabel(scope: Pick<SelectionScope, 'all' | 'count'>, name: ResourceName) {
  const phrase = `${formatCount(scope.count)} ${nounFor(scope.count, name)}`;
  return scope.all ? `all ${phrase}` : phrase;
}

/** The visible label for an action: destructive ones carry the scope. */
export function bulkActionLabel(action: BulkAction, scope: Pick<SelectionScope, 'all' | 'count'>, name: ResourceName) {
  return action.destructive ? `${action.content} ${scopeLabel(scope, name)}` : action.content;
}

/* -------------------------------------------------------------------------- */
/* Selection model                                                            */
/* -------------------------------------------------------------------------- */

export interface UseBulkSelectionOptions {
  /** Ids of the rows currently shown (this page). */
  pageIds: string[];
  /** Controlled selection. */
  selected: Selection;
  /** Called with the next selection. */
  onChange?: (next: Selection) => void;
  /** Total records matching the current filters, across all pages. */
  totalCount?: number;
}

/**
 * Selection logic shared by the list and table components. The header
 * checkbox acts on the visible page only; `selectAll` is the explicit,
 * separate step to `'All'`.
 */
export function useBulkSelection({ pageIds, selected, onChange, totalCount }: UseBulkSelectionOptions) {
  const allSelected = selected === 'All';
  const selectedSet = useMemo(() => new Set(allSelected ? pageIds : selected), [allSelected, pageIds, selected]);
  const selectedOnPage = pageIds.filter((id) => selectedSet.has(id)).length;
  const total = totalCount ?? pageIds.length;
  const selectedCount = allSelected ? total : selectedSet.size;

  const pageState: SelectionState =
    allSelected || (pageIds.length > 0 && selectedOnPage === pageIds.length)
      ? true
      : selectedOnPage > 0
        ? 'indeterminate'
        : false;

  const isSelected = useCallback((id: string) => selectedSet.has(id), [selectedSet]);

  const toggle = useCallback(
    (id: string, next?: boolean) => {
      if (!onChange) return;
      const set = new Set(selectedSet);
      const shouldSelect = next ?? !set.has(id);
      if (shouldSelect) set.add(id);
      else set.delete(id);
      // Leaving 'All' by unticking a row narrows to the loaded ids minus that row.
      onChange([...set]);
    },
    [onChange, selectedSet],
  );

  /** Header checkbox: selects or clears the visible page only — never 'All'. */
  const togglePage = useCallback(
    (next: boolean) => {
      if (!onChange) return;
      if (!next || allSelected) {
        onChange(allSelected ? [] : [...selectedSet].filter((id) => !pageIds.includes(id)));
        return;
      }
      onChange([...new Set([...selectedSet, ...pageIds])]);
    },
    [allSelected, onChange, pageIds, selectedSet],
  );

  const selectAll = useCallback(() => onChange?.('All'), [onChange]);
  const clear = useCallback(() => onChange?.([]), [onChange]);
  const selectPage = useCallback(() => onChange?.([...pageIds]), [onChange, pageIds]);

  const scope: SelectionScope = { all: allSelected, count: selectedCount, ids: allSelected ? [] : [...selectedSet] };

  return {
    allSelected,
    selectedCount,
    pageState,
    /** Every visible row is selected. */
    pageFullySelected: pageState === true,
    /** More records exist than are visible. */
    hasMore: total > pageIds.length,
    total,
    scope,
    isSelected,
    toggle,
    togglePage,
    selectAll,
    selectPage,
    clear,
  };
}

/* -------------------------------------------------------------------------- */
/* SelectAllActions                                                            */
/* -------------------------------------------------------------------------- */

export interface SelectAllActionsProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Rows selected. Ignored when `allSelected`. */
  selectedCount: number;
  /** Rows visible on this page. */
  pageItemCount: number;
  /** Records matching the current filters, across all pages. */
  totalCount: number;
  /** The selection is every matching record (`'All'`). */
  allSelected?: boolean;
  /** Record name used in the count. */
  resourceName: ResourceName;
  /** Escalate to every matching record. Omit to hide the "Select all" button. */
  onSelectAll?: () => void;
  /** Clear the selection. */
  onClearSelection?: () => void;
  /** Step back from "all" to just this page. Shown as "Undo" when "all" is selected. */
  onUndoSelectAll?: () => void;
}

/**
 * States exactly what is selected, and offers the explicit step up to
 * everything: "50 selected on this page · Select all 1,284 orders", then
 * "All 1,284 orders selected · Undo · Clear selection".
 *
 * Use inside BulkActions (it already includes it), or on its own in a custom
 * bar. Don't let a header checkbox imply "everything" without it.
 */
export function SelectAllActions({
  selectedCount,
  pageItemCount,
  totalCount,
  allSelected = false,
  resourceName,
  onSelectAll,
  onClearSelection,
  onUndoSelectAll,
  className,
  ...props
}: SelectAllActionsProps) {
  const pageFull = !allSelected && pageItemCount > 0 && selectedCount >= pageItemCount;
  const canEscalate = pageFull && totalCount > pageItemCount && onSelectAll;
  const text = allSelected
    ? `All ${formatCount(totalCount)} ${nounFor(totalCount, resourceName)} selected`
    : canEscalate
      ? `${formatCount(selectedCount)} selected on this page`
      : `${formatCount(selectedCount)} selected`;

  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1', className)} {...props}>
      <span className="text-md font-medium whitespace-nowrap text-fg tabular-nums">{text}</span>
      {canEscalate ? (
        <Button variant="plain" size="sm" onClick={onSelectAll}>
          Select all {formatCount(totalCount)} {nounFor(totalCount, resourceName)}
        </Button>
      ) : null}
      {allSelected && onUndoSelectAll ? (
        <Button variant="plain" size="sm" onClick={onUndoSelectAll}>
          Undo
        </Button>
      ) : null}
      {onClearSelection ? (
        <Button variant="plain" size="sm" onClick={onClearSelection}>
          Clear selection
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* BulkActions                                                                 */
/* -------------------------------------------------------------------------- */

export interface BulkActionsProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Rows selected. When 0 (and not `allSelected`) only the live region renders. */
  selectedCount: number;
  /** Rows visible on this page. */
  pageItemCount: number;
  /** Records matching the current filters, across all pages. Defaults to `pageItemCount`. */
  totalCount?: number;
  /** Everything matching is selected (`'All'`). */
  allSelected?: boolean;
  /** Record name for counts and destructive labels. */
  resourceName: ResourceName;
  /** Ids selected, passed to actions. Empty when `allSelected`. */
  selectedIds?: string[];
  /** Up to three actions shown as buttons. */
  promotedActions?: BulkAction[];
  /** Further actions, in a "More actions" menu. */
  actions?: BulkAction[];
  /** Escalate to every matching record. */
  onSelectAll?: () => void;
  /** Clear the selection. */
  onClearSelection?: () => void;
  /** From "all", go back to the visible page. */
  onUndoSelectAll?: () => void;
  /** Disable every action (e.g. offline). Say why with `disabledReason`. */
  disabled?: boolean;
  /** Why the actions are disabled; shown beside them. */
  disabledReason?: string;
}

const menuItemClass = cn(
  'flex min-h-control-sm cursor-default select-none items-center gap-2 rounded-sm px-2 py-1 text-md text-fg outline-none',
  'data-highlighted:bg-surface-hover data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
  '[&_svg]:size-4 [&_svg]:shrink-0',
);

/**
 * The bar shown while rows are selected: the exact count and scope, the step
 * up to "select all N", and the actions that apply to the selection.
 *
 * Use with ResourceList, DataTable and IndexTable (they render it for you
 * from `promotedBulkActions` / `bulkActions`), or with a custom list. Don't
 * use it for actions on a single record — put those on the row.
 *
 * The count is announced politely whenever it changes.
 */
export function BulkActions({
  selectedCount,
  pageItemCount,
  totalCount,
  allSelected = false,
  resourceName,
  selectedIds = [],
  promotedActions = [],
  actions = [],
  onSelectAll,
  onClearSelection,
  onUndoSelectAll,
  disabled = false,
  disabledReason,
  className,
  ...props
}: BulkActionsProps) {
  const total = totalCount ?? pageItemCount;
  const count = allSelected ? total : selectedCount;
  const active = allSelected || selectedCount > 0;
  const scope: SelectionScope = { all: allSelected, count, ids: allSelected ? [] : selectedIds };

  const announcement = !active
    ? ''
    : allSelected
      ? `All ${formatCount(total)} ${nounFor(total, resourceName)} selected`
      : `${formatCount(selectedCount)} ${nounFor(selectedCount, resourceName)} selected`;

  // Always mounted, so changes (including the first selection) are announced.
  const live = (
    <span className="sr-only" role="status" aria-live="polite" aria-atomic>
      {announcement}
    </span>
  );

  if (!active) return live;

  return (
    <div
      className={cn('flex min-h-control-md flex-wrap items-center justify-between gap-x-4 gap-y-2', className)}
      data-slot="bulk-actions"
      {...props}
    >
      {live}
      <SelectAllActions
        selectedCount={selectedCount}
        pageItemCount={pageItemCount}
        totalCount={total}
        allSelected={allSelected}
        resourceName={resourceName}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        onUndoSelectAll={onUndoSelectAll}
      />
      {promotedActions.length > 0 || actions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Bulk actions">
          {disabled && disabledReason ? <span className="text-sm text-fg-muted">{disabledReason}</span> : null}
          {promotedActions.map((action) => {
            const label = bulkActionLabel(action, scope, resourceName);
            const isDisabled = disabled || action.disabled;
            return (
              <Button
                key={action.content}
                size="sm"
                variant={action.destructive ? 'critical' : 'secondary'}
                icon={action.icon}
                disabled={isDisabled}
                title={isDisabled ? (action.disabledReason ?? disabledReason) : undefined}
                onClick={() => action.onAction(scope)}
              >
                {label}
              </Button>
            );
          })}
          {actions.length > 0 ? (
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger asChild disabled={disabled}>
                <Button size="sm" trailingIcon={<ChevronDown aria-hidden />} disabled={disabled}>
                  More actions
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={4}
                  className="z-(--a-z-index-dropdown) min-w-48 animate-pop-in rounded-lg border border-border bg-surface p-1 shadow-md"
                >
                  {actions.map((action, index) => {
                    const previous = actions[index - 1];
                    const startsDestructive = action.destructive && previous && !previous.destructive;
                    return (
                      <Fragment key={action.content}>
                        {startsDestructive ? <DropdownMenu.Separator className="my-1 h-px bg-border" /> : null}
                        <DropdownMenu.Item
                          disabled={action.disabled}
                          onSelect={() => action.onAction(scope)}
                          className={cn(menuItemClass, action.destructive && 'text-critical-subtle-fg data-highlighted:bg-critical-subtle')}
                        >
                          {action.icon ? <span aria-hidden className="inline-flex">{action.icon}</span> : null}
                          <span className="flex min-w-0 flex-col">
                            <span>{bulkActionLabel(action, scope, resourceName)}</span>
                            {action.disabled && action.disabledReason ? (
                              <span className="text-xs text-fg-muted">{action.disabledReason}</span>
                            ) : null}
                          </span>
                        </DropdownMenu.Item>
                      </Fragment>
                    );
                  })}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
