import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** Panneau de contenu standard des espaces (titre + lien « tout voir » + corps). */
export function Panel({
  title,
  to,
  toLabel = 'Tout voir',
  children,
}: {
  title: string;
  to?: string;
  toLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display font-semibold text-gray-900">{title}</h2>
        {to && (
          <Link
            to={to}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary-700 transition-colors hover:text-primary-800"
          >
            {toLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Message vide cohérent à l'intérieur d'un Panel. */
export function PanelEmpty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-gray-500">{children}</p>;
}
