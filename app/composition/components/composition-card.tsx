import type { CompositionListItem } from '@/lib/schemas';
import { Tag } from '@/ui-components';
import { SocialEmbed } from './social-embed';
import { CompositionActions } from './composition-actions';

const PLATFORM_LABEL: Record<CompositionListItem['platform'], string> = {
  instagram: 'Instagram',
  youtube: 'YouTube Shorts',
};

function formatPostedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function CompositionCard({ composition }: { composition: CompositionListItem }) {
  const meta = [composition.bpm ? `${composition.bpm} BPM` : null, composition.musical_key]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <article className="card-base overflow-hidden rounded-lg">
      <div className="grid md:grid-cols-[minmax(0,340px)_1fr]">
        <div className="border-b border-subtle p-4 md:border-b-0 md:border-r">
          <SocialEmbed
            platform={composition.platform}
            url={composition.embed_url}
            title={composition.title}
          />
        </div>

        <div className="flex flex-col p-5">
          <p className="eyebrow mb-2 text-muted">
            {PLATFORM_LABEL[composition.platform]} · {formatPostedAt(composition.posted_at)}
          </p>
          <h3 className="text-h5 text-primary">{composition.title}</h3>
          {meta && <p className="meta mt-1">{meta}</p>}
          {composition.description && (
            <p className="mt-3 text-body-s text-secondary">{composition.description}</p>
          )}

          {composition.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {composition.tags.map((tag) => (
                <Tag key={tag} className="capitalize">
                  {tag}
                </Tag>
              ))}
            </div>
          ) : null}

          <div className="mt-auto pt-6">
            <CompositionActions
              slug={composition.slug}
              title={composition.title}
              platform={composition.platform}
              embedUrl={composition.embed_url}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
