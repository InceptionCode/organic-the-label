"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Button } from "@/ui-components";

// ── Grain SVG data URI (reused across the site) ────────────────────────────
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ── What's included items ───────────────────────────────────────────────────
const INCLUDES = [
  "Drum one-shots (kicks, snares, hi-hats, percs)",
  "Melodic loops and one-shots",
  "Analog Lab bank and Minifreak V preset",
  "Royalty-free — use in commercial projects",
];

export default function FreePage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/resources/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          resourceSlug: "starter-kit",
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
      {/* ── Ambient radial backdrop ────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `
            radial-gradient(ellipse 60% 40% at 50% -5%, rgba(224,61,42,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 80%, rgba(138,114,80,0.07) 0%, transparent 60%)
          `,
        }}
      />
      {/* Grain overlay */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.025,
          backgroundImage: GRAIN_SVG,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
        }}
      />

      <div
        className="content-container relative"
        style={{ zIndex: 1, paddingBlock: "4rem 6rem" }}
      >
        {/* ── Eyebrow ─────────────────────────────────────────────────── */}
        <p className="eyebrow mb-5 text-center" style={{ color: "var(--accent-secondary)" }}>
          Free Download
        </p>

        {/* ── Headline ────────────────────────────────────────────────── */}
        <h1
          className="text-center mb-4"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(3rem, 7vw, 5.5rem)",
            letterSpacing: "0.025em",
            lineHeight: 1,
            color: "var(--text-primary)",
          }}
        >
          FREE STARTER KIT
        </h1>
        <p
          className="text-body-l text-center mb-12 mx-auto"
          style={{ color: "var(--text-secondary)", maxWidth: "540px" }}
        >
          A curated pack of drum hits, loops, and textures — zero cost, zero
          strings. Drop your email and the link is yours.
        </p>

        {/* ── Two-column card ─────────────────────────────────────────── */}
        <div
          className="mx-auto overflow-hidden"
          style={{
            maxWidth: "860px",
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

          <div className="grid md:grid-cols-2 relative">
            {/* LEFT — what's inside */}
            <div
              className="flex flex-col justify-center py-12 px-10"
              style={{
                borderRight: "1px solid var(--border-subtle)",
              }}
            >
              {/* Logo mark */}
              <div className="mb-8">
                <Image
                  src="/brand-assets/organic-sonics-logo.png"
                  alt="Organic Sonics"
                  width={56}
                  height={56}
                  className="object-contain"
                  style={{ opacity: 0.65 }}
                />
              </div>

              <h2
                className="mb-6"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.75rem",
                  letterSpacing: "0.03em",
                  color: "var(--text-primary)",
                }}
              >
                WHAT&apos;S INSIDE
              </h2>

              <ul className="flex flex-col gap-3 mb-8">
                {INCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="flex-shrink-0 mt-1"
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--accent-primary)",
                        display: "block",
                        marginTop: "8px",
                      }}
                    />
                    <span className="text-body-s" style={{ color: "var(--text-secondary)" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <p
                className="text-caption"
                style={{
                  color: "var(--text-muted)",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                Delivered instantly to your inbox via email. No account required.
              </p>
            </div>

            {/* RIGHT — form */}
            <div className="flex flex-col justify-center py-12 px-10">
              {submitted ? (
                <div
                  className="rounded-lg px-6 py-8 text-center"
                  style={{
                    background: "var(--accent-primary-soft)",
                    border: "1px solid rgba(224,61,42,0.25)",
                  }}
                >
                  {/* Checkmark */}
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
                  <h3
                    className="mb-2"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.5rem",
                      letterSpacing: "0.03em",
                      color: "var(--text-primary)",
                    }}
                  >
                    IT&apos;S ON THE WAY
                  </h3>
                  <p className="text-body-s" style={{ color: "var(--text-secondary)" }}>
                    Check your inbox. Your download link is on the way.
                    Check your spam folder if you don&apos;t see it within a
                    few minutes.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                  <h2
                    className="mb-2"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.75rem",
                      letterSpacing: "0.03em",
                      color: "var(--text-primary)",
                    }}
                  >
                    GET THE KIT
                  </h2>

                  {error && (
                    <p
                      className="text-body-s rounded-md px-4 py-3"
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

                  {/* First name */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="free-firstName"
                      className="text-caption"
                      style={{ color: "var(--text-muted)" }}
                    >
                      First name <span style={{ color: "var(--text-disabled)" }}>(optional)</span>
                    </label>
                    <input
                      id="free-firstName"
                      type="text"
                      placeholder="Jay"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      className="w-full px-4 py-3 rounded-md text-body-m focus:outline-none transition-soft"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-default)",
                        minHeight: "44px",
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="free-email"
                      className="text-caption"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Email address <span style={{ color: "var(--accent-primary)" }}>*</span>
                    </label>
                    <input
                      id="free-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      inputMode="email"
                      className="w-full px-4 py-3 rounded-md text-body-m focus:outline-none transition-soft"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-default)",
                        minHeight: "44px",
                      }}
                    />
                  </div>

                  {/* Consent checkbox */}
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
                      Also add me to the Organic Sonics newsletter — new drops,
                      producer tips, and occasional free stuff.{" "}
                      <span style={{ color: "var(--text-disabled)" }}>Optional.</span>
                    </span>
                  </label>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading ? "Sending your link…" : "Send me the free kit →"}
                  </Button>

                  <p className="text-caption text-center" style={{ color: "var(--text-disabled)" }}>
                    No spam. Unsubscribe at any time.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
