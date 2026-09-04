"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Button } from "@/ui-components";
import { SupportCategories } from "@/lib/validation/support";

// ── Grain SVG data URI ─────────────────────────────────────────────────────
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ── Category display labels ────────────────────────────────────────────────
const CATEGORY_LABELS: Record<(typeof SupportCategories)[number], string> = {
  order_issue: "Order issue",
  download_issue: "Download issue",
  licensing_question: "Licensing question",
  collaboration: "Collaboration",
  general: "General inquiry",
};

// ── Shared input style ─────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
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

// ── Field wrapper ──────────────────────────────────────────────────────────
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-caption" style={{ color: "var(--text-muted)" }}>
        {label}{" "}
        {required ? (
          <span style={{ color: "var(--accent-primary)" }}>*</span>
        ) : (
          <span style={{ color: "var(--text-disabled)" }}>(optional)</span>
        )}
      </span>
      {children}
    </div>
  );
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<(typeof SupportCategories)[number]>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Message must be at least 10 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim() || undefined,
          message: message.trim(),
          marketingOptIn,
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
    <div
      className="page-shell"
      style={{ minHeight: "100vh", background: "var(--bg-canvas)" }}
    >
      {/* ── Ambient backdrop ───────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `
            radial-gradient(ellipse 50% 35% at 50% -8%, rgba(224,61,42,0.09) 0%, transparent 70%),
            radial-gradient(ellipse 30% 25% at 20% 90%, rgba(138,114,80,0.06) 0%, transparent 60%)
          `,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.02,
          backgroundImage: GRAIN_SVG,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
        }}
      />

      <div
        className="content-container relative"
        style={{ zIndex: 1, paddingBlock: "4rem 6rem" }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <p className="eyebrow mb-4" style={{ color: "var(--accent-secondary)" }}>
            Contact
          </p>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(3rem, 7vw, 5rem)",
              letterSpacing: "0.025em",
              lineHeight: 1,
              color: "var(--text-primary)",
            }}
          >
            GET IN TOUCH
          </h1>
          <p
            className="text-body-m mt-4 mx-auto"
            style={{ color: "var(--text-secondary)", maxWidth: "480px" }}
          >
            Order issue, download trouble, or just want to talk shop — send a
            message and we&apos;ll get back to you.
          </p>
        </div>

        {/* ── Card ────────────────────────────────────────────────────── */}
        <div
          className="mx-auto overflow-hidden relative"
          style={{
            maxWidth: "720px",
            borderRadius: "20px",
            border: "1px solid var(--border-default)",
            background: "var(--surface-1)",
            boxShadow: "var(--shadow-lg-premium)",
          }}
        >
          {/* Grain on card */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: 0.03,
              backgroundImage: GRAIN_SVG,
              backgroundRepeat: "repeat",
              backgroundSize: "200px",
              borderRadius: "20px",
            }}
          />

          <div className="relative px-8 py-12 md:px-12">
            {/* Logo mark */}
            <div className="mb-8">
              <Image
                src="/brand-assets/organic-sonics-logo.png"
                alt="Organic Sonics"
                width={48}
                height={48}
                className="object-contain"
                style={{ opacity: 0.55 }}
              />
            </div>

            {submitted ? (
              /* ── Success state ── */
              <div
                className="rounded-xl px-8 py-10 text-center"
                style={{
                  background: "var(--accent-primary-soft)",
                  border: "1px solid rgba(224,61,42,0.22)",
                }}
              >
                <div
                  className="mx-auto mb-5 flex items-center justify-center"
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "var(--accent-primary)",
                  }}
                >
                  <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                    <path
                      d="M1.5 7.5L8 14L20.5 1.5"
                      stroke="#F8F7F2"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2
                  className="mb-3"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "2rem",
                    letterSpacing: "0.03em",
                    color: "var(--text-primary)",
                  }}
                >
                  MESSAGE RECEIVED
                </h2>
                <p className="text-body-m" style={{ color: "var(--text-secondary)" }}>
                  We got your message. We&apos;ll respond as soon as possible.
                </p>
                <p
                  className="text-caption mt-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  A confirmation email is on its way to {email}.
                </p>
              </div>
            ) : (
              /* ── Form ── */
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

                {/* Name + Email row */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Name" required>
                    <input
                      type="text"
                      id="contact-name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Email" required>
                    <input
                      type="email"
                      id="contact-email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      inputMode="email"
                      style={inputStyle}
                    />
                  </Field>
                </div>

                {/* Category */}
                <Field label="Category" required>
                  <select
                    id="contact-category"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as (typeof SupportCategories)[number])
                    }
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239A8E7E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 14px center",
                      paddingRight: "40px",
                    }}
                  >
                    {SupportCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Subject */}
                <Field label="Subject">
                  <input
                    type="text"
                    id="contact-subject"
                    placeholder="Brief topic or order number"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                {/* Message */}
                <Field label="Message" required>
                  <textarea
                    id="contact-message"
                    placeholder="Tell us what's going on…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    style={{
                      ...inputStyle,
                      minHeight: "140px",
                      resize: "vertical",
                    }}
                  />
                </Field>

                {/* Divider */}
                <div style={{ borderTop: "1px solid var(--border-subtle)", marginBlock: "4px" }} />

                {/* Newsletter opt-in */}
                <label className="flex items-start gap-3 cursor-pointer" style={{ minHeight: "44px" }}>
                  <span
                    className="relative flex-shrink-0"
                    style={{ width: "20px", height: "20px", marginTop: "2px" }}
                  >
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
                  <span
                    className="text-caption"
                    style={{ color: "var(--text-muted)", lineHeight: "1.5" }}
                  >
                    Add me to the Organic Sonics newsletter — new drops, free
                    resources, and occasional updates.
                  </span>
                </label>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? "Sending…" : "Send message →"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
