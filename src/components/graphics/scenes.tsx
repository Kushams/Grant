/** Wide decorative scenes (original artwork, navy palette). Inline SVG, aria-hidden. */

export function SceneGlobe({ className = "" }: { className?: string }) {
  const dots: Array<[number, number]> = [[200, 170], [260, 140], [330, 120], [400, 150], [450, 200], [380, 240], [300, 260], [230, 230], [180, 280], [340, 320], [420, 300], [270, 190]];
  return (
    <svg viewBox="0 0 640 440" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <radialGradient id="sg-sphere" cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#2E5C8A" /><stop offset="0.55" stopColor="#142B45" /><stop offset="1" stopColor="#0B1220" /></radialGradient>
        <linearGradient id="sg-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0B1220" /><stop offset="1" stopColor="#142B45" /></linearGradient>
      </defs>
      <rect width="640" height="440" rx="28" fill="url(#sg-bg)" />
      {Array.from({ length: 28 }).map((_, i) => <circle key={i} cx={(i * 97) % 620 + 10} cy={(i * 53) % 420 + 10} r={i % 4 === 0 ? 1.8 : 1} fill="#B9CCE0" fillOpacity=".5" />)}
      <circle cx="320" cy="220" r="150" fill="url(#sg-sphere)" />
      {[60, 105, 140].map((rx) => <ellipse key={rx} cx="320" cy="220" rx={rx} ry="150" fill="none" stroke="#B9CCE0" strokeOpacity=".22" />)}
      {[-80, -30, 30, 80].map((dy) => <ellipse key={dy} cx="320" cy={220 + dy} rx={Math.sqrt(150 * 150 - dy * dy)} ry="14" fill="none" stroke="#B9CCE0" strokeOpacity=".2" />)}
      <ellipse cx="320" cy="220" rx="250" ry="62" fill="none" stroke="#B9CCE0" strokeOpacity=".35" transform="rotate(-18 320 220)" />
      {dots.map(([x, y], i) => <circle key={i} cx={x + 60} cy={y - 10} r="4" fill="#fff" />)}
      <path d="M260 160 Q330 90 410 150 T470 210" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.6" strokeDasharray="3 6" />
      <circle cx="558" cy="150" r="9" fill="#B9CCE0" /><circle cx="86" cy="290" r="6" fill="#B9CCE0" fillOpacity=".7" />
    </svg>
  );
}

export function SceneSkyline({ className = "" }: { className?: string }) {
  const b = [[40, 120, 70], [120, 80, 60], [190, 150, 80], [280, 100, 64], [354, 170, 90], [454, 90, 62], [526, 130, 76], [612, 70, 58], [680, 160, 84], [774, 110, 66], [850, 140, 78], [938, 90, 60], [1008, 175, 88], [1106, 120, 70], [1186, 85, 62], [1258, 150, 80], [1348, 105, 60]];
  return (
    <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" className={className}>
      <defs><linearGradient id="sk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E3E9F1" /><stop offset="1" stopColor="#F5F7FA" /></linearGradient></defs>
      <rect width="1440" height="260" fill="url(#sk-sky)" />
      <circle cx="1180" cy="70" r="34" fill="#B9CCE0" fillOpacity=".55" />
      <path d="M0 200 Q240 150 480 190 T960 180 T1440 190 V260 H0Z" fill="#C3D0E0" />
      {b.map(([x, h, w], i) => (
        <g key={x}>
          <rect x={x} y={260 - h} width={w} height={h} rx="3" fill={i % 2 ? "#2F4B6A" : "#142B45"} />
          {Array.from({ length: Math.floor(h / 24) }).map((_, r) => Array.from({ length: Math.floor(w / 22) }).map((__, c) => (
            <rect key={`${r}-${c}`} x={x + 10 + c * 20} y={260 - h + 12 + r * 24} width="9" height="11" rx="2" fill="#B9CCE0" fillOpacity={(r + c + i) % 3 === 0 ? 0.9 : 0.25} />
          )))}
        </g>
      ))}
      <path d="M0 238 Q360 214 720 236 T1440 230 V260 H0Z" fill="#0B1220" />
    </svg>
  );
}

export function SceneKey({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 440" aria-hidden="true" focusable="false" className={className}>
      <defs><linearGradient id="sy-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#142B45" /><stop offset="1" stopColor="#0B1220" /></linearGradient></defs>
      <rect width="520" height="440" rx="28" fill="url(#sy-bg)" />
      {[150, 115, 80].map((r) => <circle key={r} cx="260" cy="210" r={r} fill="none" stroke="#B9CCE0" strokeOpacity={r === 80 ? 0.4 : 0.18} />)}
      <path d="M260 120 L318 142 V205 c0 36 -26 62 -58 76 c-32 -14 -58 -40 -58 -76 V142z" fill="#fff" fillOpacity=".08" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M232 196 c0 -34 56 -34 56 0 M222 214 c0 -50 76 -50 76 0 c0 28 -3 44 -10 58 M240 222 c0 -28 40 -28 40 0 c0 16 -1 26 -5 38 M260 220 v22" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <rect x="150" y="350" width="220" height="40" rx="20" fill="#fff" fillOpacity=".1" stroke="#B9CCE0" strokeOpacity=".5" />
      <text x="260" y="376" textAnchor="middle" fontFamily="Geist, monospace" fontSize="18" fill="#fff" letterSpacing="3">NEN-••••-••••</text>
      <circle cx="70" cy="70" r="6" fill="#B9CCE0" /><circle cx="450" cy="90" r="4" fill="#B9CCE0" fillOpacity=".7" /><circle cx="430" cy="360" r="5" fill="#2E5C8A" />
    </svg>
  );
}

export function WaveDivider({ className = "", flip = false, from = "#F5F7FA", to = "#FFFFFF" }: { className?: string; flip?: boolean; from?: string; to?: string }) {
  return (
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" focusable="false" className={className} style={{ display: "block", transform: flip ? "scaleY(-1)" : undefined, background: from }}>
      <path d="M0 40 C240 90 480 0 720 36 C960 72 1200 10 1440 44 V80 H0Z" fill={to} />
    </svg>
  );
}
