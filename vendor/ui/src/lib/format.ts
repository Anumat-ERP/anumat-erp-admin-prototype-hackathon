/**
 * Formatting helpers whose output is read aloud as well as seen.
 */

/**
 * `151` -> `{ visual: '2:31', spoken: '2 minutes 31 seconds' }`.
 * A screen reader reads `2:31` as a time of day, so durations carry both.
 */
export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const visual = hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const parts = [
    hours > 0 && unit(hours, 'hour'),
    minutes > 0 && unit(minutes, 'minute'),
    (seconds > 0 || s === 0) && unit(seconds, 'second'),
  ].filter(Boolean);
  return { visual, spoken: parts.join(' ') };
}

/** Locale-aware count: `1284` -> `1,284`. */
export function formatCount(n: number, locale?: string) {
  return new Intl.NumberFormat(locale).format(n);
}

/** `1` item / `3` items. */
export function pluralize(n: number, singular: string, plural = `${singular}s`) {
  return `${formatCount(n)} ${n === 1 ? singular : plural}`;
}
