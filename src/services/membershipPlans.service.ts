import { supabase } from '@/lib/supabase';
import type { MembershipPlan } from '@/types/database';
import type { MembershipPlanInput } from '@/lib/validations';

/** Forfaits proposés au public (actifs), du moins cher au plus engageant. */
export async function fetchActivePlans(): Promise<MembershipPlan[]> {
  const { data, error } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MembershipPlan[];
}

/** Tous les forfaits (écran admin). */
export async function fetchAllPlans(): Promise<MembershipPlan[]> {
  const { data, error } = await supabase
    .from('membership_plans')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MembershipPlan[];
}

function toRow(input: MembershipPlanInput) {
  return {
    name: input.name.trim(),
    duration_days: input.duration_days,
    price: input.price,
    description: input.description?.trim() || null,
    highlight: input.highlight,
    sort_order: input.sort_order,
    is_active: input.is_active,
  };
}

export async function createPlan(input: MembershipPlanInput) {
  const { error } = await supabase.from('membership_plans').insert(toRow(input));
  if (error) throw error;
}

export async function updatePlan(id: string, input: MembershipPlanInput) {
  const { error } = await supabase.from('membership_plans').update(toRow(input)).eq('id', id);
  if (error) throw error;
}

export async function deletePlan(id: string) {
  const { error } = await supabase.from('membership_plans').delete().eq('id', id);
  if (error) throw error;
}
