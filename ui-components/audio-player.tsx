"use client";

import React, { useRef, useState, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number = 0) => {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

type AudioPlayerProps = {
  src: string;
  title?: string;
  /** Optional analytics callback fired on first play */
  onPlay?: () => void;
  className?: string;
};

/**
 * Branded inline audio player.
 * Replaces native <audio> controls with a clean progress bar + play/pause button
 * that matches the Organic Sonics design system.
 */
export function AudioPlayer({ src, title, onPlay, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const firedOnPlay = useRef(false);

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
    const pct = isFinite(audio.duration) && audio.duration > 0
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

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track || !isFinite(audio.duration)) return;

    const rect = track.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = pct * audio.duration;
    setProgress(pct * 100);
  }, []);

  if (!src) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full group",
        "bg-surface-2 border border-subtle hover:border-default",
        "transition-soft",
        className
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />

      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          "transition-soft focus-visible:outline-none",
          "bg-accent-primary hover:bg-accent-primary-hover active:scale-95 hover:cursor-pointer",
        )}
        style={{ background: "var(--accent-primary)" }}
      >
        {isPlaying
          ? <Pause className="w-3.5 h-3.5" style={{ color: "var(--accent-contrast)" }} />
          : <Play className="w-3.5 h-3.5 translate-x-px" style={{ color: "var(--accent-contrast)" }} />
        }
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {title && (
          <p className="text-caption text-secondary truncate leading-none">{title}</p>
        )}

        <div
          ref={trackRef}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          tabIndex={0}
          className="relative h-1 w-full rounded-full cursor-pointer bg-surface-3 select-none"
          onClick={handleSeek}
          onTouchStart={handleSeek}
          onKeyDown={(e) => {
            const audio = audioRef.current;
            if (!audio || !isFinite(audio.duration)) return;
            if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
            if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%`, background: "var(--accent-primary)" }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, background: "var(--accent-primary)" }}
          />
        </div>
      </div>

      <span className="flex-shrink-0 text-caption text-muted tabular-nums w-[72px] text-right leading-none">
        {formatTime(currentTime)}&nbsp;/&nbsp;{formatTime(duration)}
      </span>
    </div>
  );
}
