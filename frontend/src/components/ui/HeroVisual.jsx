/**
 * The signature visual: scattered points (individual households) send
 * curved lines that converge into a single thick stroke (aggregated,
 * matched demand) reaching a field marker (the farmer). It's the same
 * convergence idea used again, literally, in the differentiator section.
 */
export default function HeroVisual() {
  const points = [
    { x: 40, y: 60 },
    { x: 55, y: 160 },
    { x: 30, y: 260 },
    { x: 70, y: 340 },
    { x: 110, y: 100 },
    { x: 95, y: 220 },
  ];

  const convergeX = 300;
  const convergeY = 210;

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      <svg
        viewBox="0 0 420 420"
        className="w-full h-full"
        role="img"
        aria-label="Illustration of many individual household requests converging into one matched order delivered to a farm"
      >
        <defs>
          <radialGradient id="fieldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#47835E" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#47835E" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={convergeX} cy={convergeY} r="150" fill="url(#fieldGlow)" />

        {points.map((p, i) => (
          <g key={i} style={{ animation: `drift ${10 + i}s ease-in-out infinite` }}>
            <path
              d={`M ${p.x} ${p.y} Q ${(p.x + convergeX) / 2 + 20} ${p.y} ${convergeX - 6} ${convergeY}`}
              fill="none"
              stroke="#C6D9CC"
              strokeWidth="1.5"
            />
            <circle cx={p.x} cy={p.y} r="5" fill="#DDA85F" />
          </g>
        ))}

        {/* the converged, matched line */}
        <path
          d={`M ${convergeX - 4} ${convergeY} L 360 ${convergeY}`}
          stroke="#1F3D2B"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* farm marker */}
        <g transform={`translate(${convergeX + 60}, ${convergeY})`}>
          <circle r="34" fill="#1F3D2B" />
          <path
            d="M-14 8C-14 -8 4 -16 20 -16C20 0 10 14 -6 14C-9 14 -13 12 -14 8Z"
            fill="#DDA85F"
            transform="scale(0.9)"
          />
        </g>

        <text
          x={convergeX - 90}
          y={convergeY - 90}
          className="font-mono"
          fontSize="11"
          fill="#71827A"
          letterSpacing="0.5"
        >
          scattered demand
        </text>
        <text
          x={convergeX + 8}
          y={convergeY + 55}
          className="font-mono"
          fontSize="11"
          fill="#1F3D2B"
          fontWeight="600"
          letterSpacing="0.5"
        >
          one matched order
        </text>
      </svg>
    </div>
  );
}
