export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatShortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export const formatDateTime = (iso: string) => `${formatShortDate(iso)}, ${formatTime(iso)}`;

/** “3 hours ago”, “in 2 days”. */
export function formatRelative(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < hour) return rtf.format(Math.round(diff / minute), 'minute');
  if (abs < day) return rtf.format(Math.round(diff / hour), 'hour');
  return rtf.format(Math.round(diff / day), 'day');
}

/** Whole days from today to the date (negative = past). */
export function daysUntil(iso: string) {
  const a = new Date(iso);
  const b = new Date();
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export const formatHours = (h: number) => (!h ? '—' : h < 48 ? `${Math.round(h)} h` : `${(h / 24).toFixed(1)} days`);

export const formatNumber = (n: number) => n.toLocaleString('en-US');
