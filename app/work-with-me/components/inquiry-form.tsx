"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { Button } from "@/ui-components";
import {
  WorkWithMeFormSchema,
  WorkWithMeProjectTypes,
  type WorkWithMeProjectType,
} from "@/lib/validation/work-with-me";
import { SectionHeading } from "./section-heading";

const inputStyle: CSSProperties = {
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-default)",
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "1rem",
  fontFamily: "var(--font-body)",
  lineHeight: "1.625rem",
  minHeight: "44px",
  width: "100%",
  outline: "none",
  transition: "border-color 200ms ease, box-shadow 200ms ease",
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239A8E7E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  paddingRight: "40px",
};

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-caption" style={{ color: "var(--text-muted)" }}>
        {label}{" "}
        {required ? (
          <span style={{ color: "var(--accent-primary)" }}>*</span>
        ) : (
          <span style={{ color: "var(--text-disabled)" }}>(optional)</span>
        )}
      </label>
      {children}
    </div>
  );
}

export function InquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState<WorkWithMeProjectType>("Collaboration");
  const [message, setMessage] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = WorkWithMeFormSchema.safeParse({
      name: name.trim(),
      email: email.trim(),
      projectType,
      message: message.trim(),
      marketingOptIn,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.name,
          email: parsed.data.email,
          category: "work_with_me",
          subject: `Work With Me — ${parsed.data.projectType}`,
          message: parsed.data.message,
          marketingOptIn: parsed.data.marketingOptIn,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-container">
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-14 md:items-start">
        <div className="flex flex-col">
          <SectionHeading
            eyebrow="Start a project"
            title="Tell me what you're making"
            description="Share the shape of the project and I'll get back to you with next steps."
          />
          <ul className="mt-8 flex flex-col gap-3">
            {[
              "Every message gets a personal reply, usually within 2 business days.",
              "No brief is too rough — a reference track and a deadline is enough to start.",
              "Rates and timelines depend on scope; you'll get a clear quote before anything begins.",
            ].map((line) => (
              <li key={line} className="flex gap-3 text-body-s text-secondary">
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--accent-primary)" }}
                />
                <span style={{ lineHeight: 1.55 }}>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: "20px",
            border: "1px solid rgba(224,61,42,0.28)",
            background: "var(--surface-1)",
            boxShadow: "0 0 0 1px rgba(224,61,42,0.08), var(--shadow-lg-premium)",
          }}
        >
          <div className="px-6 py-8 md:px-10 md:py-10">
            {submitted ? (
              <div
                className="rounded-xl px-6 py-10 text-center"
                style={{
                  background: "var(--accent-primary-soft)",
                  border: "1px solid rgba(224,61,42,0.22)",
                }}
              >
                <h3
                  className="mb-3 text-primary"
                  style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", letterSpacing: "0.03em" }}
                >
                  Message received
                </h3>
                <p className="text-body-m text-secondary">
                  Thanks for reaching out. I&apos;ll follow up at {email} soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                {error && (
                  <p
                    className="text-body-s rounded-lg px-4 py-3"
                    style={{
                      color: "var(--danger)",
                      background: "rgba(224,61,42,0.08)",
                      border: "1px solid rgba(224,61,42,0.2)",
                    }}
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" htmlFor="wwm-name" required>
                    <input
                      id="wwm-name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Email" htmlFor="wwm-email" required>
                    <input
                      id="wwm-email"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      inputMode="email"
                      style={inputStyle}
                    />
                  </Field>
                </div>

                <Field label="Project type" htmlFor="wwm-project-type" required>
                  <select
                    id="wwm-project-type"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as WorkWithMeProjectType)}
                    style={selectStyle}
                  >
                    {WorkWithMeProjectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Message" htmlFor="wwm-message" required>
                  <textarea
                    id="wwm-message"
                    placeholder="What are you working on, and what do you need?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }}
                  />
                </Field>

                <div style={{ borderTop: "1px solid var(--border-subtle)", marginBlock: "4px" }} />

                <label className="flex items-start gap-3 cursor-pointer" style={{ minHeight: "44px" }}>
                  <span className="relative flex-shrink-0" style={{ width: "20px", height: "20px", marginTop: "2px" }}>
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      aria-label="Subscribe to the Organic Sonics newsletter"
                      className="sr-only"
                    />
                    <span
                      className="flex items-center justify-center rounded transition-soft"
                      style={{
                        width: "20px",
                        height: "20px",
                        border: marketingOptIn
                          ? "2px solid var(--accent-primary)"
                          : "2px solid var(--border-strong)",
                        background: marketingOptIn ? "var(--accent-primary)" : "transparent",
                      }}
                      aria-hidden
                    >
                      {marketingOptIn && (
                        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                          <path
                            d="M1 3.5L4 6.5L10 1"
                            stroke="#F8F7F2"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                  </span>
                  <span className="text-caption" style={{ color: "var(--text-muted)", lineHeight: "1.5" }}>
                    Add me to the Organic Sonics newsletter — new drops, free resources, and occasional updates.
                  </span>
                </label>

                <Button type="submit" size="lg" className="w-full" disabled={loading} aria-busy={loading}>
                  {loading ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
