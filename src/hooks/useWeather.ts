import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '@/lib/weather';

/** Météo d'une région (mise en cache 30 min). */
export function useWeather(region: string | undefined | null) {
  return useQuery({
    queryKey: ['weather', region],
    queryFn: () => fetchWeather(region!),
    enabled: !!region,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
