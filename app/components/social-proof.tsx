import { Section } from '@/ui-components';
import { Container } from '@/ui-components';

type SocialProofProps = {
  headline?: string;
  stats?: { value: string; label: string }[];
};

const defaultStats = [
  { value: '10k+', label: 'Producers' },
  { value: '50+', label: 'Packs' },
  { value: '4.9', label: 'Rating' },
];

export function SocialProof({ headline = 'Trusted by producers worldwide', stats = defaultStats }: SocialProofProps) {
  return (
    <Section variant="compact">
      <Container>
        <p className="text-body-m text-muted text-center mb-8">{headline}</p>
        <div className="flex flex-wrap justify-center gap-12 md:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-display-m text-primary">{stat.value}</p>
              <p className="text-caption text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
