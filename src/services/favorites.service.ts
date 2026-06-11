import { supabase } from '@/lib/supabase';
import type { ListingWithRelations } from '@/types/database';

export async function fetchFavoriteIds(userId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.listing_id as string);
}

export async function fetchFavoriteListings(userId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select(
      `listing:listings(
        *,
        category:product_categories(*),
        producer:producer_profiles(*, profile:profiles(full_name, phone, email)),
        images:listing_images(*)
      )`,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.listing)
    .filter(Boolean) as unknown as ListingWithRelations[];
}

export async function addFavorite(userId: string, listingId: string) {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, listing_id: listingId });
  if (error && error.code !== '23505') throw error; // ignore doublon
}

export async function removeFavorite(userId: string, listingId: string) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);
  if (error) throw error;
}
