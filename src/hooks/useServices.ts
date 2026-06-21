import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createService,
  deleteService,
  fetchActiveServices,
  fetchAllServices,
  updateService,
} from '@/services/services.service';
import type { ServiceInput } from '@/lib/validations';

/** Catalogue public (services actifs). */
export function useActiveServices() {
  return useQuery({ queryKey: ['services', 'active'], queryFn: fetchActiveServices });
}

/** Tout le catalogue (admin). */
export function useAllServices() {
  return useQuery({ queryKey: ['services', 'all'], queryFn: fetchAllServices });
}

export function useServiceMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['services'] });

  const create = useMutation({ mutationFn: (input: ServiceInput) => createService(input), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ServiceInput }) => updateService(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: string) => deleteService(id), onSuccess: invalidate });

  return { create, update, remove };
}
