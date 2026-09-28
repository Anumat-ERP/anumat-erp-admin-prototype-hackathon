import { formatRelative } from '../lib/format';

const exact = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** "2 days ago", with the exact date and time on hover and for assistive tech. */
export function Time({ iso, className }: { iso: string; className?: string }) {
  return (
    <time dateTime={iso} title={exact(iso)} className={className}>
      {formatRelative(iso)}
    </time>
  );
}
