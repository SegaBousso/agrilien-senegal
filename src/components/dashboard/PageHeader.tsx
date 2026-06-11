import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: string;
}

export function StatCard({ label, value, icon, accent = 'bg-primary-50 text-primary-600' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
      </div>
      <p className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
