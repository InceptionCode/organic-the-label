"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import { Play, Pause } from "lucide-react";
import { BRAND_WAVEFORM_PALETTE_RGB } from "@/lib/constants";

/** Map bar index (0–1 normalized) to a palette color via smooth gradient. */
function barColor(t: number, opacity: number): string {
  const palette = BRAND_WAVEFORM_PALETTE_RGB;
  const scaled = t * (palette.length - 1);
  const lo = Math.floor(scaled);
  const hi = Math.min(lo + 1, palette.length - 1);
  const blend = scaled - lo;
  const [r, g, b] = palette[lo].map((v, i) =>
    Math.round(v + (palette[hi][i] - v) * blend)
  ) as [number, number, number];
  return `rgba(${r},${g},${b},${opacity})`;
}

const formatTime = (seconds: number = 0) => {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/** Deterministic pseudo-random bar heights seeded from the audio URL string. */
function seededBars(src: string, count = 72): number[] {
  let seed = [...src].reduce((a, c) => ((a * 31 + c.charCodeAt(0)) | 0), 0);
  return Array.from({ length: count }, () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    const raw = Math.abs(seed) / 2147483647;
    return 0.15 + raw * raw * 0.85;
  });
}

type WaveformPlayerProps = {
  src: string;
  title?: string;
  onPlay?: () => void;
};

export function WaveformPlayer({ src, title, onPlay }: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const firedOnPlay = useRef(false);

  const bars = useMemo(() => seededBars(src), [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
      if (!firedOnPlay.current) {
        firedOnPlay.current = true;
        onPlay?.();
      }
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, onPlay]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const pct =
      isFinite(audio.duration) && audio.duration > 0
        ? (audio.currentTime / audio.duration) * 100
        : 0;
    setProgress(pct);
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const el = seekRef.current;
      if (!audio || !el || !isFinite(audio.duration)) return;
      const rect = el.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      audio.currentTime = pct * audio.duration;
      setProgress(pct * 100);
    },
    []
  );

  if (!src) return null;

  const filledCount = Math.round((progress / 100) * bars.length);

  return (
    <div
      className="card-glass rounded-xl w-full"
      style={{ padding: "14px 16px 12px" }}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* Track title */}
      {title && (
        <p
          className="truncate mb-2.5"
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(212,196,168,0.55)",
            lineHeight: 1,
          }}
        >
          {title}
        </p>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-3">

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
          className="flex-shrink-0 flex items-center justify-center rounded-full hover:cursor-pointer"
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            background: "var(--accent-primary)",
            boxShadow: isPlaying
              ? "0 0 0 4px rgba(224,61,42,0.22), 0 0 20px rgba(224,61,42,0.35)"
              : "0 2px 12px rgba(224,61,42,0.3)",
            transition: "box-shadow 200ms ease, transform 150ms ease",
          }}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" style={{ color: "var(--accent-contrast)" }} />
          ) : (
            <Play className="w-4 h-4 translate-x-px" style={{ color: "var(--accent-contrast)" }} />
          )}
        </button>

        {/* Waveform bars */}
        <div
          ref={seekRef}
          role="slider"
          aria-label="Seek audio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          tabIndex={0}
          className="flex-1 flex items-center gap-px cursor-pointer select-none"
          style={{ height: 44 }}
          onClick={handleSeek}
          onTouchStart={handleSeek}
          onKeyDown={(e) => {
            const audio = audioRef.current;
            if (!audio || !isFinite(audio.duration)) return;
            if (e.key === "ArrowRight")
              audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
            if (e.key === "ArrowLeft")
              audio.currentTime = Math.max(0, audio.currentTime - 5);
          }}
        >
          {bars.map((height, i) => {
            const t = i / (bars.length - 1); // 0–1 position across waveform
            const filled = i < filledCount;
            const isHead = i === filledCount - 1 && isPlaying;
            const barH = height * 36; // max 36px total

            // Unplayed: palette gradient at low opacity
            // Played: accent red (brighter toward the head)
            const topColor = filled
              ? isHead
                ? "rgba(255,255,255,0.95)"
                : "var(--accent-primary)"
              : barColor(t, 0.35);

            const bottomColor = filled
              ? isHead
                ? "rgba(255,255,255,0.6)"
                : "rgba(224,61,42,0.45)"
              : barColor(t, 0.18);

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-center"
                style={{ height: "100%", gap: 1 }}
              >
                {/* Top half */}
                <div
                  style={{
                    width: "100%",
                    height: barH / 2,
                    borderRadius: "2px 2px 0 0",
                    background: topColor,
                    transition: "background 60ms ease",
                  }}
                />
                {/* Bottom half (mirror, dimmer) */}
                <div
                  style={{
                    width: "100%",
                    height: barH / 2,
                    borderRadius: "0 0 2px 2px",
                    background: bottomColor,
                    transition: "background 60ms ease",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Time display */}
        <span
          className="flex-shrink-0 tabular-nums"
          style={{
            fontSize: "0.62rem",
            color: "rgba(212,196,168,0.5)",
            letterSpacing: "0.04em",
            minWidth: 68,
            textAlign: "right",
            lineHeight: 1,
          }}
        >
          {formatTime(currentTime)}&nbsp;/&nbsp;{formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
