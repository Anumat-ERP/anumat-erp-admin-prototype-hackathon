'use client';

import { CircleAlert, FileText, Upload, X } from 'lucide-react';
import { useId, useRef, useState, type ComponentPropsWithRef, type DragEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { IconButton } from './button';

export interface RejectedFile {
  file: File;
  reason: 'type' | 'size' | 'count';
  message: string;
}

export interface DropZoneProps extends Omit<ComponentPropsWithRef<'div'>, 'onDrop' | 'children'> {
  /** Visible label for the zone; also the file input's accessible name. */
  label: string;
  /** Hide the label visually (it is still announced). */
  labelHidden?: boolean;
  /** `accept` attribute: MIME types or extensions, e.g. `"image/*,.pdf"`. */
  accept?: string;
  /** Allow more than one file. */
  multiple?: boolean;
  /** Maximum size per file, in bytes. */
  maxSize?: number;
  /** Maximum number of files per drop. */
  maxFiles?: number;
  disabled?: boolean;
  /** Called with the accepted files and the rejected ones (with reasons). */
  onDrop?: (accepted: File[], rejected: RejectedFile[]) => void;
  /** Hint under the call to action, e.g. "PDF or CSV, up to 10 MB". */
  hint?: ReactNode;
  /** Error to show for the zone as a whole (e.g. an upload failed). */
  error?: string;
  /** Custom content replacing the default call to action — e.g. a file list. */
  children?: ReactNode;
  /** `sm` for inline use in forms; `md` for a page-level import. */
  size?: 'sm' | 'md';
}

function matchesAccept(file: File, accept?: string) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .some((a) => (a.startsWith('.') ? name.endsWith(a) : a.endsWith('/*') ? type.startsWith(a.slice(0, -1)) : type === a));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

/**
 * A file upload target: drag files onto it, or activate it to open the file
 * picker. The real `<input type="file">` covers the zone, so keyboard, screen
 * readers and mobile get the native picker; drag and drop is an enhancement.
 *
 * Use for importing files (CSV imports, invoice PDFs, product images).
 * Don't use it for a single optional attachment in a dense form — a plain
 * file button is lighter. Validation (type, size, count) runs before
 * `onDrop`; rejected files come back with a human-readable reason, so tell
 * the user which file failed and why.
 */
export function DropZone({
  label,
  labelHidden,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  disabled,
  onDrop,
  hint,
  error,
  children,
  size = 'md',
  className,
  ...props
}: DropZoneProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  function handle(files: File[]) {
    const accepted: File[] = [];
    const rejected: RejectedFile[] = [];
    const limit = multiple ? maxFiles ?? Infinity : 1;
    for (const file of files) {
      if (!matchesAccept(file, accept)) {
        rejected.push({ file, reason: 'type', message: `${file.name} isn’t an accepted file type.` });
      } else if (maxSize != null && file.size > maxSize) {
        rejected.push({ file, reason: 'size', message: `${file.name} is ${formatBytes(file.size)}; the limit is ${formatBytes(maxSize)}.` });
      } else if (accepted.length >= limit) {
        rejected.push({ file, reason: 'count', message: `${file.name} wasn’t added — only ${limit} file${limit === 1 ? '' : 's'} at a time.` });
      } else accepted.push(file);
    }
    onDrop?.(accepted, rejected);
  }

  const dragProps = disabled
    ? {}
    : {
        onDragEnter: (e: DragEvent) => {
          e.preventDefault();
          depth.current++;
          setDragging(true);
        },
        onDragOver: (e: DragEvent) => e.preventDefault(),
        onDragLeave: () => {
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setDragging(false);
        },
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          depth.current = 0;
          setDragging(false);
          handle(Array.from(e.dataTransfer.files));
        },
      };

  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      <label htmlFor={id} className={cn('text-md font-medium text-fg', labelHidden && 'sr-only')}>
        {label}
      </label>
      <div
        data-dragging={dragging || undefined}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center',
          'transition-colors duration-(--a-duration-fast) ease-standard',
          size === 'md' ? 'min-h-40 p-6' : 'min-h-20 p-4',
          'border-border-input bg-surface',
          !disabled && 'hover:bg-surface-hover',
          'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring',
          dragging && 'border-primary bg-primary-subtle',
          error && 'border-critical',
          disabled && 'cursor-not-allowed bg-surface-sunken',
        )}
        {...dragProps}
      >
        {children ?? (
          <>
            <Upload aria-hidden className={cn('size-6', 'text-fg-muted')} />
            <p className={cn('text-md', disabled ? 'text-fg-muted' : 'text-fg')}>
              <span className={cn('font-medium', !disabled && 'text-fg-link')}>Choose {multiple ? 'files' : 'a file'}</span>{' '}
              or drag {multiple ? 'them' : 'it'} here
            </p>
            {hint ? <p className={cn('text-sm', 'text-fg-muted')}>{hint}</p> : null}
          </>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn('absolute inset-0 size-full cursor-pointer opacity-0', disabled && 'cursor-not-allowed', children && 'hidden')}
          onChange={(e) => {
            handle(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm text-critical-subtle-fg">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface FileListItem {
  id: string;
  name: string;
  size: number;
  /** 0–100 while uploading; omit when done. */
  progress?: number;
  error?: string;
}

/** Files chosen in a DropZone, with progress and per-file errors. */
export function DropZoneFileList({
  files,
  onRemove,
  className,
}: {
  files: FileListItem[];
  onRemove?: (id: string) => void;
  className?: string;
}) {
  return (
    <ul className={cn('flex flex-col divide-y divide-border rounded-lg border border-border bg-surface', className)}>
      {files.map((f) => (
        <li key={f.id} className="flex items-center gap-3 px-3 py-2">
          <FileText aria-hidden className="size-5 shrink-0 text-fg-muted" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-md text-fg" title={f.name}>{f.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-fg-muted">{formatBytes(f.size)}</span>
            </div>
            {f.progress != null && !f.error ? (
              <progress
                className="h-1 w-full appearance-none overflow-hidden rounded-full bg-surface-sunken [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-surface-sunken [&::-webkit-progress-value]:bg-primary"
                value={f.progress}
                max={100}
                aria-label={`Uploading ${f.name}`}
              />
            ) : null}
            {f.error ? <span className="text-sm text-critical-subtle-fg">{f.error}</span> : null}
          </div>
          {onRemove ? <IconButton size="sm" icon={<X />} label={`Remove ${f.name}`} onClick={() => onRemove(f.id)} /> : null}
        </li>
      ))}
    </ul>
  );
}
