'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Avatar as AvatarPrimitive } from 'radix-ui';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';

export const avatarVariants = cva(
  'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden border align-middle font-semibold',
  {
    variants: {
      size: {
        xs: 'size-5 text-xs tracking-tight',
        sm: 'size-7 text-xs',
        md: 'size-9 text-sm',
        lg: 'size-12 text-lg',
        xl: 'size-16 text-xl',
      },
      shape: {
        round: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: { size: 'md', shape: 'round' },
  },
);

/** Tones the fallback cycles through. Each pairs a subtle fill with its readable foreground. */
const TONES = [
  'border-primary-border bg-primary-subtle text-primary-subtle-fg',
  'border-info-border bg-info-subtle text-info-subtle-fg',
  'border-success-border bg-success-subtle text-success-subtle-fg',
  'border-warning-border bg-warning-subtle text-warning-subtle-fg',
  'border-critical-border bg-critical-subtle text-critical-subtle-fg',
] as const;

/** `'Ada Lovelace'` -> `'AL'`, `'acme'` -> `'A'`. Empty names give `''`. */
export function getInitials(name: string | undefined) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1] ?? '') : '';
  return (Array.from(first)[0] ?? '').concat(Array.from(last)[0] ?? '').toUpperCase();
}

/** A stable index for a name, so the same person always gets the same colour. */
export function getAvatarToneIndex(name: string | undefined, count = TONES.length) {
  let hash = 0;
  for (const ch of name ?? '') hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return hash % count;
}

type AvatarVariantProps = VariantProps<typeof avatarVariants>;

export interface AvatarProps extends Omit<ComponentPropsWithRef<typeof AvatarPrimitive.Root>, 'children'> {
  /**
   * The person's or business's name. Used for the initials, the colour and the
   * accessible name. Omit only when the avatar is purely decorative next to the
   * name in text.
   */
  name?: string;
  /** Image URL. The initials show while it loads and if it fails. */
  src?: string;
  /** xs 20px · sm 28px · md 36px · lg 48px · xl 64px. */
  size?: NonNullable<AvatarVariantProps['size']>;
  /** `round` for people; `square` for businesses, stores and apps. */
  shape?: NonNullable<AvatarVariantProps['shape']>;
  /**
   * Hide from assistive technology — set when the name is already written
   * beside the avatar, so it isn't read twice.
   */
  decorative?: boolean;
  /** ms to wait before showing the fallback, to avoid a flash on fast image loads. */
  fallbackDelayMs?: number;
}

/**
 * A picture or initials representing a person or business.
 *
 * Use beside names in lists, headers and comments. Don't use as the only
 * identification of someone when the name matters: show the name in text
 * too. For product images use Thumbnail.
 */
export function Avatar({
  name,
  src,
  size,
  shape,
  decorative = false,
  fallbackDelayMs,
  className,
  ...props
}: AvatarProps) {
  // Two letters don't fit legibly in 20px; xs shows the first only.
  const initials = size === 'xs' ? getInitials(name).slice(0, 1) : getInitials(name);
  const tone = TONES[getAvatarToneIndex(name)];
  const a11y = decorative || !name ? { 'aria-hidden': true as const } : { role: 'img', 'aria-label': name };

  return (
    <AvatarPrimitive.Root
      className={cn(avatarVariants({ size, shape }), tone, className)}
      data-shape={shape ?? 'round'}
      {...a11y}
      {...props}
    >
      {src ? <AvatarPrimitive.Image src={src} alt="" className="size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback
        delayMs={src ? fallbackDelayMs : undefined}
        className="flex size-full items-center justify-center leading-none"
      >
        {initials ? (
          <span aria-hidden>{initials}</span>
        ) : (
          <svg aria-hidden viewBox="0 0 24 24" className="size-3/5" fill="currentColor">
            <circle cx="12" cy="8.5" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0z" />
          </svg>
        )}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
