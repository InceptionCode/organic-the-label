"use client";

import { useRef, useEffect } from "react";
import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";

const vertex = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Brand-adapted shader — red glow on near-black, warm beige midtones
const fragment = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uGlow;

// Brand palette: deep black base → red glow → beige warmth
vec3 palette(float t) {
  vec3 darkBase  = vec3(0.09, 0.09, 0.09);   // #171717 near-black
  vec3 redAccent = vec3(0.875, 0.239, 0.165); // #E03D2A brand red
  vec3 beige     = vec3(0.831, 0.769, 0.659); // #D4C4A8 brand beige
  float m = 0.5 + 0.5 * sin(t * 0.7);
  // Shift from dark → red at peak, then toward beige at extreme
  vec3 warm = mix(darkBase, redAccent, smoothstep(0.0, 0.65, m));
  return mix(warm, beige, smoothstep(0.75, 1.0, m) * 0.18);
}

float wave(vec2 uv, float freq, float phase) {
  return 0.35 * sin(uv.x * freq + uTime * uSpeed + phase);
}

float glowFn(float d, float strength) {
  return exp(-d * d * strength);
}

void main() {
  vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;

  float y = uv.y;

  float w1 = wave(uv, 2.5, 0.0);
  float w2 = wave(uv, 4.0, 1.3);
  float w3 = wave(uv, 6.5, 2.8);

  float waveLine = w1 + w2 * 0.5 + w3 * 0.3;
  float dist = abs(y - waveLine);
  float g = glowFn(dist, uGlow);

  vec3 bg  = vec3(0.09, 0.09, 0.09);
  vec3 col = palette(waveLine + y * 0.6);
  col = mix(bg, col, g * 1.2);

  // Very subtle vignette
  float vignette = 1.0 - smoothstep(0.6, 1.4, length(uv * vec2(0.8, 1.2)));
  col *= 0.75 + 0.25 * vignette;

  gl_FragColor = vec4(col, 1.0);
}
`;

type AuroraWavesProps = {
  speed?: number;
  glow?: number;
  resolutionScale?: number;
  className?: string;
};

export default function AuroraWaves({
  speed = 0.35,
  glow = 22.0,
  resolutionScale = 0.6,
  className = "",
}: AuroraWavesProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement as HTMLElement;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      canvas,
    });

    const gl = renderer.gl;
    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime:       { value: 0 },
        uResolution: { value: new Vec2() },
        uSpeed:      { value: speed },
        uGlow:       { value: glow },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      renderer.setSize(w * resolutionScale, h * resolutionScale);
      program.uniforms.uResolution.value.set(w, h);
      // OGL writes inline px style on the canvas after setSize — reset to fill parent
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };

    window.addEventListener("resize", resize);
    resize();

    const start = performance.now();
    let frame = 0;

    const loop = () => {
      program.uniforms.uTime.value = (performance.now() - start) / 1000;
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [speed, glow, resolutionScale]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        imageRendering: "auto",
      }}
    />
  );
}
