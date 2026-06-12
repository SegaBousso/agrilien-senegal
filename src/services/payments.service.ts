import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/types/database';

interface InitiatePaymentResult {
  redirect_url: string;
  token: string;
}

/**
 * Initie un paiement PayTech pour une demande d'achat acceptée.
 * Le montant est calculé côté serveur (Edge Function) — le client n'envoie que
 * l'identifiant de la demande. Renvoie l'URL de redirection vers le checkout.
 */
export async function initiatePayment(requestId: string): Promise<InitiatePaymentResult> {
  const { data, error } = await supabase.functions.invoke<InitiatePaymentResult>(
    'payment-initiate',
    { body: { request_id: requestId } },
  );
  if (error) throw error;
  if (!data?.redirect_url) throw new Error('Réponse de paiement invalide.');
  return data;
}

/** Transactions de l'acheteur connecté (RLS : limitées aux siennes). */
export async function fetchMyTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Transaction[];
}
