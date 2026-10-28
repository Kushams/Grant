import type { ReactNode } from "react";

/**
 * Original spot illustrations: a navy rounded tile with a white line glyph and a soft accent.
 * Inline SVG, decorative (aria-hidden) — meaning is always carried by adjacent text.
 */
const S = { fill: "none", stroke: "#fff", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const GLYPHS = {
  education: <g {...S}><path d="M48 30 L72 42 L48 54 L24 42Z" /><path d="M34 49 v10 c0 5 28 5 28 0 v-10" /><path d="M72 42 v13" /></g>,
  health: <g {...S}><rect x="40" y="26" width="16" height="44" rx="5" /><rect x="26" y="40" width="44" height="16" rx="5" /></g>,
  home: <g {...S}><path d="M26 50 L48 31 L70 50" /><path d="M33 45 v23 h30 v-23" /><path d="M43 68 v-13 h10 v13" /></g>,
  business: <g {...S}><path d="M27 40 l4-12 h34 l4 12 z" /><path d="M32 40 v28 h32 v-28" /><path d="M42 68 v-14 h12 v14" /></g>,
  arts: <g {...S}><path d="M48 27 c-14 0 -22 10 -22 21 c0 12 10 21 22 21 c5 0 6 -3 4 -6 c-2 -4 1 -8 6 -8 h5 c7 0 10 -4 10 -9 c0 -10 -10 -19 -25 -19z" /><circle cx="38" cy="42" r="2.4" fill="#fff" /><circle cx="48" cy="36" r="2.4" fill="#fff" /><circle cx="58" cy="42" r="2.4" fill="#fff" /></g>,
  research: <g {...S}><path d="M42 27 h12 M44 27 v15 l-14 24 c-1 3 1 4 4 4 h28 c3 0 5 -1 4 -4 l-14 -24 v-15" /><circle cx="46" cy="58" r="2.2" fill="#fff" /><circle cx="54" cy="62" r="1.8" fill="#fff" /></g>,
  search: <g {...S}><circle cx="43" cy="43" r="15" /><path d="M54 54 L68 68" /></g>,
  people: <g {...S}><circle cx="48" cy="38" r="8" /><path d="M32 66 c0 -10 7 -16 16 -16 s16 6 16 16" /><circle cx="30" cy="44" r="5.5" /><circle cx="66" cy="44" r="5.5" /></g>,
  growth: <g {...S}><path d="M26 66 L41 50 L51 58 L69 36" /><path d="M58 36 h11 v11" /></g>,
  spark: <g {...S}><path d="M48 24 c2 14 6 18 20 24 c-14 6 -18 10 -20 24 c-2 -14 -6 -18 -20 -24 c14 -6 18 -10 20 -24z" /></g>,
  shield: <g {...S}><path d="M48 25 L69 33 V50 c0 12 -9 20 -21 25 c-12 -5 -21 -13 -21 -25 V33 z" /><path d="M38 49 l7 7 l13 -14" /></g>,
  key: <g {...S}><circle cx="36" cy="48" r="11" /><path d="M47 48 h24 M64 48 v9 M57 48 v7" /></g>,
  fingerprint: <g {...S}><path d="M34 40 c4 -9 24 -9 28 0 M30 50 c0 -16 36 -16 36 0 c0 10 -1 15 -4 20 M38 56 c0 -12 20 -12 20 0 c0 7 0 10 -2 14 M48 54 v8 c0 4 -1 6 -2 8" /></g>,
  document: <g {...S}><path d="M33 26 h20 l12 12 v32 h-32 z" /><path d="M53 26 v12 h12 M40 50 h18 M40 58 h18" /></g>,
  scales: <g {...S}><path d="M48 27 v41 M34 69 h28 M27 36 h42" /><path d="M27 36 l-8 17 h16z M69 36 l-8 17 h16z" /></g>,
  envelope: <g {...S}><rect x="25" y="32" width="46" height="34" rx="5" /><path d="M27 36 l21 16 l21 -16" /></g>,
  globe: <g {...S}><circle cx="48" cy="48" r="21" /><ellipse cx="48" cy="48" rx="9" ry="21" /><path d="M27 48 h42 M30 37 h36 M30 59 h36" /></g>,
  question: <g {...S}><circle cx="48" cy="48" r="21" /><path d="M41 42 c0 -9 15 -9 15 -1 c0 6 -8 6 -8 13" /><circle cx="48" cy="62" r="1.8" fill="#fff" /></g>,
  check: <g {...S}><circle cx="48" cy="48" r="21" /><path d="M38 49 l8 8 l14 -16" /></g>,
  calendar: <g {...S}><rect x="27" y="32" width="42" height="36" rx="5" /><path d="M27 44 h42 M39 26 v10 M57 26 v10" /><circle cx="40" cy="54" r="2" fill="#fff" /><circle cx="48" cy="54" r="2" fill="#fff" /><circle cx="56" cy="54" r="2" fill="#fff" /></g>,
  lock: <g {...S}><rect x="30" y="45" width="36" height="25" rx="5" /><path d="M38 45 v-7 c0 -13 20 -13 20 0 v7" /><circle cx="48" cy="57" r="2.4" fill="#fff" /></g>,
  slider: <g {...S}><path d="M26 40 h44 M26 58 h44" /><circle cx="56" cy="40" r="6" fill="#B9CCE0" /><circle cx="38" cy="58" r="6" fill="#B9CCE0" /></g>,
  route: <g {...S}><circle cx="30" cy="62" r="5" /><circle cx="66" cy="34" r="5" /><path d="M35 60 c14 -2 6 -22 20 -24 M58 36 h2" /></g>,
  hand: <g {...S}><path d="M26 54 h10 l10 6 h14 c4 0 4 6 0 6 h-12 M36 54 v12 M44 46 c4 -6 9 -4 9 0 c0 6 -9 8 -9 8 s-9 -2 -9 -8 c0 -4 5 -6 9 0z" /></g>,
  star: <g {...S}><path d="M48 27 l6 13 l14 2 l-10 10 l3 14 l-13 -7 l-13 7 l3 -14 l-10 -10 l14 -2z" /></g>,
  clock: <g {...S}><circle cx="48" cy="48" r="21" /><path d="M48 36 v13 l9 6" /></g>,
  mail: <g {...S}><rect x="25" y="32" width="46" height="34" rx="5" /><path d="M27 36 l21 16 l21 -16" /></g>,
} satisfies Record<string, ReactNode>;

export type SpotName = keyof typeof GLYPHS;

export function Spot({ name, className = "size-14", tone = "navy" }: { name: SpotName; className?: string; tone?: "navy" | "blue" }) {
  const fill = tone === "navy" ? "url(#spot-navy)" : "url(#spot-blue)";
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id="spot-navy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1d3d5f" /><stop offset="1" stopColor="#0B1220" /></linearGradient>
        <linearGradient id="spot-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3f73a6" /><stop offset="1" stopColor="#142B45" /></linearGradient>
      </defs>
      <rect width="96" height="96" rx="22" fill={fill} />
      <circle cx="78" cy="18" r="22" fill="#B9CCE0" fillOpacity={0.1} />
      <circle cx="14" cy="84" r="16" fill="#2E5C8A" fillOpacity={0.35} />
      {GLYPHS[name]}
    </svg>
  );
}
