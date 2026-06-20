import { BadgeCheck } from 'lucide-react';
import { StarRating } from './Stars';
import { formatDate } from '@/lib/utils';
import type { ProducerReview } from '@/types/database';

const MONO = '"Spline Sans Mono", ui-monospace, SFMono-Regular, monospace';

/** Liste d'avis. Chaque avis porte le tag « Achat vérifié » (signature). */
export function ReviewList({ reviews }: { reviews: ProducerReview[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-gray-500">Pas encore d'avis. Soyez le premier après un achat.</p>;
  }
  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li key={r.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
          <div className="flex items-center justify-between gap-3">
            <StarRating value={r.rating} size={15} />
            <span
              className="inline-flex items-center gap-1 text-[10px] uppercase text-primary-700"
              style={{ fontFamily: MONO, letterSpacing: '0.08em' }}
            >
              <BadgeCheck className="h-3.5 w-3.5" /> Achat vérifié
            </span>
          </div>
          {r.comment && <p className="mt-2 text-sm leading-relaxed text-gray-700">{r.comment}</p>}
          <p className="mt-1.5 text-xs text-gray-400" style={{ fontFamily: MONO }}>
            {r.buyer_name ?? 'Acheteur'} · {formatDate(r.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}
