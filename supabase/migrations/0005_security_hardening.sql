-- =============================================================================
-- AgriLien Sénégal — Durcissement sécurité & intégrité
-- Migration 0005 (suite à l'audit). À exécuter dans le SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- [CRITIQUE] Élévation de privilèges : un utilisateur pouvait modifier SON
-- propre profil, y compris la colonne `role`, et se promouvoir 'admin'
-- (policy "Chacun modifie son profil" sans restriction de colonne).
-- On bloque, pour les non-admins, toute modification de `role` et `email`.
-- -----------------------------------------------------------------------------
create or replace function public.protect_profile_columns ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin () then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Modification du rôle interdite.' using errcode = '42501';
  end if;
  if new.email is distinct from old.email then
    raise exception 'Modification de l''email interdite ici.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns ();

-- -----------------------------------------------------------------------------
-- [ÉLEVÉ] Altération de données d'autrui : la policy de mise à jour des
-- demandes par le producteur (sans WITH CHECK) autorisait la modification de
-- N'IMPORTE quelle colonne (buyer_id, listing_id, quantity_requested, message),
-- pas seulement `status`. On rend ces colonnes immuables pour les non-admins.
-- -----------------------------------------------------------------------------
create or replace function public.protect_request_columns ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin () then
    return new;
  end if;
  if new.buyer_id is distinct from old.buyer_id
     or new.listing_id is distinct from old.listing_id
     or new.quantity_requested is distinct from old.quantity_requested
     or coalesce(new.message, '') is distinct from coalesce(old.message, '') then
    raise exception 'Seul le statut d''une demande peut être modifié.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists requests_protect_columns on public.purchase_requests;
create trigger requests_protect_columns
  before update on public.purchase_requests
  for each row execute function public.protect_request_columns ();

-- Ajoute le WITH CHECK manquant (défense en profondeur).
drop policy if exists "Producteur met à jour le statut des demandes reçues" on public.purchase_requests;
create policy "Producteur met à jour le statut des demandes reçues"
  on public.purchase_requests for update
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.producer_id = public.current_producer_id ()
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.producer_id = public.current_producer_id ()
    )
  );

-- L'acheteur peut annuler (supprimer) sa propre demande.
drop policy if exists "Acheteur annule sa demande" on public.purchase_requests;
create policy "Acheteur annule sa demande"
  on public.purchase_requests for delete using (buyer_id = auth.uid ());

-- -----------------------------------------------------------------------------
-- [INTÉGRITÉ] Une demande ne peut pas dépasser la quantité disponible.
-- -----------------------------------------------------------------------------
create or replace function public.check_request_quantity ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  available numeric;
begin
  select quantity into available from public.listings where id = new.listing_id;
  if available is not null and new.quantity_requested > available then
    raise exception 'Quantité demandée (%) supérieure au stock disponible (%).',
      new.quantity_requested, available using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists requests_check_quantity on public.purchase_requests;
create trigger requests_check_quantity
  before insert on public.purchase_requests
  for each row execute function public.check_request_quantity ();

-- -----------------------------------------------------------------------------
-- [CONFIDENTIALITÉ] La policy SELECT sur profiles (`using true`) exposait
-- l'email + le téléphone de TOUS les comptes (y compris acheteurs) à n'importe
-- qui, via la clé anon. On restreint : soi-même, admin, profils producteurs
-- (publics car vendeurs), et acheteurs ayant écrit au producteur courant.
-- -----------------------------------------------------------------------------
drop policy if exists "Profils lisibles par tous (infos publiques producteur)" on public.profiles;
create policy "Lecture des profils (restreinte)"
  on public.profiles for select using (
    auth.uid () = id
    or public.is_admin ()
    or exists (select 1 from public.producer_profiles pp where pp.user_id = profiles.id)
    or exists (
      select 1
      from public.purchase_requests r
      join public.listings l on l.id = r.listing_id
      where r.buyer_id = profiles.id
        and l.producer_id = public.current_producer_id ()
    )
  );

-- -----------------------------------------------------------------------------
-- [DURCISSEMENT] Upload Storage : restreint l'écriture au dossier de l'uid
-- (convention de chemin "{uid}/{listingId}/fichier"). Empêche d'écrire sous le
-- préfixe d'un autre utilisateur.
-- -----------------------------------------------------------------------------
drop policy if exists "Utilisateur authentifié peut uploader" on storage.objects;
create policy "Utilisateur authentifié peut uploader"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid ()::text
  );
