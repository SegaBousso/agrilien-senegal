-- =============================================================================
-- AgriLien Sénégal — Row Level Security
-- Migration 0002 : helpers + politiques RLS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- HELPERS (SECURITY DEFINER pour éviter la récursion RLS sur profiles)
-- -----------------------------------------------------------------------------
create or replace function public.current_user_role ()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid ();
$$;

create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid () and role = 'admin'
  );
$$;

-- id du producer_profile appartenant à l'utilisateur courant
create or replace function public.current_producer_id ()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.producer_profiles where user_id = auth.uid ();
$$;

-- -----------------------------------------------------------------------------
-- ACTIVATION RLS
-- -----------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.producer_profiles   enable row level security;
alter table public.buyer_profiles      enable row level security;
alter table public.product_categories  enable row level security;
alter table public.regions             enable row level security;
alter table public.listings            enable row level security;
alter table public.listing_images      enable row level security;
alter table public.purchase_requests   enable row level security;
alter table public.favorites           enable row level security;
alter table public.notifications       enable row level security;

-- -----------------------------------------------------------------------------
-- PROFILES
-- -----------------------------------------------------------------------------
create policy "Profils lisibles par tous (infos publiques producteur)"
  on public.profiles for select using (true);

create policy "Chacun modifie son profil"
  on public.profiles for update using (auth.uid () = id) with check (auth.uid () = id);

create policy "Admin gère tous les profils"
  on public.profiles for all using (public.is_admin ()) with check (public.is_admin ());

-- -----------------------------------------------------------------------------
-- PRODUCER_PROFILES
-- -----------------------------------------------------------------------------
create policy "Profils producteur publics"
  on public.producer_profiles for select using (true);

create policy "Producteur gère son profil"
  on public.producer_profiles for all
  using (user_id = auth.uid () or public.is_admin ())
  with check (user_id = auth.uid () or public.is_admin ());

-- -----------------------------------------------------------------------------
-- BUYER_PROFILES
-- -----------------------------------------------------------------------------
create policy "Acheteur voit son profil"
  on public.buyer_profiles for select
  using (user_id = auth.uid () or public.is_admin ());

create policy "Acheteur gère son profil"
  on public.buyer_profiles for all
  using (user_id = auth.uid () or public.is_admin ())
  with check (user_id = auth.uid () or public.is_admin ());

-- -----------------------------------------------------------------------------
-- REGIONS & CATEGORIES (lecture publique, écriture admin)
-- -----------------------------------------------------------------------------
create policy "Régions lisibles par tous"
  on public.regions for select using (true);
create policy "Admin gère les régions"
  on public.regions for all using (public.is_admin ()) with check (public.is_admin ());

create policy "Catégories actives lisibles par tous"
  on public.product_categories for select using (is_active or public.is_admin ());
create policy "Admin gère les catégories"
  on public.product_categories for all using (public.is_admin ()) with check (public.is_admin ());

-- -----------------------------------------------------------------------------
-- LISTINGS
--   - Annonces publiées visibles par tous.
--   - Le producteur voit/gère ses propres annonces.
--   - Le producteur peut créer/modifier mais NE PEUT PAS passer en 'publiee'
--     ou 'suspendue' lui-même (réservé admin) -> contrôlé par trigger.
-- -----------------------------------------------------------------------------
create policy "Annonces publiées visibles par tous"
  on public.listings for select using (status = 'publiee');

create policy "Producteur voit ses annonces"
  on public.listings for select using (producer_id = public.current_producer_id ());

create policy "Admin voit toutes les annonces"
  on public.listings for select using (public.is_admin ());

create policy "Producteur crée ses annonces"
  on public.listings for insert
  with check (producer_id = public.current_producer_id ());

create policy "Producteur modifie ses annonces"
  on public.listings for update
  using (producer_id = public.current_producer_id ())
  with check (producer_id = public.current_producer_id ());

create policy "Admin modifie toutes les annonces"
  on public.listings for update using (public.is_admin ()) with check (public.is_admin ());

create policy "Producteur supprime ses annonces"
  on public.listings for delete
  using (producer_id = public.current_producer_id () or public.is_admin ());

-- Empêche un producteur de publier/suspendre lui-même : seuls les admins
-- peuvent positionner ces statuts. Le producteur reste limité aux statuts
-- 'brouillon', 'en_attente', 'vendue', 'expiree'.
create or replace function public.enforce_listing_status ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin () then
    return new;
  end if;
  if new.status in ('publiee', 'suspendue')
     and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    raise exception 'Seul un administrateur peut publier ou suspendre une annonce.';
  end if;
  return new;
end;
$$;

create trigger listings_status_guard
  before insert or update on public.listings
  for each row execute function public.enforce_listing_status ();

-- -----------------------------------------------------------------------------
-- LISTING_IMAGES
-- -----------------------------------------------------------------------------
create policy "Images d'annonces publiées visibles par tous"
  on public.listing_images for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'publiee'
             or l.producer_id = public.current_producer_id ()
             or public.is_admin ())
    )
  );

create policy "Producteur gère les images de ses annonces"
  on public.listing_images for all
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.producer_id = public.current_producer_id () or public.is_admin ())
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.producer_id = public.current_producer_id () or public.is_admin ())
    )
  );

-- -----------------------------------------------------------------------------
-- PURCHASE_REQUESTS
--   - L'acheteur voit/crée ses demandes.
--   - Le producteur voit les demandes sur SES annonces et peut en changer le statut.
-- -----------------------------------------------------------------------------
create policy "Acheteur voit ses demandes"
  on public.purchase_requests for select
  using (buyer_id = auth.uid ());

create policy "Producteur voit les demandes sur ses annonces"
  on public.purchase_requests for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.producer_id = public.current_producer_id ()
    )
  );

create policy "Admin voit toutes les demandes"
  on public.purchase_requests for select using (public.is_admin ());

create policy "Acheteur crée ses demandes"
  on public.purchase_requests for insert
  with check (buyer_id = auth.uid ());

create policy "Producteur met à jour le statut des demandes reçues"
  on public.purchase_requests for update
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.producer_id = public.current_producer_id ()
    )
  );

-- -----------------------------------------------------------------------------
-- FAVORITES
-- -----------------------------------------------------------------------------
create policy "Acheteur voit ses favoris"
  on public.favorites for select using (user_id = auth.uid ());

create policy "Acheteur gère ses favoris"
  on public.favorites for all
  using (user_id = auth.uid ()) with check (user_id = auth.uid ());

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS
-- -----------------------------------------------------------------------------
create policy "Utilisateur voit ses notifications"
  on public.notifications for select using (user_id = auth.uid ());

create policy "Utilisateur met à jour ses notifications"
  on public.notifications for update
  using (user_id = auth.uid ()) with check (user_id = auth.uid ());
