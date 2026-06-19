import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Badge « Producteur vérifié » — gage de confiance accordé par un administrateur
 * AgriLien après contrôle. À placer près du nom de la ferme.
 */
export function VerifiedBadge({ className, label = 'Vérifié' }: { className?: string; label?: string }) {
  return (
    <span
      title="Producteur vérifié par AgriLien"
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 ring-1 ring-primary-200',
        className,
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5" /> {label}
    </span>
  );
}
