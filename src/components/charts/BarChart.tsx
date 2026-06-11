import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  /** Couleur des barres (défaut : vert marque). */
  color?: string;
  /** Formate la valeur affichée (défaut : nombre brut). */
  formatValue?: (v: number) => string;
  className?: string;
}

/**
 * Barres horizontales dessinées sur mesure (HTML/CSS, pas de SVG nécessaire).
 * Idéal pour des classements (ex. annonces par région). Accessible et responsive.
 */
export function BarChart({ data, color = '#16a34a', formatValue, className }: BarChartProps) {
  const titleId = useId();
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = formatValue ?? ((v: number) => new Intl.NumberFormat('fr-FR').format(v));

  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Aucune donnée à afficher.</p>;
  }

  return (
    <div className={cn('space-y-3', className)} role="img" aria-labelledby={titleId}>
      <span id={titleId} className="sr-only">
        Graphique en barres : {data.map((d) => `${d.label} ${d.value}`).join(', ')}
      </span>
      {data.map((d) => {
        const pct = Math.max(2, (d.value / max) * 100);
        return (
          <div key={d.label} className="group flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-sm text-muted-foreground" title={d.label}>
              {d.label}
            </span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-surface-muted">
              <div
                className="flex h-full items-center justify-end rounded-lg px-2.5 text-xs font-semibold text-white transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%`, backgroundColor: color }}
              >
                <span className="tabular-nums opacity-95 group-hover:opacity-100">{fmt(d.value)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
