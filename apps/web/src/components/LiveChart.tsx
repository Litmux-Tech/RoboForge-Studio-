export interface ChartSeries {
  name: string;
  color: string;
  data: number[];
}

/**
 * Dependency-free real-time line chart that fills its parent's height. Each
 * series is normalised to its own min/max (units differ), drawn as an overlaid
 * sparkline. Fast enough to redraw at 10 Hz; swap for uPlot if we ever need axes.
 */
export function LiveChart({ series }: { series: ChartSeries[] }) {
  const w = 100;
  const n = Math.max(1, ...series.map((s) => s.data.length));

  const pathFor = (data: number[]) => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data
      .map((v, i) => {
        const x = (i / (n - 1)) * w;
        const y = (1 - (v - min) / range) * 100;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <svg
        viewBox={`0 0 ${w} 100`}
        preserveAspectRatio="none"
        className="min-h-0 w-full flex-1"
      >
        {[20, 40, 60, 80].map((y) => (
          <line key={y} x1="0" y1={y} x2={w} y2={y} stroke="#1e293b" strokeWidth="0.3" />
        ))}
        {series.map((s) => (
          <path
            key={s.name}
            d={pathFor(s.data)}
            fill="none"
            stroke={s.color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="mt-2 flex shrink-0 flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}
