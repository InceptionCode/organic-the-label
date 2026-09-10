"use client";

import { useEffect, useRef } from "react";
import {
  BRAND_BEIGE_NORM,
  BRAND_CREAM_NORM,
  BRAND_RED_DEEP_NORM,
  BRAND_RED_NORM,
} from "@/lib/constants";

export interface ParticlePortraitProps {
  /** Portrait source (e.g. a Spotify i.scdn.co URL). Falls back to `wordmark`. */
  imageUrl?: string | null;
  /** Drawn as the point source when there is no usable image. */
  wordmark?: string;
  className?: string;
  style?: React.CSSProperties;
}

type Rgb = readonly [number, number, number];

function lerp3(a: Rgb, b: Rgb, t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function tone(luma: number): [number, number, number] {
  const t = Math.pow(Math.min(1, Math.max(0, luma)), 0.75);
  let c = lerp3(BRAND_RED_DEEP_NORM, BRAND_RED_NORM, smoothstep(0.0, 0.32, t));
  c = lerp3(c, BRAND_BEIGE_NORM, smoothstep(0.42, 0.82, t));
  c = lerp3(c, BRAND_CREAM_NORM, smoothstep(0.86, 1.0, t));
  return c;
}

function resolveFontStack(stack: string): string {
  if (typeof window === "undefined") return stack;
  const root = getComputedStyle(document.documentElement);
  return stack.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_m, name: string) => {
    return root.getPropertyValue(name).trim() || "sans-serif";
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image load failed: ${src}`));
    img.src = src;
  });
}

const VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute vec3 aDir;
  attribute float aSeed;
  attribute float aLuma;
  uniform float uTime;
  uniform float uBreath;
  uniform float uBasePx;
  uniform float uPixelRatio;
  uniform float uCamDist;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec3 pos = position;

    // Per-point turbulence — cheap sin layers, no noise texture.
    float turb =
      sin(pos.x * 3.1 + uTime * 0.7) *
      sin(pos.y * 2.7 - uTime * 0.5) *
      sin(aSeed * 6.2831 + uTime * 0.9);

    // Breathe apart along each point's own direction, then re-form.
    pos += aDir * uBreath * (0.5 + 0.6 * turb);

    // Idle shimmer — always on so the cloud is never fully static.
    pos += 0.006 * vec3(
      sin(uTime * 0.6 + aSeed * 10.0),
      cos(uTime * 0.5 + aSeed * 7.0),
      sin(uTime * 0.4 + aSeed * 13.0)
    );

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uBasePx * uPixelRatio * (0.6 + aLuma * 0.7) * (uCamDist / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.14, d);
    gl_FragColor = vec4(vColor, a * uOpacity);
  }
`;

const GRAIN_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function ParticlePortrait({
  imageUrl,
  wordmark = "JUICEMAN",
  className = "",
  style,
}: ParticlePortraitProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === "undefined") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    let dead = false;
    let rafId = 0;
    let teardown: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      if (dead) return;

      const cw = el.clientWidth || 640;
      const ch = el.clientHeight || 720;

      // ── Load the source first so the raster can match its aspect ──────────
      let srcImg: HTMLImageElement | null = null;
      if (imageUrl) {
        try {
          srcImg = await loadImage(imageUrl);
          if (dead) return;
        } catch (err) {
          console.warn("[ParticlePortrait] image unusable, drawing wordmark", err);
        }
      }

      const srcAspect = srcImg ? srcImg.width / srcImg.height : 1.6;
      const longEdge = isMobile ? 170 : 260;
      const rasterW = srcAspect >= 1 ? longEdge : Math.round(longEdge * srcAspect);
      const rasterH = srcAspect >= 1 ? Math.round(longEdge / srcAspect) : longEdge;

      const off = document.createElement("canvas");
      off.width = rasterW;
      off.height = rasterH;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;

      let drewImage = false;
      if (srcImg) {
        try {
          octx.drawImage(srcImg, 0, 0, rasterW, rasterH); // contain — no crop
          octx.getImageData(0, 0, 1, 1); // CORS-taint probe
          drewImage = true;
        } catch (err) {
          console.warn("[ParticlePortrait] getImageData blocked, drawing wordmark", err);
        }
      }

      const drawWordmark = () => {
        octx.clearRect(0, 0, rasterW, rasterH);
        const face = resolveFontStack("var(--font-heading), 'Bebas Neue', sans-serif");
        let size = rasterH * 0.9;
        do {
          octx.font = `400 ${size}px ${face}`;
          size -= 2;
        } while (octx.measureText(wordmark).width > rasterW * 0.92 && size > 12);
        octx.fillStyle = "#ffffff";
        octx.textAlign = "center";
        octx.textBaseline = "middle";
        octx.fillText(wordmark, rasterW / 2, rasterH / 2);
      };
      if (!drewImage) drawWordmark();

      // ── Sample the raster into points ──────────────────────────────────────
      const longCells = isMobile ? 118 : 190;
      const cols = rasterW >= rasterH ? longCells : Math.round(longCells * (rasterW / rasterH));
      const rows = rasterW >= rasterH ? Math.round(longCells * (rasterH / rasterW)) : longCells;
      const maxPoints = isMobile ? 9000 : 22000;

      const buildGeometry = () => {
        const data = octx.getImageData(0, 0, rasterW, rasterH).data;
        const positions: number[] = [];
        const colors: number[] = [];
        const dirs: number[] = [];
        const seeds: number[] = [];
        const lumas: number[] = [];

        // World plane — fully inside the frame (no edge clipping), centered.
        const aspect = rasterW / rasterH;
        const fit = 3.7;
        const planeH = aspect >= 1 ? fit / aspect : fit;
        const planeW = planeH * aspect;

        // Pass 1 — sample every cell, gather luminance for an adaptive stretch.
        const cellLuma = new Float32Array(cols * rows);
        const cellAlpha = new Uint8Array(cols * rows);
        const hist: number[] = [];
        for (let gy = 0; gy < rows; gy++) {
          for (let gx = 0; gx < cols; gx++) {
            const px = Math.floor(((gx + 0.5) / cols) * rasterW);
            const py = Math.floor(((gy + 0.5) / rows) * rasterH);
            const i = (py * rasterW + px) * 4;
            const idx = gy * cols + gx;
            cellAlpha[idx] = data[i + 3];
            if (data[i + 3] < 10) continue;
            const l =
              (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
            cellLuma[idx] = l;
            hist.push(l);
          }
        }
        hist.sort((a, b) => a - b);
        const pct = (p: number) => hist[Math.floor((hist.length - 1) * p)] ?? 0;
        const lo = pct(0.04);
        const hi = Math.max(lo + 0.08, pct(0.96));
        // Cull anything in the darkest band of *this* image (its background),
        // capped so a bright image still keeps most of its points.
        const cullBelow = Math.min(0.34, pct(0.28));

        // Pass 2 — build points from the normalized values.
        for (let gy = 0; gy < rows; gy++) {
          for (let gx = 0; gx < cols; gx++) {
            const idx = gy * cols + gx;
            if (cellAlpha[idx] < 10) continue;
            const raw = cellLuma[idx];
            if (raw < cullBelow) continue;
            const luma = Math.min(1, Math.max(0, (raw - lo) / (hi - lo)));

            const x = ((gx + 0.5) / cols - 0.5) * planeW;
            const y = -((gy + 0.5) / rows - 0.5) * planeH;
            const z = (luma - 0.42) * 0.55;
            positions.push(x, y, z);

            const [cr, cg, cb] = tone(luma);
            colors.push(cr, cg, cb);
            lumas.push(luma);

            // pseudo-random dispersion direction — kept short so the image
            // stays readable even at the peak of the breath.
            const h = Math.sin((gx * 12.9898 + gy * 78.233) * 43758.5453);
            const ang = (h - Math.floor(h)) * Math.PI * 2;
            const rad = 0.14 + ((Math.sin(h * 91.7) + 1) / 2) * 0.5;
            dirs.push(Math.cos(ang) * rad, Math.sin(ang) * rad, (h - Math.floor(h) - 0.5) * 0.7);
            seeds.push((Math.sin(gx * 3.1 + gy * 7.7) + 1) / 2);
          }
        }

        // Cap density with a uniform random skip.
        const count = positions.length / 3;
        if (count > maxPoints) {
          const keep = maxPoints / count;
          const P: number[] = [], C: number[] = [], D: number[] = [], S: number[] = [], L: number[] = [];
          for (let k = 0; k < count; k++) {
            if (Math.random() > keep) continue;
            P.push(positions[k * 3], positions[k * 3 + 1], positions[k * 3 + 2]);
            C.push(colors[k * 3], colors[k * 3 + 1], colors[k * 3 + 2]);
            D.push(dirs[k * 3], dirs[k * 3 + 1], dirs[k * 3 + 2]);
            S.push(seeds[k]);
            L.push(lumas[k]);
          }
          return { P, C, D, S, L, count: P.length / 3 };
        }
        return { P: positions, C: colors, D: dirs, S: seeds, L: lumas, count };
      };

      const geom = new THREE.BufferGeometry();
      const applyGeometry = () => {
        const built = buildGeometry();
        geom.setAttribute("position", new THREE.Float32BufferAttribute(built.P, 3));
        geom.setAttribute("aColor", new THREE.Float32BufferAttribute(built.C, 3));
        geom.setAttribute("aDir", new THREE.Float32BufferAttribute(built.D, 3));
        geom.setAttribute("aSeed", new THREE.Float32BufferAttribute(built.S, 1));
        geom.setAttribute("aLuma", new THREE.Float32BufferAttribute(built.L, 1));
      };
      applyGeometry();

      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uBreath: { value: 0 },
          uOpacity: { value: 1.0 },
          uBasePx: { value: isMobile ? 2.9 : 3.4 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2) },
          uCamDist: { value: 7.4 },
        },
      });

      const points = new THREE.Points(geom, material);
      const scene = new THREE.Scene();
      scene.add(points);

      const camera = new THREE.PerspectiveCamera(34, cw / ch, 0.1, 100);
      camera.position.set(0, 0, 7.4);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
      renderer.setSize(cw, ch);
      renderer.setClearColor(0x000000, 0);
      const canvas = renderer.domElement;
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
      el.appendChild(canvas);

      // Re-bake once the real Bebas face loads (wordmark path only).
      if (!drewImage && document.fonts?.ready) {
        document.fonts.ready
          .then(() => {
            if (dead) return;
            drawWordmark();
            applyGeometry();
          })
          .catch(() => { });
      }

      // ── Resize ────────────────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(el);

      // ── Pointer parallax ─────────────────────────────────────────────────
      // Listen on `window`, not `el` — the hero's copy layer sits on top of the
      // canvas and would otherwise swallow the events. The rect is read once per
      // frame (in tick), not per pointer event, to avoid layout thrash.
      let mx = 0, my = 0, tmx = 0, tmy = 0;
      let ptrX = 0, ptrY = 0, ptrSeen = false;
      const clamp1 = (n: number) => Math.max(-1, Math.min(1, n));
      const onMove = (e: PointerEvent) => {
        ptrX = e.clientX;
        ptrY = e.clientY;
        ptrSeen = true;
      };
      if (!reducedMotion) window.addEventListener("pointermove", onMove, { passive: true });

      // ── Render loop ──────────────────────────────────────────────────────
      let prevTs = 0;
      const TWO_PI = Math.PI * 2;
      const BREATH_PERIOD = 15; // seconds

      const render = () => {
        renderer.render(scene, camera);
      };

      const tick = (ts: number) => {
        if (dead) return;
        const dt = prevTs ? Math.min((ts - prevTs) * 0.001, 0.05) : 0.016;
        prevTs = ts;
        const t = ts * 0.001;

        material.uniforms.uTime.value = t;
        // Strongly biased toward "formed" — the cloud holds the image most of
        // the cycle and only gently dilates.
        const raw = 0.5 - 0.5 * Math.cos((t * TWO_PI) / BREATH_PERIOD);
        material.uniforms.uBreath.value = Math.pow(raw, 3.5) * 0.5;

        // Resolve the pointer against the canvas rect once per frame.
        if (ptrSeen) {
          const r = el.getBoundingClientRect();
          if (r.width && r.height) {
            tmx = clamp1(((ptrX - r.left) / r.width) * 2 - 1);
            tmy = clamp1(-(((ptrY - r.top) / r.height) * 2 - 1));
          }
        }
        const ease = Math.min(1, dt * 3);
        mx += (tmx - mx) * ease;
        my += (tmy - my) * ease;
        // Pointer parallax + a slow autonomous drift so it's never dead still.
        points.rotation.y = mx * 0.16 + Math.sin(t * 0.08) * 0.05;
        points.rotation.x = -my * 0.1 + Math.sin(t * 0.05) * 0.03;
        points.rotation.z = Math.sin(t * 0.045) * 0.02;
        points.position.x = mx * 0.2;
        points.position.y = my * 0.14;

        render();
        rafId = requestAnimationFrame(tick);
      };

      if (reducedMotion) {
        material.uniforms.uBreath.value = 0;
        render();
      } else {
        rafId = requestAnimationFrame(tick);
      }

      teardown = () => {
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        geom.dispose();
        material.dispose();
        renderer.dispose();
        canvas.parentNode?.removeChild(canvas);
      };
    })().catch((err) => {
      if (!dead) console.warn("[ParticlePortrait]", err);
    });

    return () => {
      dead = true;
      cancelAnimationFrame(rafId);
      teardown?.();
    };
  }, [imageUrl, wordmark]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style }}
      aria-hidden="true"
      role="presentation"
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: GRAIN_SVG,
          opacity: 0.03,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 78% 82% at 55% 48%, transparent 30%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
