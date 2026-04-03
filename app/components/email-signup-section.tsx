"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Button } from "@/ui-components";
import { EmailVisual } from "@/app/components/email-visual";

export function EmailSignupSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <section
      className="relative"
      style={{
        background: "var(--bg-canvas)",
        borderTop: "1px solid var(--border-subtle)",
        paddingBlock: "4rem",
      }}
    >
      {/* Grain on outer dark section */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
        }}
      />

      <div className="content-container relative z-10">
        {/* ── Beige content wrapper ── */}
        <div
          className="overflow-hidden"
          style={{
            background: "#F8F7F2",
            borderRadius: "20px",
            border: "1px solid rgba(138,114,80,0.15)",
            boxShadow:
              "0 8px 48px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18)",
          }}
        >
          {/* Grain on beige card */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: 0.04,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
              backgroundSize: "200px",
              borderRadius: "20px",
            }}
          />

          <div className="grid md:grid-cols-2 gap-0 items-stretch min-h-[520px]">
            {/* LEFT — form */}
            <div className="flex flex-col justify-center py-14 px-10 md:px-12">
              {/* Brand mark */}
              <div className="mb-8">
                <Image
                  src="/brand-assets/organic-sonics-logo.png"
                  alt="Organic Sonics"
                  width={72}
                  height={72}
                  className="object-contain"
                  style={{ opacity: 0.75 }}
                />
              </div>

              <p className="eyebrow mb-4" style={{ color: "#8A7250" }}>
                Stay in the loop
              </p>
              <h2
                className="mb-4"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                  color: "#171717",
                }}
              >
                GET FREE RESOURCES
              </h2>
              <p
                className="text-body-m mb-10 max-w-sm"
                style={{ color: "#3D3730" }}
              >
                Early access to new drops, free samples, and exclusive deals —
                straight to your inbox. No spam, ever.
              </p>

              {submitted ? (
                <div
                  className="rounded-lg px-6 py-5"
                  style={{
                    background: "rgba(200,53,31,0.08)",
                    border: "1px solid rgba(200,53,31,0.3)",
                  }}
                >
                  <p
                    className="text-body-m font-medium"
                    style={{ color: "#C8351F" }}
                  >
                    You&apos;re in. Welcome to the community ✦
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-3"
                  noValidate
                >
                  {error && (
                    <p
                      className="text-body-s"
                      style={{ color: "#C8351F" }}
                      role="alert"
                    >
                      {error}
                    </p>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      aria-label="Your name"
                      className="w-full px-4 py-3 rounded-md text-body-m focus:outline-none transition-soft"
                      style={{
                        background: "#FFFFFF",
                        color: "#171717",
                        border: "1px solid rgba(23,23,23,0.14)",
                        minHeight: "44px",
                      }}
                    />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      aria-label="Email address"
                      className="w-full px-4 py-3 rounded-md text-body-m focus:outline-none transition-soft"
                      style={{
                        background: "#FFFFFF",
                        color: "#171717",
                        border: "1px solid rgba(23,23,23,0.14)",
                        minHeight: "44px",
                      }}
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    Sign up for free
                  </Button>
                  <p className="text-caption" style={{ color: "#7A7060" }}>
                    By signing up you agree to receive marketing emails from
                    Organic Sonics. Unsubscribe at any time.
                  </p>
                </form>
              )}
            </div>

            {/* RIGHT — 3D sound sculpture visual */}
            <div
              className="relative hidden md:block overflow-hidden"
              style={{
                borderLeft: "1px solid rgba(138,114,80,0.08)",
                background: "#070707",
              }}
            >
              <EmailVisual
                intensity={2}
                glowAmount={2}
                contourDensity={8}
                depthAmount={1.5}
                cameraIntensity={0.6}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
