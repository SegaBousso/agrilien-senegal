import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '@/lib/weather';
import { fetchBuyerProfile, fetchProducerProfile } from '@/services/profiles.service';
import { useAuth } from '@/context/AuthContext';

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

/** Région issue du profil de l'utilisateur connecté (producteur ou acheteur). */
export function useUserRegion(): string | undefined {
  const { profile } = useAuth();
  const isProducer = profile?.role === 'producer';
  const isBuyer = profile?.role === 'buyer';

  const producer = useQuery({
    queryKey: ['producer-profile', profile?.id],
    queryFn: () => fetchProducerProfile(profile!.id),
    enabled: isProducer && !!profile?.id,
  });
  const buyer = useQuery({
    queryKey: ['buyer-profile', profile?.id],
    queryFn: () => fetchBuyerProfile(profile!.id),
    enabled: isBuyer && !!profile?.id,
  });

  return producer.data?.region ?? buyer.data?.region ?? undefined;
}
