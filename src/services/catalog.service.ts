import { supabase } from '@/lib/supabase';
import { STORAGE_BUCKET } from '@/lib/supabase';
import type { CategoryInput } from '@/lib/validations';
import type { ProductCategory, Region } from '@/types/database';

// --- Régions ------------------------------------------------------------------
export async function fetchRegions() {
  const { data, error } = await supabase.from('regions').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Region[];
}

// --- Catégories ---------------------------------------------------------------
export async function fetchCategories(activeOnly = true) {
  let query = supabase.from('product_categories').select('*').order('name');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ProductCategory[];
}

export async function createCategory(input: CategoryInput) {
  const { data, error } = await supabase
    .from('product_categories')
    .insert({ ...input, description: input.description || null, icon: input.icon || null })
    .select()
    .single();
  if (error) throw error;
  return data as ProductCategory;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const { data, error } = await supabase
    .from('product_categories')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ProductCategory;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('product_categories').delete().eq('id', id);
  if (error) throw error;
}

// --- Images d'annonce (Storage + table) --------------------------------------
export async function uploadListingImage(userId: string, listingId: string, file: File) {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${listingId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

export async function addListingImage(listingId: string, imageUrl: string, isMain: boolean) {
  const { error } = await supabase
    .from('listing_images')
    .insert({ listing_id: listingId, image_url: imageUrl, is_main: isMain });
  if (error) throw error;
}

export async function deleteListingImage(id: string) {
  const { error } = await supabase.from('listing_images').delete().eq('id', id);
  if (error) throw error;
}
