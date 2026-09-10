"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useStorage } from "@/utils/hooks/use-storage";

const ScrollScrubHero = dynamic(
  () => import("@/ui-components/scroll-scrub-hero").then((m) => m.ScrollScrubHero),
  { ssr: false, loading: () => null },
);

const SPLASH_KEY = "splashSeen";

export function SessionSplash() {
  const { setStorage, getStorage } = useStorage("session", SPLASH_KEY);
  const [show, setShow] = useState(false);
  const dismissedRef = useRef(false);
  const skipBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("splash") === "force") {
      setShow(true);
      return;
    }
    if (getStorage("session", SPLASH_KEY) === "true") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const automated = navigator.webdriver === true;
    if (reduced || automated) {
      setStorage("session", SPLASH_KEY, "true");
      return;
    }
    setShow(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setStorage("session", SPLASH_KEY, "true");
    setShow(false);
  }, [setStorage]);

  // Scroll-lock + Esc-to-dismiss + move focus into the overlay while shown.
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => skipBtnRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [show, dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="session-splash"
          className="fixed inset-0 z-[60] isolate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to Organic Sonics"
        >
          <ScrollScrubHero onEnter={dismiss} />

          <div className="absolute right-4 top-4 z-[80] flex flex-col items-end gap-1.5">
            <button
              ref={skipBtnRef}
              type="button"
              onClick={dismiss}
              data-testid="splash-skip"
              className="rounded-full px-3 py-1.5 text-caption uppercase tracking-[0.18em] transition-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
              style={{
                color: "var(--accent-secondary)",
                background: "rgba(23,23,23,0.55)",
                border: "1px solid rgba(212,196,168,0.28)",
                backdropFilter: "blur(8px)",
              }}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={dismiss}
              data-testid="splash-enter"
              className="text-caption uppercase tracking-[0.18em] opacity-60 transition-soft hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
              style={{ color: "var(--accent-secondary)" }}
            >
              Enter site &#8594;
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
