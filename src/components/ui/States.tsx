import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Skeleton générique. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

/** Carte produit en chargement. */
export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-surface">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}

interface StateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
      <div className="text-gray-300">{icon ?? <Inbox className="h-12 w-12" />}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="max-w-md text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Une erreur est survenue',
  description = 'Impossible de charger les données. Veuillez réessayer.',
  action,
}: Partial<StateProps>) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 py-16 text-center">
      <AlertTriangle className="h-12 w-12 text-red-300" aria-hidden />
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="max-w-md text-sm text-gray-500">{description}</p>
      {action}
    </div>
  );
}
