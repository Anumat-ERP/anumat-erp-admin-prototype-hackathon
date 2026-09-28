'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { ImageIcon } from 'lucide-react';
import { useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export const thumbnailVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface',
  {
    variants: {
      size: {
        xs: 'size-6 [&_svg]:size-3.5',
        sm: 'size-10 [&_svg]:size-4',
        md: 'size-15 [&_svg]:size-6',
        lg: 'size-20 [&_svg]:size-8',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export interface ThumbnailProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** Image URL. When missing or broken, a neutral placeholder icon shows instead. */
  source?: string;
  /**
   * Required. Describe the image ("Blue canvas tote bag, front"), or pass `""`
   * when the product name is already written beside it, so it isn't read twice.
   */
  alt: string;
  /** xs 24px · sm 40px · md 60px · lg 80px. */
  size?: NonNullable<VariantProps<typeof thumbnailVariants>['size']>;
  /** Replace the placeholder icon shown when there's no image. */
  fallbackIcon?: ReactNode;
}

/**
 * A small, bordered preview of a product or file image. The whole image is
 * always visible (`object-contain`), so nothing is cropped off.
 *
 * Use in lists, tables and pickers beside the item's name. Don't use for
 * people or businesses (use Avatar), or for large hero images.
 */
export function Thumbnail({ source, alt, size, fallbackIcon, className, ...props }: ThumbnailProps) {
  const [failedSource, setFailedSource] = useState<string | undefined>(undefined);
  const showImage = Boolean(source) && failedSource !== source;

  return (
    <span className={cn(thumbnailVariants({ size }), !showImage && 'bg-surface-muted text-fg-subtle', className)} {...props}>
      {showImage ? (
        <img
          src={source}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSource(source)}
          className="size-full object-contain"
        />
      ) : (
        <>
          <span aria-hidden className="inline-flex">
            {fallbackIcon ?? <ImageIcon />}
          </span>
          {alt ? <span className="sr-only">{alt}</span> : null}
        </>
      )}
    </span>
  );
}
