import { supabase } from '@/lib/supabase';
import type { PurchaseRequestInput } from '@/lib/validations';
import type {
  PurchaseRequest,
  PurchaseRequestWithRelations,
  RequestStatus,
} from '@/types/database';

const REQUEST_SELECT = `
  *,
  listing:listings(id, title, unit, price, region, images:listing_images(*)),
  buyer:profiles(id, full_name, phone, email)
`;

/** Crée une demande d'achat (acheteur). */
export async function createPurchaseRequest(
  listingId: string,
  buyerId: string,
  input: PurchaseRequestInput,
) {
  const { data, error } = await supabase
    .from('purchase_requests')
    .insert({
      listing_id: listingId,
      buyer_id: buyerId,
      quantity_requested: input.quantity_requested,
      message: input.message,
      status: 'nouvelle',
    })
    .select()
    .single();
  if (error) throw error;
  return data as PurchaseRequest;
}

/** Demandes envoyées par l'acheteur connecté. */
export async function fetchMyRequests(buyerId: string) {
  const { data, error } = await supabase
    .from('purchase_requests')
    .select(REQUEST_SELECT)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PurchaseRequestWithRelations[];
}

/** Demandes reçues sur les annonces du producteur connecté. */
export async function fetchReceivedRequests(listingIds: string[]) {
  if (listingIds.length === 0) return [];
  const { data, error } = await supabase
    .from('purchase_requests')
    .select(REQUEST_SELECT)
    .in('listing_id', listingIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PurchaseRequestWithRelations[];
}

export async function updateRequestStatus(id: string, status: RequestStatus) {
  const { data, error } = await supabase
    .from('purchase_requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PurchaseRequest;
}
