export function Gauge({
  value,
  max,
  min = 0,
  label,
  unit,
  color = '#22d3ee',
  size = 120,
}: {
  value: number;
  max: number;
  min?: number;
  label: string;
  unit?: string;
  color?: string;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const r = 42;
  const circ = 2 * Math.PI * r;
  const arcFrac = 0.75; // 270° gauge, 90° gap at the bottom

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="#1e293b"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${circ * arcFrac} ${circ}`}
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${circ * arcFrac * pct} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold leading-none tabular-nums">
            {value.toFixed(Math.abs(value) < 10 ? 1 : 0)}
          </div>
          {unit && <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">{unit}</div>}
        </div>
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
