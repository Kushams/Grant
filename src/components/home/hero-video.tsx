"use client";

import { useEffect, useRef } from "react";

// Looping background video supplied for the design. It is decorative (aria-hidden, muted) and paused for
// people who prefer reduced motion. The navy background is the fallback while it loads or if it fails.
export const BG_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_230229_7c9bc431-46cf-489a-948d-e8144d8eb5d4.mp4";

export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => { if (mq.matches) ref.current?.pause(); else void ref.current?.play().catch(() => undefined); };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return (
    <>
      <video ref={ref} className="absolute inset-0 h-full w-full object-cover" src={BG_VIDEO} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
      {/* Scrim: keeps white text above AA contrast whatever frame the video is on. */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/35 to-navy-950/45" />
    </>
  );
}
