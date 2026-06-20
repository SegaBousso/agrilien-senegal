import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createOfficialPrice,
  deleteOfficialPrice,
  fetchActiveOfficialPrices,
  fetchAllOfficialPrices,
  updateOfficialPrice,
} from '@/services/officialPrices.service';
import type { OfficialPriceInput } from '@/lib/validations';

/** Références en vigueur — utilisées par le formulaire et la fiche d'annonce. */
export function useActiveOfficialPrices() {
  return useQuery({
    queryKey: ['official-prices', 'active'],
    queryFn: fetchActiveOfficialPrices,
    staleTime: 5 * 60 * 1000,
  });
}

/** Toutes les références (écran admin). */
export function useAllOfficialPrices() {
  return useQuery({ queryKey: ['official-prices', 'all'], queryFn: fetchAllOfficialPrices });
}

export function useOfficialPriceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['official-prices'] });

  const create = useMutation({ mutationFn: createOfficialPrice, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: OfficialPriceInput }) =>
      updateOfficialPrice(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteOfficialPrice, onSuccess: invalidate });

  return { create, update, remove };
}
