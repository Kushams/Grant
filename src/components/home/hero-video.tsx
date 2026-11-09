"use client";

import { useEffect, useRef, useState } from "react";

import { BG_POSTER, BG_VIDEO, HERO_TONE, OBJECT_POSITION } from "./hero-assets";

/**
 * Decorative looping video over a poster-image background.
 *  - The poster is a CSS background on the parent AND the video's `poster`, so it shows while loading, if the video
 *    fails, if autoplay is blocked, and permanently for people who prefer reduced motion.
 *  - The ~38 MB video is not requested at all for reduced-motion or data-saver users.
 *  - Fades in once it is actually playing; no zoom/scale animation.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const sync = () => setEnabled(!mq.matches && !conn?.saveData);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Resetting `playing` when disabled happens via unmounting the element below (no effect needed).
  useEffect(() => {
    if (enabled) void ref.current?.play().catch(() => undefined); // autoplay may be refused: poster stays visible
  }, [enabled]);

  if (!enabled) return null;
  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
      style={{ objectPosition: OBJECT_POSITION, opacity: playing ? 1 : 0, filter: HERO_TONE }}
      src={BG_VIDEO}
      poster={BG_POSTER}
      autoPlay muted loop playsInline preload="metadata"
      onPlaying={() => setPlaying(true)}
      onError={() => setPlaying(false)}
      aria-hidden="true" tabIndex={-1}
    />
  );
}
