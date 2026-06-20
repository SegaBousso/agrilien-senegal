import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Sun,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/States';
import { useWeather } from '@/hooks/useWeather';
import { weatherLabel } from '@/lib/weather';

/** Icône correspondant à un code météo WMO. */
function iconFor(code: number): LucideIcon {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return CloudRain;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });

interface Props {
  region: string | undefined | null;
  /** Variante réduite (météo actuelle seule, sans prévisions). */
  compact?: boolean;
  className?: string;
}

export function WeatherWidget({ region, compact, className = '' }: Props) {
  const { data, isLoading, isError } = useWeather(region);

  if (!region) return null;

  const base = 'rounded-2xl border border-border bg-surface p-4 shadow-soft';

  if (isLoading) {
    return (
      <div className={`${base} ${className}`}>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-9 w-24" />
        {!compact && <Skeleton className="mt-4 h-12 w-full" />}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={`${base} ${className}`}>
        <p className="text-sm font-medium text-gray-900">Météo · {region}</p>
        <p className="mt-2 text-sm text-gray-500">Météo indisponible pour le moment.</p>
      </div>
    );
  }

  const Now = iconFor(data.code);

  return (
    <div className={`${base} ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Météo · {region}</p>
        <span className="text-xs text-gray-400">{weatherLabel(data.code)}</span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Now className="h-10 w-10 text-primary-600" aria-hidden />
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl font-extrabold tracking-tight text-gray-900">{data.temp}</span>
          <span className="text-lg text-gray-500">°C</span>
        </div>
        <div className="ml-auto space-y-1 text-right text-xs text-gray-500">
          <p className="flex items-center justify-end gap-1">
            <Droplets className="h-3.5 w-3.5" /> {data.humidity}%
          </p>
          <p className="flex items-center justify-end gap-1">
            <Wind className="h-3.5 w-3.5" /> {data.wind} km/h
          </p>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border pt-3">
          {data.daily.map((d, i) => {
            const Icon = iconFor(d.code);
            return (
              <div key={d.date} className="flex flex-col items-center gap-1 text-center">
                <span className="text-[11px] font-medium uppercase text-gray-400">
                  {i === 0 ? "Auj." : DAY_FMT.format(new Date(d.date)).replace('.', '')}
                </span>
                <Icon className="h-5 w-5 text-gray-500" aria-hidden />
                <span className="text-xs text-gray-900">{d.max}°</span>
                <span className="text-[11px] text-gray-400">{d.min}°</span>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-[11px] text-gray-400">Source : Open-Meteo</p>
    </div>
  );
}
