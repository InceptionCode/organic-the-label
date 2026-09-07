import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  id?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "flex flex-col items-center text-center" : "flex flex-col"}>
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden
          style={{ height: "1px", width: "32px", background: "var(--accent-primary)", opacity: 0.8 }}
        />
        <p className="eyebrow" style={{ color: "var(--accent-secondary)", letterSpacing: "0.18em" }}>
          {eyebrow}
        </p>
        {centered && (
          <span
            aria-hidden
            style={{ height: "1px", width: "32px", background: "var(--accent-primary)", opacity: 0.8 }}
          />
        )}
        {!centered && (
          <span
            aria-hidden
            style={{ height: "1px", width: "18px", background: "var(--accent-primary)", opacity: 0.35 }}
          />
        )}
      </div>

      <h2
        id={id}
        className="text-primary"
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(2rem, 4.5vw, 3rem)",
          letterSpacing: "0.025em",
          lineHeight: 1.05,
        }}
      >
        {title}
      </h2>

      {description && (
        <p
          className="text-body-m text-secondary mt-4"
          style={{ maxWidth: centered ? "540px" : "560px" }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
