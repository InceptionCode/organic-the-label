import Image from "next/image";
import Link from "next/link";
import { getCachedProducts } from "@/lib/Shopify/products-cache";
import { formatPrice } from "@/utils/helpers/product-helpers";
import { Button } from "@/ui-components/button";

export async function LatestDrop() {
  const productTable =
    process.env.NODE_ENV === "development" ? "dev_products" : "prod_products";

  const { products } = await getCachedProducts({ sort: "newest" }, productTable);
  const product = products[0];

  if (!product) return null;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "#0d0d0d",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Deep red glow behind image */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "10%",
          left: "0%",
          width: "55%",
          height: "80%",
          background:
            "radial-gradient(ellipse at 40% 50%, rgba(224,61,42,0.18) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Grain overlay */}
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
        <div className="grid md:grid-cols-[55fr_45fr] gap-0 items-center min-h-[520px] md:min-h-[480px]">

          {/* LEFT — Product image */}
          <div className="relative flex items-center justify-center py-16 md:py-12 px-0 md:pr-12">
            <div
              className="relative w-full max-w-sm mx-auto overflow-hidden"
              style={{ borderRadius: "18px", aspectRatio: "3/4" }}
            >
              {product.image?.url ? (
                <Image
                  src={product.image.url}
                  alt={product.image.altText || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 45vw"
                  priority
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>
                    No image
                  </span>
                </div>
              )}
              {/* Grain overlay on image */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.04,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "repeat",
                  backgroundSize: "200px",
                  borderRadius: "18px",
                  mixBlendMode: "overlay",
                }}
              />
            </div>
          </div>

          {/* RIGHT — Product info */}
          <div className="flex flex-col justify-center py-16 md:py-12 md:pl-4">
            {/* Eyebrow with lines */}
            <div
              className="flex items-center gap-3 mb-6"
              style={{ color: "var(--accent-primary)" }}
            >
              <span
                style={{
                  display: "block",
                  height: "1px",
                  width: "28px",
                  background: "var(--accent-primary)",
                  opacity: 0.7,
                }}
              />
              <p
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                }}
              >
                Latest Release
              </p>
              <span
                style={{
                  display: "block",
                  height: "1px",
                  flex: 1,
                  background: "var(--accent-primary)",
                  opacity: 0.3,
                }}
              />
            </div>

            <h2
              className="mb-3"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2.2rem, 5vw, 4rem)",
                letterSpacing: "0.02em",
                lineHeight: 1,
                color: "#F8F7F2",
              }}
            >
              {product.name}
            </h2>

            {product.category && (
              <p
                className="mb-6"
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(212,196,168,0.6)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {product.category}
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-8">
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "2rem",
                  color: "#F8F7F2",
                  letterSpacing: "0.02em",
                }}
              >
                {formatPrice(product.price)}
              </span>
              {product.price === 0 && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    background: "rgba(224,61,42,0.15)",
                    color: "var(--accent-primary)",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    border: "1px solid rgba(224,61,42,0.3)",
                  }}
                >
                  Free
                </span>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Button asChild size="lg">
                <Link href={`/store/${product.handle}`}>Get It Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/store/${product.handle}`}>Learn More</Link>
              </Button>
            </div>

            {/* Thin red divider */}
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(to right, var(--accent-primary), transparent)",
                opacity: 0.4,
                maxWidth: "280px",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
