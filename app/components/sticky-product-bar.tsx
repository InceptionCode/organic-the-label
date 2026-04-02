"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/utils/helpers/product-helpers";
import type { Product } from "@/lib/schemas";

type StickyProductBarProps = {
  products: Product[];
};

export function StickyProductBar({ products }: StickyProductBarProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Show after 300px scroll
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 300) setVisible(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cycle products every 5s
  useEffect(() => {
    if (!visible || dismissed || products.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % products.length);
    }, 5000);
    return () => clearInterval(id);
  }, [visible, dismissed, products.length]);

  if (!products.length || dismissed) return null;

  const product = products[activeIndex];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sticky-bar"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="hidden sm:flex"
          style={{
            position: "fixed",
            bottom: "24px",
            left: "24px",
            zIndex: 100,
            width: "320px",
            flexDirection: "row",
            alignItems: "center",
            gap: "12px",
            padding: "12px 14px",
            borderRadius: "14px",
            background: "rgba(14,14,14,0.92)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(224,61,42,0.18)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* Thumbnail */}
          <AnimatePresence mode="wait">
            <motion.div
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: "relative",
                width: "52px",
                height: "52px",
                borderRadius: "8px",
                overflow: "hidden",
                flexShrink: 0,
                background: "rgba(255,255,255,0.06)",
              }}
            >
              {product.image?.url && (
                <Image
                  src={product.image.url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="52px"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Info */}
          <AnimatePresence mode="wait">
            <motion.div
              key={product.id + "-info"}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.25 }}
              className="flex-1 min-w-0"
            >
              <p
                className="truncate"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "0.9rem",
                  letterSpacing: "0.02em",
                  color: "#F8F7F2",
                  lineHeight: 1.2,
                }}
              >
                {product.name}
              </p>
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "rgba(212,196,168,0.65)",
                  marginTop: "2px",
                }}
              >
                {formatPrice(product.price)}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* CTA */}
          <Link
            href={`/store/${product.handle}`}
            style={{
              flexShrink: 0,
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#fff",
              background: "var(--accent-primary)",
              padding: "7px 12px",
              borderRadius: "6px",
              textDecoration: "none",
              transition: "background 150ms ease",
            }}
          >
            Get It
          </Link>

          {/* Close */}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss product bar"
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.35)",
              padding: "2px",
              lineHeight: 1,
            }}
          >
            <X size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
