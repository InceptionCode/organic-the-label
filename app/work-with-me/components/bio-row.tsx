import { Button } from "@/ui-components";
import { BIO } from "@/lib/work-with-me/content";
import { SectionHeading } from "./section-heading";
import { MusoCredits } from "./muso-credits";

type BioRowProps = {
  onCta: () => void;
};

export function BioRow({ onCta }: BioRowProps) {
  return (
    <section className="content-container section-y-standard" aria-labelledby="wwm-bio-title">
      <div className="grid gap-10 md:grid-cols-2 md:gap-14 md:items-center">
        <div className="flex flex-col">
          <SectionHeading id="wwm-bio-title" eyebrow="About" title={BIO.heading} />
          <div className="mt-5 flex flex-col gap-4">
            {BIO.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-body-m text-secondary" style={{ maxWidth: "52ch" }}>
                {paragraph}
              </p>
            ))}
          </div>

          <div
            className="mt-6 pl-4"
            style={{ borderLeft: "2px solid var(--accent-primary)", maxWidth: "52ch" }}
          >
            <p className="eyebrow" style={{ color: "var(--accent-secondary)" }}>
              The platform
            </p>
            <p className="text-body-s text-muted mt-2" style={{ lineHeight: 1.65 }}>
              {BIO.platformNote}
            </p>
          </div>

          <Button variant="outline" onClick={onCta} className="mt-7 w-fit">
            {BIO.ctaLabel}
          </Button>
        </div>

        <MusoCredits />
      </div>
    </section>
  );
}
