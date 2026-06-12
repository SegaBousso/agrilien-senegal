import { supabase } from '@/lib/supabase';

export interface ProducerImpactStats {
  pertes_evitees_kg: number;
  revenu_paye: number;
  transactions_payees: number;
  demandes_recues: number;
  taux_acceptation: number;
}

/** Indicateurs d'impact du producteur connecté (RPC, isolé par current_producer_id). */
export async function fetchProducerImpactStats(): Promise<ProducerImpactStats> {
  const { data, error } = await supabase.rpc('producer_impact_stats');
  if (error) throw error;
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    pertes_evitees_kg: Number(d.pertes_evitees_kg ?? 0),
    revenu_paye: Number(d.revenu_paye ?? 0),
    transactions_payees: Number(d.transactions_payees ?? 0),
    demandes_recues: Number(d.demandes_recues ?? 0),
    taux_acceptation: Number(d.taux_acceptation ?? 0),
  };
}

/** Revenu encaissé par mois (N derniers mois). */
export async function fetchProducerRevenueTrend(
  months = 6,
): Promise<{ label: string; value: number }[]> {
  const { data, error } = await supabase.rpc('producer_revenue_trend', { p_months: months });
  if (error) throw error;
  return ((data ?? []) as { label: string; value: number }[]).map((r) => ({
    label: r.label,
    value: Number(r.value),
  }));
}
