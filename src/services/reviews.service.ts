import { supabase } from '@/lib/supabase';
import type { ProducerReview } from '@/types/database';

/** Avis publics d'un producteur (les plus récents d'abord). */
export async function fetchProducerReviews(producerId: string, limit = 10): Promise<ProducerReview[]> {
  const { data, error } = await supabase
    .from('producer_reviews')
    .select('*')
    .eq('producer_id', producerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ProducerReview[];
}

/** Avis déposés par l'acheteur (pour savoir ce qui est déjà noté). */
export async function fetchMyReviews(buyerId: string): Promise<ProducerReview[]> {
  const { data, error } = await supabase
    .from('producer_reviews')
    .select('*')
    .eq('buyer_id', buyerId);
  if (error) throw error;
  return (data ?? []) as ProducerReview[];
}

/** Dépose ou met à jour un avis (RPC : vérifie l'achat côté serveur). */
export async function submitProducerReview(transactionId: string, rating: number, comment?: string) {
  const { error } = await supabase.rpc('submit_producer_review', {
    p_transaction_id: transactionId,
    p_rating: rating,
    p_comment: comment ?? null,
  });
  if (error) throw error;
}
