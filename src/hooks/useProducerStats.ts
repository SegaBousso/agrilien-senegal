import { useQuery } from '@tanstack/react-query';
import {
  fetchProducerImpactStats,
  fetchProducerRevenueTrend,
} from '@/services/producer.service';

export function useProducerImpactStats(enabled: boolean) {
  return useQuery({
    queryKey: ['producer', 'impact'],
    queryFn: fetchProducerImpactStats,
    enabled,
  });
}

export function useProducerRevenueTrend(enabled: boolean, months = 6) {
  return useQuery({
    queryKey: ['producer', 'revenue-trend', months],
    queryFn: () => fetchProducerRevenueTrend(months),
    enabled,
  });
}
