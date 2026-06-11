import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Conteneur de contenu « biophilic » : surface blanche détachée du fond écru
 * par une ombre douce et une bordure subtile. Tokens sémantiques (dark-ready).
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface shadow-soft transition-shadow duration-200',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pb-0', className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-display text-lg font-semibold text-foreground', className)} {...props} />
  );
}
