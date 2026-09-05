'use client';

import { useCallback, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  Check,
  Download,
  EllipsisVertical,
  ExternalLink,
  Link2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/ui-components';
import type { CompositionListItem } from '@/lib/schemas';

type Props = {
  slug: string;
  title: string;
  platform: CompositionListItem['platform'];
  embedUrl: string;
};

type DownloadStatus = 'idle' | 'loading' | 'done' | 'error';

const MENU_ITEM_CLASS =
  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-body-s text-secondary outline-none transition hover:bg-surface-2 hover:text-primary focus-visible:bg-surface-2 focus-visible:text-primary disabled:pointer-events-none disabled:opacity-40';

export function CompositionActions({ slug, title, platform, embedUrl }: Props) {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [copied, setCopied] = useState(false);

  const runDownload = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch(`/api/composition/download/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(`Download failed (${res.status})`);

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${slug}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setStatus('done');
      window.setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 4000);
    }
  }, [slug]);

  const copyLink = useCallback(async () => {
    const link =
      typeof window !== 'undefined'
        ? `${window.location.origin}/composition#${slug}`
        : `/composition#${slug}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }, [slug]);

  const busy = status === 'loading';
  const platformLabel = platform === 'youtube' ? 'YouTube' : 'Instagram';

  const downloadLabel =
    status === 'loading'
      ? 'Preparing…'
      : status === 'done'
        ? 'Downloaded'
        : status === 'error'
          ? 'Try again'
          : 'Download loop';

  return (
    <div className="flex items-center gap-2">
      <Button onClick={runDownload} disabled={busy} aria-busy={busy}>
        {status === 'loading' && <Loader2 className="animate-spin" aria-hidden />}
        {status === 'done' && <Check aria-hidden />}
        {(status === 'idle' || status === 'error') && <Download aria-hidden />}
        {downloadLabel}
      </Button>

      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={`More options for ${title}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-subtle bg-surface-1 text-secondary outline-none transition-soft hover:bg-surface-2 hover:text-primary focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
          >
            <EllipsisVertical className="h-4 w-4" aria-hidden />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            className="z-50 w-56 overflow-hidden rounded-xl border border-default bg-surface-1 p-1.5 text-primary shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out"
          >
            <Popover.Close asChild>
              <button
                type="button"
                onClick={runDownload}
                disabled={busy}
                className={MENU_ITEM_CLASS}
              >
                <Download className="h-4 w-4" aria-hidden />
                {busy ? 'Preparing…' : 'Download (.zip)'}
              </button>
            </Popover.Close>

            <Popover.Close asChild>
              <button type="button" onClick={copyLink} className={MENU_ITEM_CLASS}>
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <Link2 className="h-4 w-4" aria-hidden />
                )}
                {copied ? 'Link copied' : 'Copy loop link'}
              </button>
            </Popover.Close>

            <Popover.Close asChild>
              <a
                href={embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={MENU_ITEM_CLASS}
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Open on {platformLabel}
              </a>
            </Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <span aria-live="polite" className="sr-only">
        {status === 'loading'
          ? 'Preparing your download'
          : status === 'done'
            ? 'Download ready'
            : status === 'error'
              ? 'Download failed, try again'
              : ''}
      </span>
    </div>
  );
}
