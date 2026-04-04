"use client";

import { useEffect, useRef } from 'react';
import type { Vec3 as OGLVec3 } from 'ogl';
import {
  BRAND_BEIGE_NORM,
  BRAND_CREAM_NORM,
  BRAND_RED_DEEP_NORM,
  BRAND_RED_HOT_NORM,
  BRAND_RED_NORM,
  type BrandRgbNormalized,
} from '@/lib/constants';

// ─────────────────────────────────────────────────────────────────────────────
// EmailVisual — Premium 3D WebGL sound sculpture for Organic Sonics
//
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailVisualProps {
  /** Master brightness multiplier for all opacities         (default 1) */
  intensity?: number;
  /** Overall animation speed multiplier                     (default 1) */
  motionSpeed?: number;
  /** Glow layer opacity multiplier                          (default 1) */
  glowAmount?: number;
  /** Number of contour rings to render, 1–6                 (default 6) */
  contourDensity?: number;
  /** Z-axis depth of Lissajous curve — 0 = flat, 2 = dramatic  (default 1) */
  depthAmount?: number;
  /** Pointer / camera parallax strength                     (default 0.4) */
  cameraIntensity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function EmailVisual({
  intensity = 1,
  motionSpeed = 1,
  glowAmount = 1,
  contourDensity = 6,
  depthAmount = 1,
  cameraIntensity = 0.4,
  className = '',
  style,
}: EmailVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    let rafId = 0;
    let dead = false;
    let teardown: (() => void) | null = null;

    (async () => {
      const { Renderer, Camera, Transform, Polyline, Vec3 } = await import('ogl');
      if (dead) return;

      const W = el.clientWidth || 600;
      const H = el.clientHeight || 600;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const renderer = new Renderer({ alpha: true, antialias: !isMobile, dpr, premultipliedAlpha: false });
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);

      const canvas = gl.canvas as HTMLCanvasElement;
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
      el.appendChild(canvas);
      renderer.setSize(W, H);

      const camera = new Camera(gl, { fov: 38, near: 0.01, far: 100 });
      camera.position.z = 4.2;
      camera.lookAt([0, 0, 0]);
      camera.perspective({ aspect: W / H });

      const scene = new Transform();

      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // ── GLSL fragment shaders ─────────────────────────────────────────────
      //
      // vUv.x = 0 (left edge) → 1 (right edge): cross-stroke position
      // vUv.y = 0 (tail/start) → 1 (head/end): progress along segment
      //
      // Edge glow uses vUv.x; tail-fade / head-flare use vUv.y

      // Contour ring: radial edge glow, uniform brightness along length
      const FRAG_RING = /* glsl */`
        precision highp float;
        uniform vec3  uColor;
        uniform float uAlpha;
        varying vec2  vUv;
        void main() {
          float edge = abs(vUv.x * 2.0 - 1.0);
          float glow = pow(1.0 - edge, 0.42);
          gl_FragColor = vec4(uColor * (0.5 + glow * 1.4), uAlpha * glow * glow);
        }
      `;

      // Signal trace: tail fades out, head flares bright
      const FRAG_SIGNAL = /* glsl */`
        precision highp float;
        uniform vec3  uColor;
        uniform float uAlpha;
        varying vec2  vUv;
        void main() {
          float edge  = abs(vUv.x * 2.0 - 1.0);
          float cross = pow(1.0 - edge, 0.28);
          float tail  = pow(vUv.y, 0.55);
          float flare = 1.0 + smoothstep(0.78, 1.0, vUv.y) * 3.0;
          gl_FragColor = vec4(uColor * flare, uAlpha * cross * tail);
        }
      `;

      // Atmospheric haze: very wide, very soft; creates bloom accumulation
      const FRAG_HAZE = /* glsl */`
        precision highp float;
        uniform vec3  uColor;
        uniform float uAlpha;
        varying vec2  vUv;
        void main() {
          float edge = abs(vUv.x * 2.0 - 1.0);
          float glow = pow(1.0 - edge, 2.8) * 0.80;
          float tail = pow(vUv.y, 0.40);
          gl_FragColor = vec4(uColor, uAlpha * glow * tail);
        }
      `;

      const RED: BrandRgbNormalized = BRAND_RED_NORM;
      const RED_HOT: BrandRgbNormalized = BRAND_RED_HOT_NORM;
      const RED_DEEP: BrandRgbNormalized = BRAND_RED_DEEP_NORM;
      const CREAM: BrandRgbNormalized = BRAND_CREAM_NORM;
      const BEIGE: BrandRgbNormalized = BRAND_BEIGE_NORM;

      // ── Geometry helpers ─────────────────────────────────────────────────

      const ringVert = (
        i: number, segs: number,
        radius: number, bumps: number, amp: number,
        zPos: number, tiltX: number, tiltY: number,
        rotPhase: number, timePhase: number,
      ): [number, number, number] => {
        const θ = (i / segs) * Math.PI * 2 + rotPhase;
        const r = radius
          + amp * Math.sin(bumps * θ + timePhase)
          + amp * 0.45 * Math.sin((bumps + 1) * θ + 1.1 + timePhase * 0.70)
          + amp * 0.25 * Math.cos((bumps - 1) * θ + 0.7 + timePhase * 0.50);
        const x = r * Math.cos(θ);
        const y = r * Math.sin(θ);
        const z = zPos + Math.sin(bumps * θ * 0.5 + timePhase * 0.8) * amp * 0.14;
        const cx = Math.cos(tiltX), sx = Math.sin(tiltX);
        const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
        const cy = Math.cos(tiltY), sy = Math.sin(tiltY);
        return [x * cy + z1 * sy, y1, -x * sy + z1 * cy];
      };

      const buildRingPts = (
        segs: number, radius: number, bumps: number, amp: number,
        zPos: number, tiltX: number, tiltY: number,
        rotPhase: number, timePhase: number,
      ): OGLVec3[] =>
        Array.from({ length: segs + 1 }, (_, i) => {
          const [x, y, z] = ringVert(i, segs, radius, bumps, amp, zPos, tiltX, tiltY, rotPhase, timePhase);
          return new Vec3(x, y, z);
        });

      // Mutate Vec3 array in-place — avoids allocation pressure in 60fps loop
      const refreshRingPts = (
        pts: OGLVec3[], segs: number, radius: number, bumps: number, amp: number,
        zPos: number, tiltX: number, tiltY: number,
        rotPhase: number, timePhase: number,
      ): void => {
        for (let i = 0; i <= segs; i++) {
          const [x, y, z] = ringVert(i, segs, radius, bumps, amp, zPos, tiltX, tiltY, rotPhase, timePhase);
          pts[i].set(x, y, z);
        }
      };

      // 3D Lissajous: a=1 b=2 (∞ in XY) + c=3 on Z (twists path through space)
      const buildLissPts = (n: number, depthScale: number): OGLVec3[] =>
        Array.from({ length: n + 1 }, (_, i) => {
          const t = (i / n) * Math.PI * 2;
          return new Vec3(
            0.88 * Math.sin(t + Math.PI * 0.5),
            0.88 * Math.sin(2 * t),
            0.38 * Math.sin(3 * t) * depthScale,
          );
        });

      // ── Polyline factory ─────────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allLines: any[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mkLine = (pts: OGLVec3[], frag: string, color: BrandRgbNormalized, alpha: number, thickness: number): any => {
        const line = new Polyline(gl, {
          points: pts,
          fragment: frag,
          uniforms: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            uColor: { value: color as any },
            uAlpha: { value: alpha },
            uThickness: { value: thickness },
          },
        });
        line.mesh.setParent(scene);
        line.resize();
        allLines.push(line);
        return line;
      };

      // ── Scene: contour rings ─────────────────────────────────────────────
      const N_RINGS = isMobile ? Math.min(contourDensity, 4) : contourDensity;
      const SEGS = isMobile ? 80 : 128;

      type RC = {
        r: number; bumps: number; amp: number; z: number;
        tx: number; ty: number; ro: number; col: BrandRgbNormalized;
        op: number; spd: number; toff: number;
      };

      const RING_CONFIGS: RC[] = [
        { r: 1.42, bumps: 4, amp: 0.088, z: -0.42, tx: 0.14, ty: -0.11, ro: 0.00, col: BEIGE, op: 0.50, spd: 0.055, toff: 0.00 },
        { r: 1.18, bumps: 5, amp: 0.075, z: 0.27, tx: -0.21, ty: 0.19, ro: 0.40, col: CREAM, op: 0.44, spd: -0.068, toff: 1.37 },
        { r: 0.94, bumps: 4, amp: 0.065, z: -0.21, tx: 0.11, ty: -0.08, ro: 0.90, col: CREAM, op: 0.42, spd: 0.082, toff: 2.74 },
        { r: 0.71, bumps: 6, amp: 0.056, z: 0.15, tx: -0.15, ty: 0.13, ro: 1.50, col: RED_DEEP, op: 0.46, spd: -0.062, toff: 4.11 },
        { r: 0.49, bumps: 4, amp: 0.050, z: -0.10, tx: 0.21, ty: -0.16, ro: 2.10, col: RED_DEEP, op: 0.54, spd: 0.095, toff: 5.48 },
        { r: 0.28, bumps: 3, amp: 0.040, z: 0.05, tx: -0.10, ty: 0.11, ro: 0.30, col: RED, op: 0.64, spd: -0.042, toff: 6.85 },
      ].slice(0, N_RINGS);

      type RingObj = {
        pts: OGLVec3[];
        glowPts: OGLVec3[] | null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        crisp: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        glow: any | null;
        cfg: RC;
      };
      const rings: RingObj[] = [];

      for (const cfg of RING_CONFIGS) {
        const pts = buildRingPts(SEGS, cfg.r, cfg.bumps, cfg.amp, cfg.z, cfg.tx, cfg.ty, cfg.ro, 0);
        const glowPts = isMobile
          ? null
          : buildRingPts(SEGS, cfg.r, cfg.bumps, cfg.amp, cfg.z, cfg.tx, cfg.ty, cfg.ro, 0);

        // Glow behind, crisp in front
        const glow = glowPts
          ? mkLine(glowPts, FRAG_RING, cfg.col, cfg.op * 0.35 * intensity * glowAmount, 6.5)
          : null;
        const crisp = mkLine(pts, FRAG_RING, cfg.col, cfg.op * intensity, 1.5);

        rings.push({ pts, glowPts, glow, crisp, cfg });
      }

      // ── Scene: Lissajous signal ──────────────────────────────────────────
      const LISS_N = isMobile ? 600 : 1200;
      const SEG_LEN = Math.floor(LISS_N * 0.42);
      const allLiss = buildLissPts(LISS_N, depthAmount);

      // Ghost: full static path, very dim — the "track" the signal follows
      mkLine(allLiss, FRAG_RING, RED_DEEP, 0.07, 0.9);

      // Active signal — ONE shared points array, mutated each frame.
      // All signal layers reference this same array via line.points.
      const sigPts: OGLVec3[] = allLiss.slice(0, SEG_LEN);

      // 4 stacked layers (2 on mobile) for bloom-style glow accumulation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SIG_LAYERS: any[] = isMobile
        ? [
          mkLine(sigPts, FRAG_SIGNAL, RED, 0.30 * glowAmount, 8.0),
          mkLine(sigPts, FRAG_SIGNAL, RED_HOT, 0.88, 1.8),
        ]
        : [
          mkLine(sigPts, FRAG_HAZE, RED, 0.048 * glowAmount, 44),
          mkLine(sigPts, FRAG_HAZE, RED, 0.10 * glowAmount, 14),
          mkLine(sigPts, FRAG_SIGNAL, RED, 0.28 * glowAmount, 5.0),
          mkLine(sigPts, FRAG_SIGNAL, RED_HOT, 0.88, 1.8),
        ];

      // ── Resize ───────────────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.perspective({ aspect: w / h });
        for (const l of allLines) l.resize?.();
      });
      ro.observe(el);

      // ── Pointer parallax ─────────────────────────────────────────────────
      let mx = 0, my = 0, tmx = 0, tmy = 0;
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        tmx = (e.clientX - r.left) / r.width * 2 - 1;
        tmy = -((e.clientY - r.top) / r.height * 2 - 1);
      };
      el.addEventListener('mousemove', onMove, { passive: true });

      // ── Render loop ───────────────────────────────────────────────────────
      let prevTs = 0;
      let sigOff = 0;

      const tick = (ts: number) => {
        if (dead) return;

        const dt = prevTs ? Math.min((ts - prevTs) * 0.001, 0.05) : 0.016;
        prevTs = ts;
        const t = ts * 0.001;

        if (!reducedMotion) {
          mx += (tmx - mx) * 0.038;
          my += (tmy - my) * 0.038;

          // Camera: slow Y orbit + sinusoidal pitch + mouse parallax
          const yaw = t * 0.1015 * motionSpeed + mx * 0.22 * cameraIntensity;
          const pitch = Math.sin(t * 0.068 * motionSpeed) * 0.115
            + my * 0.15 * cameraIntensity;
          const CR = 4.2;
          camera.position.set(
            Math.sin(yaw) * CR,
            Math.sin(pitch) * CR * 0.40,
            Math.cos(yaw) * CR,
          );
          camera.lookAt([0, 0, 0]);

          // Rings: rotate + gently drift tilt each frame
          for (const { pts, glowPts, glow, crisp, cfg } of rings) {
            const phase = t + cfg.toff;
            const rot = cfg.ro + t * cfg.spd * motionSpeed;
            const tx = cfg.tx + Math.sin(phase * 0.13) * 0.044;
            const ty = cfg.ty + Math.cos(phase * 0.17) * 0.044;
            const tp = phase * 0.055;

            // Mutate Vec3s in-place, then signal OGL to re-upload buffers
            refreshRingPts(pts, SEGS, cfg.r, cfg.bumps, cfg.amp, cfg.z, tx, ty, rot, tp);
            crisp.updateGeometry();

            if (glow && glowPts) {
              refreshRingPts(glowPts, SEGS, cfg.r, cfg.bumps, cfg.amp, cfg.z, tx, ty, rot, tp);
              glow.updateGeometry();
            }
          }

          // Signal: advance sliding window through allLiss (~13 s per revolution)
          const SPEED = (LISS_N + 1) / 13;
          sigOff = (sigOff + SPEED * dt * motionSpeed) % (LISS_N + 1);
          const off = Math.floor(sigOff);

          // Update sigPts elements (all signal layers share this same array reference)
          for (let i = 0; i < SEG_LEN; i++) {
            sigPts[i] = allLiss[(off + i) % (LISS_N + 1)];
          }
          // points is a plain property in OGL — must call updateGeometry() explicitly
          for (const sl of SIG_LAYERS) {
            sl.updateGeometry();
          }
        }

        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        renderer.render({ scene, camera });

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);

      teardown = () => {
        ro.disconnect();
        el.removeEventListener('mousemove', onMove);
        canvas.parentNode?.removeChild(canvas);
      };
    })().catch(err => {
      if (!dead) console.warn('[EmailVisual]', err);
    });

    return () => {
      dead = true;
      cancelAnimationFrame(rafId);
      teardown?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Film grain — SVG fractalNoise at ~2% opacity, screen blend */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.022,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />
      {/* Radial vignette — darkens edges, focuses on the sculpture */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 28%, rgba(7,7,7,0.52) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
