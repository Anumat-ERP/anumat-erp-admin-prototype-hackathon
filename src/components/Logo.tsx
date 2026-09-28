/**
 * The Anumat logo: Anumat Blue tile with the letter mark, plus wordmark. The wordmark follows the text colour.
 * The mark is redrawn from the hackathon logo image; swap in the designer's original paths when available.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 289.9 64" className={className} role="img" aria-label="Anumat">
      <rect width="64" height="64" rx="15" fill="#003D96" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M29.5 17 C26 12 20 13.5 21.5 20 L21.5 43 C21.5 49 17.5 51.5 13.5 49.5" />
        <path d="M51.5 17 C48 12 42 13.5 43.5 20 L43.5 43 C43.5 49 39.5 51.5 35.5 49.5" />
        <path d="M21.5 31.5 H43.5" />
      </g>
      <g transform="translate(82 3.2) scale(0.9)">
        <path d="M 3.5 50 L 17.5 14 L 31.5 50 M 9.5 37 H 25.5 M 44.5 50 V 14 L 70.5 50 V 14 M 83.5 14 V 37 A 13 13 0 0 0 109.5 37 V 14 M 122.5 50 V 14 L 139.5 38 L 156.5 14 V 50 M 169.5 50 L 183.5 14 L 197.5 50 M 175.5 37 H 191.5 M 201.5 14 H 227.5 M 214.5 14 V 50" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** The mark alone (blue tile and letter mark), for avatars and small spaces. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#003D96" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M29.5 17 C26 12 20 13.5 21.5 20 L21.5 43 C21.5 49 17.5 51.5 13.5 49.5" />
        <path d="M51.5 17 C48 12 42 13.5 43.5 20 L43.5 43 C43.5 49 39.5 51.5 35.5 49.5" />
        <path d="M21.5 31.5 H43.5" />
      </g>
    </svg>
  );
}
