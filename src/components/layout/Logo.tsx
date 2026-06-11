import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, white = false }: { className?: string; white?: boolean }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2', className)} aria-label="AgriLien Sénégal — accueil">
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          white ? 'bg-white/15' : 'bg-primary-600',
        )}
      >
        <Sprout className={cn('h-5 w-5', white ? 'text-white' : 'text-accent-400')} />
      </span>
      <span className={cn('text-lg font-bold tracking-tight', white ? 'text-white' : 'text-gray-900')}>
        Agri<span className="text-primary-600">Lien</span>
      </span>
    </Link>
  );
}
