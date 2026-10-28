"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades/slides content in once as it scrolls into view. Pattern adapted from the World Bridge Meridian site. */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  const Comp = Tag as "div";
  return (
    <Comp ref={ref as React.RefObject<HTMLDivElement>} style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}>
      {children}
    </Comp>
  );
}
