import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { scales } from './tokens.generated';

/**
 * tailwind-merge only knows Tailwind's default scale names. Teach it ours so
 * `text-sm` vs `text-fg-muted` (size vs colour) and `shadow-xs` are grouped
 * correctly instead of one silently removing the other.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: Object.keys(scales.text),
      shadow: Object.keys(scales.shadow),
      radius: Object.keys(scales.radius),
      'font-weight': Object.keys(scales['font-weight']),
      tracking: Object.keys(scales.tracking),
      spacing: ['control-sm', 'control-md', 'control-lg'],
    },
  },
});

/** Compose class names; later Tailwind utilities win over earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
