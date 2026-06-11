-- =============================================================================
-- AgriLien Sénégal — Storage (images d'annonces)
-- Migration 0004 : bucket public + politiques
-- =============================================================================

-- Bucket public en lecture pour afficher les photos des annonces.
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Lecture publique
create policy "Images d'annonces lisibles publiquement"
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- Upload réservé aux utilisateurs authentifiés (producteurs).
create policy "Utilisateur authentifié peut uploader"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images');

-- Un utilisateur ne peut modifier/supprimer que ses propres fichiers
-- (convention : préfixe du chemin = uid de l'utilisateur, ex. "{uid}/photo.jpg").
create policy "Utilisateur gère ses fichiers"
  on storage.objects for update to authenticated
  using (bucket_id = 'listing-images' and owner = auth.uid ());

create policy "Utilisateur supprime ses fichiers"
  on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and owner = auth.uid ());
