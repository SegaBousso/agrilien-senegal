import { useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface DonutSegment {
  label: string;
  value: number;
  /** Couleur CSS (hex/rgb). Voir CHART_COLORS. */
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  /** Libellé central (ex. total). */
  centerLabel?: string;
  centerValue?: string | number;
  size?: number;
  thickness?: number;
  className?: string;
}

/**
 * Donut dessiné sur mesure en SVG (sans dépendance).
 * Accessible (role=img + résumé), interactif (survol des segments + légende).
 */
export function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 180,
  thickness = 22,
  className,
}: DonutChartProps) {
  const titleId = useId();
  const [active, setActive] = useState<number | null>(null);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Pré-calcule les arcs (offset cumulé).
  const arcs = useMemo(() => {
    let cumulative = 0;
    return data.map((d) => {
      const fraction = total > 0 ? d.value / total : 0;
      const dash = fraction * circumference;
      const arc = {
        ...d,
        fraction,
        dashArray: `${dash} ${circumference - dash}`,
        dashOffset: -cumulative * circumference,
      };
      cumulative += fraction;
      return arc;
    });
  }, [data, total, circumference]);

  const summary = data.map((d) => `${d.label} ${d.value}`).join(', ');

  return (
    <div className={cn('flex flex-col items-center gap-5 sm:flex-row sm:items-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-labelledby={titleId}
        className="shrink-0 -rotate-90"
      >
        <title id={titleId}>Répartition : {summary}</title>
        {/* Piste de fond */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgb(var(--surface-muted))"
          strokeWidth={thickness}
        />
        {arcs.map((arc, i) => (
          <circle
            key={arc.label}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={active === i ? thickness + 4 : thickness}
            strokeDasharray={arc.dashArray}
            strokeDashoffset={arc.dashOffset}
            strokeLinecap="round"
            className="transition-all duration-200"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            style={{ opacity: active === null || active === i ? 1 : 0.35 }}
          />
        ))}
        {/* Centre */}
        {(centerValue !== undefined || centerLabel) && (
          <g className="rotate-90" style={{ transformOrigin: 'center' }}>
            {centerValue !== undefined && (
              <text
                x={center}
                y={centerLabel ? center - 2 : center + 6}
                textAnchor="middle"
                className="fill-foreground font-display text-2xl font-bold"
              >
                {centerValue}
              </text>
            )}
            {centerLabel && (
              <text
                x={center}
                y={center + 18}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px]"
              >
                {centerLabel}
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Légende */}
      <ul className="w-full space-y-2">
        {arcs.map((arc, i) => (
          <li
            key={arc.label}
            className="flex items-center justify-between rounded-lg px-2 py-1 transition-colors"
            style={{ backgroundColor: active === i ? 'rgb(var(--surface-muted))' : 'transparent' }}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: arc.color }} />
              {arc.label}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {arc.value}
              <span className="ml-1 text-xs font-normal text-gray-400">
                ({Math.round(arc.fraction * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
