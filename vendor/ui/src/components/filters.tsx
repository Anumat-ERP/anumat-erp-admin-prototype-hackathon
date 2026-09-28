'use client';

import { ChevronDown, ListFilter, Plus, X } from 'lucide-react';
import { DropdownMenu, Popover } from 'radix-ui';
import { useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { SearchField } from './search-field';

export interface FilterDefinition {
  /** Stable key, matching `AppliedFilter.key`. */
  key: string;
  /** Name of the filter: "Status", "Payment date". */
  label: string;
  /** Content of the filter's popover — checkboxes, a date range, anything. It applies changes itself. */
  filter: ReactNode;
  /** Always show the pill, even when not applied — for the one or two filters used constantly. */
  pinned?: boolean;
  /** Can't be applied right now; say why. */
  disabled?: boolean;
}

export interface AppliedFilter {
  /** Key of the `FilterDefinition` it belongs to. */
  key: string;
  /** Human summary of the value: "Paid, Refunded", "Last 30 days". Shown as "Status: Paid, Refunded". */
  label: string;
  /** Remove this filter. */
  onRemove: () => void;
}

export interface FiltersProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'onChange'> {
  /** Available filters. */
  filters: FilterDefinition[];
  /** Filters currently applied, with a summary of their values. */
  appliedFilters: AppliedFilter[];
  /** Remove every filter and the query. */
  onClearAll: () => void;
  /** The free-text query. */
  queryValue?: string;
  /** Called (debounced) when the query changes. */
  onQueryChange?: (value: string) => void;
  /** Called when the query is cleared. */
  onQueryClear?: () => void;
  /** Placeholder for the query field. */
  queryPlaceholder?: string;
  /** Accessible name of the query field. Defaults to `queryPlaceholder`. */
  queryLabel?: string;
  /** Debounce for `onQueryChange`, ms. */
  debounceMs?: number;
  /** Show a spinner in the query field while results load. */
  loading?: boolean;
  /** Hide the query field — for filter-only bars. */
  hideQueryField?: boolean;
  /** Disable the whole bar, e.g. while offline. */
  disabled?: boolean;
  /** Extra controls at the end of the query row, e.g. a sort select. */
  children?: ReactNode;
}

const pillBase = cn(
  'inline-flex h-control-sm min-w-0 items-center gap-1 text-sm whitespace-nowrap',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  'disabled:cursor-not-allowed disabled:text-fg-disabled',
  '[&_svg]:size-3.5 [&_svg]:shrink-0',
);

const menuItemClass = cn(
  'flex h-control-sm cursor-default select-none items-center gap-2 rounded-sm px-2 text-md text-fg outline-none',
  'data-highlighted:bg-surface-hover data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
);

function summarize(applied: AppliedFilter[], filters: FilterDefinition[]) {
  if (applied.length === 0) return 'No filters applied';
  const parts = applied.map((a) => `${filters.find((f) => f.key === a.key)?.label ?? a.key}: ${a.label}`);
  return `${applied.length} ${applied.length === 1 ? 'filter' : 'filters'} applied. ${parts.join('; ')}`;
}

/**
 * A filter bar: a free-text query, one pill per applied (or pinned) filter
 * that opens its editor in a popover, "Add filter", and "Clear all".
 *
 * Use above a ResourceList, DataTable or IndexTable to narrow records. Pills
 * say what is applied ("Status: Paid, Refunded"), so the state of the list
 * is always visible. Don't use for a single yes/no toggle — a Switch or tabs
 * read better. Saved views are out of scope.
 *
 * The applied-filter summary is announced politely whenever it changes.
 */
export function Filters({
  filters,
  appliedFilters,
  onClearAll,
  queryValue,
  onQueryChange,
  onQueryClear,
  queryPlaceholder = 'Search',
  queryLabel,
  debounceMs,
  loading,
  hideQueryField = false,
  disabled = false,
  children,
  className,
  ...props
}: FiltersProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Filters added from "Add filter" but not yet given a value.
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const addedFromMenu = useRef(false);

  const appliedKeys = new Set(appliedFilters.map((a) => a.key));
  const visible = filters.filter((f) => f.pinned || appliedKeys.has(f.key) || pendingKeys.includes(f.key));
  const addable = filters.filter((f) => !visible.includes(f));
  const hasAnything = appliedFilters.length > 0 || Boolean(queryValue);

  const setOpen = (key: string, open: boolean) => {
    setOpenKey(open ? key : null);
    if (!open) setPendingKeys((keys) => keys.filter((k) => k !== key));
  };

  return (
    <div className={cn('flex flex-col gap-2', className)} data-slot="filters" {...props}>
      {hideQueryField && !children ? null : (
        <div className="flex flex-wrap items-center gap-2">
          {hideQueryField ? null : (
            <SearchField
              className="min-w-48 flex-1"
              size="sm"
              label={queryLabel ?? queryPlaceholder}
              placeholder={queryPlaceholder}
              value={queryValue}
              onChange={onQueryChange}
              onClear={onQueryClear}
              debounceMs={debounceMs}
              loading={loading}
              disabled={disabled}
            />
          )}
          {children}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        {visible.map((filter) => {
          const applied = appliedFilters.find((a) => a.key === filter.key);
          return (
            <Popover.Root key={filter.key} open={openKey === filter.key} onOpenChange={(open) => setOpen(filter.key, open)}>
              <span
                className={cn(
                  'inline-flex max-w-full items-stretch overflow-hidden rounded-md border',
                  applied
                    ? 'border-primary-border bg-primary-subtle text-primary-subtle-fg'
                    : 'border-dashed border-border-strong bg-surface text-fg-muted',
                )}
              >
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    disabled={disabled || filter.disabled}
                    className={cn(pillBase, 'rounded-md px-2.5 hover:bg-surface-hover', applied && 'hover:bg-transparent hover:underline')}
                  >
                    {applied ? (
                      <span className="truncate">
                        <span className="font-medium">{filter.label}:</span> {applied.label}
                      </span>
                    ) : (
                      <>
                        <span>{filter.label}</span>
                        <ChevronDown aria-hidden />
                      </>
                    )}
                  </button>
                </Popover.Trigger>
                {applied ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={applied.onRemove}
                    aria-label={`Remove ${filter.label} filter`}
                    title={`Remove ${filter.label} filter`}
                    className={cn(pillBase, 'justify-center rounded-md border-s border-primary-border px-1.5 hover:bg-primary-border/40')}
                  >
                    <X aria-hidden />
                  </button>
                ) : null}
              </span>
              <Popover.Portal>
                <Popover.Content
                  align="start"
                  sideOffset={4}
                  aria-label={`${filter.label} filter`}
                  className="z-(--a-z-index-popover) max-w-[calc(100vw-2rem)] min-w-56 animate-pop-in rounded-lg border border-border bg-surface p-3 text-fg shadow-md focus-visible:outline-none"
                >
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold text-fg">{filter.label}</p>
                    {filter.filter}
                    {applied ? (
                      <div className="flex justify-end border-t border-border-subtle pt-2">
                        <Button
                          variant="plain"
                          size="sm"
                          onClick={() => {
                            applied.onRemove();
                            setOpen(filter.key, false);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          );
        })}

        {addable.length > 0 ? (
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild disabled={disabled}>
              <Button size="sm" variant="tertiary" icon={<Plus aria-hidden />} disabled={disabled}>
                Add filter
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="start"
                sideOffset={4}
                className="z-(--a-z-index-dropdown) min-w-44 animate-pop-in rounded-lg border border-border bg-surface p-1 shadow-md"
                onCloseAutoFocus={(event) => {
                  // The chosen filter's popover takes focus instead of the trigger.
                  if (addedFromMenu.current) event.preventDefault();
                  addedFromMenu.current = false;
                }}
              >
                {addable.map((filter) => (
                  <DropdownMenu.Item
                    key={filter.key}
                    disabled={filter.disabled}
                    className={menuItemClass}
                    onSelect={() => {
                      addedFromMenu.current = true;
                      setPendingKeys((keys) => [...keys, filter.key]);
                      setOpenKey(filter.key);
                    }}
                  >
                    <ListFilter aria-hidden className="size-4 text-fg-subtle" />
                    {filter.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : null}

        {hasAnything ? (
          <Button size="sm" variant="plain" onClick={onClearAll} disabled={disabled} className="ms-1">
            Clear all
          </Button>
        ) : null}
      </div>

      <span className="sr-only" role="status" aria-live="polite" aria-atomic>
        {summarize(appliedFilters, filters)}
      </span>
    </div>
  );
}
