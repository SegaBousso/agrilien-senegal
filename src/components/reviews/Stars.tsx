import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

function Row({ size }: { size: number }) {
  return (
    <span className="inline-flex" style={{ gap: size * 0.1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="fill-current" strokeWidth={0} style={{ width: size, height: size }} />
      ))}
    </span>
  );
}

/** Affichage d'une note (étoiles jaunes = accent de la marque), remplissage fractionnaire. */
export function StarRating({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span
      role="img"
      aria-label={`${value.toFixed(1)} sur 5`}
      className={cn('relative inline-flex w-max align-middle', className)}
    >
      <span className="text-gray-200">
        <Row size={size} />
      </span>
      <span className="absolute inset-0 overflow-hidden text-accent-400" style={{ width: `${pct}%` }}>
        <Row size={size} />
      </span>
    </span>
  );
}

/** Pastille compacte (une étoile + moyenne + nombre) pour les cartes. */
export function RatingChip({ avg, count, className }: { avg: number; count: number; className?: string }) {
  if (!count) return null;
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" strokeWidth={0} />
      <span className="text-xs font-semibold text-gray-900">{avg.toFixed(1)}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </span>
  );
}

const LABELS = ['', 'Mauvais', 'Moyen', 'Bien', 'Très bien', 'Excellent'];

/** Saisie de note — grandes cibles tactiles + libellé (pensé faible littératie). */
export function StarInput({
  value,
  onChange,
  size = 38,
}: {
  value: number;
  onChange: (n: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div>
      <div role="radiogroup" aria-label="Note en étoiles" className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} étoile${n > 1 ? 's' : ''} — ${LABELS[n]}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            className="rounded-lg p-1 transition-transform hover:scale-110"
          >
            <Star
              strokeWidth={n <= active ? 0 : 1.5}
              className={cn(n <= active ? 'fill-accent-400 text-accent-400' : 'fill-gray-100 text-gray-300')}
              style={{ width: size, height: size }}
            />
          </button>
        ))}
      </div>
      <p className="mt-1 h-5 text-sm font-medium text-gray-600">{LABELS[active] ?? ''}</p>
    </div>
  );
}
