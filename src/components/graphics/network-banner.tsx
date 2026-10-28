/** Decorative network-of-points banner (original artwork, navy palette). Inline SVG: no requests, theme-safe. */
const PTS: Array<[number, number]> = [[180, 250], [330, 170], [470, 230], [610, 120], [760, 200], [900, 110], [1050, 190], [1200, 120], [1290, 230], [420, 90], [980, 260], [240, 90]];
const EDGES: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [1, 9], [9, 3], [4, 10], [10, 6], [0, 11], [11, 1], [2, 4]];

export function NetworkBanner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id="nb-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B1220" /><stop offset="1" stopColor="#142B45" /></linearGradient>
        <radialGradient id="nb-glow" cx="50%" cy="110%" r="70%"><stop offset="0" stopColor="#2E5C8A" stopOpacity=".55" /><stop offset="1" stopColor="#2E5C8A" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1440" height="360" fill="url(#nb-bg)" />
      <rect width="1440" height="360" fill="url(#nb-glow)" />
      {[[520, 0.25], [420, 0.18], [320, 0.12]].map(([r, o]) => <ellipse key={r} cx="720" cy="620" rx={r * 1.9} ry={r} fill="none" stroke="#B9CCE0" strokeOpacity={o} />)}
      {EDGES.map(([a, b]) => <line key={`${a}-${b}`} x1={PTS[a][0]} y1={PTS[a][1]} x2={PTS[b][0]} y2={PTS[b][1]} stroke="#B9CCE0" strokeOpacity=".35" />)}
      {PTS.map(([x, y], i) => {
        const r = i % 3 === 0 ? 7 : 4.5;
        return <g key={i}><circle cx={x} cy={y} r={r + 9} fill="#2E5C8A" fillOpacity=".18" /><circle cx={x} cy={y} r={r} fill="#fff" /></g>;
      })}
    </svg>
  );
}
