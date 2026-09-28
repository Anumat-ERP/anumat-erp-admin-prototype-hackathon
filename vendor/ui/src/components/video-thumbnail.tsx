'use client';

import { Play } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';
import { formatDuration } from '../lib/format';

export interface VideoThumbnailProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** Poster image URL. Without one, a neutral surface shows behind the play button. */
  thumbnailUrl?: string;
  /**
   * What the video is: the start of the button's accessible name, followed
   * by the spoken duration ("Play: Setting up shipping, 2 minutes 31 seconds").
   */
  accessibilityLabel?: string;
  /** Length in seconds. Shown as `2:31`, announced as "2 minutes 31 seconds". */
  videoLength?: number;
  /** Seconds already watched. Draws a progress line along the bottom and is announced. */
  videoProgress?: number;
  /** Frame shape. */
  aspectRatio?: 'video' | 'square';
}

/**
 * A clickable poster frame that starts a video: play button, duration, and
 * how much has been watched.
 *
 * Use for tutorials and product videos that open in a player or modal on
 * click. Don't use for autoplaying media or for images that don't play
 * (use Thumbnail). The whole frame is one button, so the duration and
 * progress are part of its name rather than separate stops.
 */
export function VideoThumbnail({
  thumbnailUrl,
  accessibilityLabel = 'Play video',
  videoLength,
  videoProgress,
  aspectRatio = 'video',
  className,
  type,
  ...props
}: VideoThumbnailProps) {
  const duration = videoLength !== undefined ? formatDuration(videoLength) : null;
  const watched =
    videoProgress !== undefined && videoProgress > 0 ? formatDuration(Math.min(videoProgress, videoLength ?? videoProgress)) : null;
  const watchedPercent =
    watched && videoLength && videoLength > 0 ? Math.min(100, Math.round(((videoProgress ?? 0) / videoLength) * 100)) : 0;

  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'group @container relative block w-full overflow-hidden rounded-lg border border-border bg-surface-sunken text-start',
        aspectRatio === 'video' ? 'aspect-video' : 'aspect-square',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
      ) : null}

      <span className="sr-only">
        {accessibilityLabel}
        {duration ? `, ${duration.spoken}` : ''}
        {watched ? `, ${watched.spoken} watched` : ''}
      </span>

      <span
        aria-hidden
        className={cn(
          'absolute left-1/2 top-1/2 flex size-9 @3xs:size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full',
          'bg-surface-inverse text-fg-inverse shadow-md',
          'transition-transform duration-(--a-duration-fast) ease-standard group-hover:scale-105 group-active:scale-95',
        )}
      >
        <Play className="ml-0.5 size-4 fill-current @3xs:size-5" />
      </span>

      {duration ? (
        <span
          aria-hidden
          className="absolute bottom-2 right-2 rounded-sm bg-surface-inverse px-1.5 py-0.5 font-medium text-xs tabular-nums text-fg-inverse"
        >
          {duration.visual}
        </span>
      ) : null}

      {watched ? (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-surface-inverse/60">
          <span className="block h-full bg-primary" style={{ width: `${watchedPercent}%` }} />
        </span>
      ) : null}
    </button>
  );
}
