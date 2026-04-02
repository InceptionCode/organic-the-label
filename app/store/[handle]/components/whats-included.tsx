import {
  Drum,
  Music2,
  Layers,
  Sparkles,
  Repeat,
  AudioLines,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { ProductWhatsIncluded, ProductCategories } from "@/lib/schemas";

const ICON_MAP: Record<string, LucideIcon> = {
  drums:    Drum,
  drum:     Drum,
  bass:     Music2,
  loops:    Repeat,
  loop:     Repeat,
  texture:  Layers,
  textures: Layers,
  fx:       Sparkles,
  effects:  Sparkles,
  sample:   AudioLines,
  samples:  AudioLines,
};

const CATEGORY_LABEL: Partial<Record<ProductCategories, string>> = {
  beat:   "Beat",
  kit:    "Kit",
  pack:   "Pack",
  bank:   "Bank",
  plugin: "Plugin",
  suite:  "Suite",
  free:   "Free",
  merch:  "Merch",
};

function getIcon(key?: string): LucideIcon {
  if (!key) return Package;
  return ICON_MAP[key.toLowerCase()] ?? Package;
}

function buildHeading(category?: ProductCategories): string {
  const prefix = category ? CATEGORY_LABEL[category] : undefined;
  return prefix ? `${prefix} Breakdown` : "Kit Breakdown";
}

type Props = {
  items: ProductWhatsIncluded;
  category?: ProductCategories;
};

export function WhatsIncluded({ items, category }: Props) {
  if (!items.length) return null;

  const heading = buildHeading(category);

  return (
    <div
      className="mt-14 pt-10"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      {/* Heading */}
      <div className="mb-6">
        <p className="eyebrow mb-2" style={{ color: "var(--accent-secondary)" }}>
          {heading}
        </p>
        <h2
          className="text-primary"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          WHAT&apos;S INCLUDED
        </h2>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, i) => {
          const Icon = getIcon(item.icon);
          return (
            <div
              key={i}
              className="card-glass rounded-xl"
              style={{ padding: "20px 18px 18px" }}
            >
              {/* Icon badge */}
              <div
                className="mb-3 flex items-center justify-center rounded-lg"
                style={{
                  width: 40,
                  height: 40,
                  background: "rgba(224,61,42,0.1)",
                  border: "1px solid rgba(224,61,42,0.18)",
                }}
              >
                <Icon
                  size={18}
                  style={{ color: "var(--accent-primary)" }}
                  strokeWidth={1.75}
                />
              </div>

              {/* Label */}
              <p
                className="mb-1.5"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
                  letterSpacing: "0.03em",
                  color: "var(--text-primary)",
                  lineHeight: 1.1,
                }}
              >
                {item.label}
              </p>

              {/* Description */}
              {item.description && (
                <p
                  style={{
                    fontSize: "0.72rem",
                    lineHeight: 1.55,
                    color: "var(--text-muted)",
                  }}
                >
                  {item.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
