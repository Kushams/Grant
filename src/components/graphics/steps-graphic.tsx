const XS = [160, 440, 720, 1000, 1280];
const LABELS = ["Create account", "Apply", "Review", "Decision", "If approved"];

/** Five-step path matching "How it works". Decorative: the numbered list beside it carries the content. */
export function StepsGraphic({ className = "" }: { className?: string }) {
  const y = 90;
  return (
    <svg viewBox="0 0 1440 200" aria-hidden="true" focusable="false" className={className}>
      <path d={`M${XS[0]} ${y} H${XS[4]}`} stroke="#D9E0E8" strokeWidth="4" strokeLinecap="round" />
      <path d={`M${XS[0]} ${y} H${XS[3]}`} stroke="#142B45" strokeWidth="4" strokeLinecap="round" />
      {XS.map((x, i) => {
        const filled = i < 4;
        return (
          <g key={x}>
            <circle cx={x} cy={y} r="34" fill={filled ? "#142B45" : "#fff"} stroke="#142B45" strokeWidth="3" />
            <text x={x} y={y + 8} textAnchor="middle" fontSize="22" fontWeight="600" fill={filled ? "#fff" : "#142B45"} fontFamily="Geist, Arial, sans-serif">{i + 1}</text>
            <text x={x} y={y + 68} textAnchor="middle" fontSize="20" fontWeight="600" fill="#17212F" fontFamily="Geist, Arial, sans-serif">{LABELS[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}
