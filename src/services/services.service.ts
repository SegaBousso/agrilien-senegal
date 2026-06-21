import { supabase } from '@/lib/supabase';
import type { Service } from '@/types/database';
import type { ServiceInput } from '@/lib/validations';

/** Catalogue public : services actifs, groupés par domaine puis ordre. */
export async function fetchActiveServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('domain', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Service[];
}

/** Tout le catalogue (écran admin). */
export async function fetchAllServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('domain', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Service[];
}

function toRow(input: ServiceInput) {
  return {
    name: input.name.trim(),
    domain: input.domain,
    description: input.description?.trim() || null,
    icon: input.icon?.trim() || null,
    sort_order: input.sort_order,
    is_active: input.is_active,
  };
}

export async function createService(input: ServiceInput) {
  const { error } = await supabase.from('services').insert(toRow(input));
  if (error) throw error;
}

export async function updateService(id: string, input: ServiceInput) {
  const { error } = await supabase.from('services').update(toRow(input)).eq('id', id);
  if (error) throw error;
}

export async function deleteService(id: string) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}
