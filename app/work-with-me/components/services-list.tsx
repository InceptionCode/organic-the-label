import { SERVICES } from "@/lib/work-with-me/content";
import { SectionHeading } from "./section-heading";
import { SERVICE_ICONS } from "./service-icons";

export function ServicesList() {
  return (
    <section className="content-container section-y-standard" aria-labelledby="wwm-services-title">
      <SectionHeading
        id="wwm-services-title"
        eyebrow="Services"
        title="Ways to work together"
      />

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {SERVICES.map((service) => {
          const Icon = SERVICE_ICONS[service.icon];
          return (
            <li key={service.title} className="wwm-card card-padding-lg flex flex-col gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]"
                style={{
                  background: "var(--accent-primary-soft)",
                  color: "var(--accent-primary)",
                  border: "1px solid rgba(224,61,42,0.2)",
                }}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-h5 text-primary">{service.title}</p>
              <p className="text-body-s text-secondary" style={{ lineHeight: 1.6 }}>
                {service.blurb}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
