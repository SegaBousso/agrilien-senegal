import { AlertTriangle, Landmark } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { OfficialPrice } from '@/types/database';

interface Props {
  official: OfficialPrice;
  /** Prix saisi/affiché de l'annonce ; si fourni et < plancher, on avertit. */
  price?: number;
  /** Variante compacte pour le formulaire (sous le champ prix). */
  compact?: boolean;
}

/**
 * Affiche le prix de référence officiel applicable (filière régulée) et avertit
 * — sans bloquer — quand le prix de l'annonce est sous le plancher au producteur.
 */
export function OfficialPriceNotice({ official, price, compact }: Props) {
  const below = typeof price === 'number' && price > 0 && price < official.price;
  const campaign = official.campaign ? ` ${official.campaign}` : '';

  return (
    <div
      className={
        'rounded-xl border px-3 py-2.5 text-sm ' +
        (below ? 'border-accent-300 bg-accent-50' : 'border-border bg-muted/60')
      }
    >
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-gray-700">
        <Landmark className="h-4 w-4 shrink-0 text-gray-500" />
        <span className="font-medium text-gray-900">Prix officiel{campaign}</span>
        <span className="text-gray-500">·</span>
        <span className="font-semibold text-gray-900">
          {formatPrice(official.price)}
          <span className="text-xs font-normal text-gray-500">/{official.unit}</span>
        </span>
        {official.source && !compact && (
          <span className="text-xs text-gray-400">({official.source})</span>
        )}
      </p>
      {below && (
        <p className="mt-1 flex items-start gap-1.5 text-xs text-accent-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {compact
            ? `Votre prix est sous le prix officiel au producteur (${formatPrice(official.price)}/${official.unit}).`
            : `Cette offre est en dessous du prix officiel au producteur pour ${official.label.toLowerCase()}.`}
        </p>
      )}
    </div>
  );
}
