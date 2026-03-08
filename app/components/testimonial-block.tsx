import { Section } from '@/ui-components';
import { Container } from '@/ui-components';

type TestimonialBlockProps = {
  quote: string;
  author?: string;
  role?: string;
};

export function TestimonialBlock({
  quote,
  author = 'Producer',
  role = 'Organic Sonics customer',
}: TestimonialBlockProps) {
  return (
    <Section variant="standard">
      <Container>
        <blockquote className="max-w-2xl mx-auto text-center">
          <p className="text-display-m text-primary mb-6">&ldquo;{quote}&rdquo;</p>
          <footer>
            <cite className="text-body-m font-medium text-primary not-italic">{author}</cite>
            {role && <span className="text-body-s text-muted block mt-1">{role}</span>}
          </footer>
        </blockquote>
      </Container>
    </Section>
  );
}
