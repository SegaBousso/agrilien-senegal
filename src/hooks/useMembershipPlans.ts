import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPlan,
  deletePlan,
  fetchActivePlans,
  fetchAllPlans,
  updatePlan,
} from '@/services/membershipPlans.service';
import type { MembershipPlanInput } from '@/lib/validations';

/** Forfaits actifs (page publique de tarification). */
export function useActivePlans() {
  return useQuery({ queryKey: ['membership-plans', 'active'], queryFn: fetchActivePlans });
}

/** Tous les forfaits (admin). */
export function useAllPlans() {
  return useQuery({ queryKey: ['membership-plans', 'all'], queryFn: fetchAllPlans });
}

export function usePlanMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['membership-plans'] });

  const create = useMutation({ mutationFn: (input: MembershipPlanInput) => createPlan(input), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: MembershipPlanInput }) => updatePlan(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: string) => deletePlan(id), onSuccess: invalidate });

  return { create, update, remove };
}
