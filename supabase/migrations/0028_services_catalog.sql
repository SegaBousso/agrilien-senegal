-- =============================================================================
-- AgriLien Sénégal — Catalogue de services + liaison prestataires
-- Migration 0028 — Le cœur du modèle « services » :
--   • L'ADMIN tient un CATALOGUE de services (table `services`), groupés par
--     domaine (transport, mécanisation, élevage, conseil, autre).
--   • Chaque prestataire COCHE les services qu'il propose (table de liaison
--     `provider_services`, N-N).
--   • handle_new_user accepte désormais le rôle 'prestataire' (ajouté en 0027).
--
-- Dépend de 0026 (service_providers) et 0027 (enum 'prestataire').
-- Idempotent.
-- =============================================================================

-- Nettoyage défensif : si une ancienne version de 0026 (avec une colonne
-- `category` en dur) a été appliquée, on la retire — le métier vient désormais
-- du catalogue.
alter table public.service_providers drop column if exists category;

-- -----------------------------------------------------------------------------
-- CATALOGUE DE SERVICES (géré par l'admin)
-- -----------------------------------------------------------------------------
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid (),
  name        text not null unique,
  domain      text not null default 'autre'
              check (domain in ('transport', 'mecanisation', 'elevage', 'conseil', 'autre')),
  description text,
  icon        text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists services_domain_idx on public.services (domain);
create index if not exists services_active_idx on public.services (is_active);

alter table public.services enable row level security;

drop policy if exists "Services actifs visibles, admin tout" on public.services;
create policy "Services actifs visibles, admin tout"
  on public.services
  for select
  using (is_active or public.is_admin ());

drop policy if exists "Admin gère le catalogue de services" on public.services;
create policy "Admin gère le catalogue de services"
  on public.services
  for all
  using (public.is_admin ())
  with check (public.is_admin ());

grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;

-- -----------------------------------------------------------------------------
-- LIAISON prestataire ↔ services proposés (N-N)
-- -----------------------------------------------------------------------------
create table if not exists public.provider_services (
  provider_id uuid not null references public.service_providers (id) on delete cascade,
  service_id  uuid not null references public.services (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (provider_id, service_id)
);

create index if not exists provider_services_service_idx on public.provider_services (service_id);

alter table public.provider_services enable row level security;

-- Lecture publique (sert à afficher les services d'une fiche). Lien non sensible.
drop policy if exists "Liaisons services visibles" on public.provider_services;
create policy "Liaisons services visibles"
  on public.provider_services
  for select
  using (true);

-- Le prestataire gère SES liaisons ; l'admin peut tout.
drop policy if exists "Prestataire gère ses services" on public.provider_services;
create policy "Prestataire gère ses services"
  on public.provider_services
  for all
  using (
    public.is_admin ()
    or exists (
      select 1 from public.service_providers sp
      where sp.id = provider_id and sp.user_id = auth.uid ()
    )
  )
  with check (
    public.is_admin ()
    or exists (
      select 1 from public.service_providers sp
      where sp.id = provider_id and sp.user_id = auth.uid ()
    )
  );

grant select on public.provider_services to anon, authenticated;
grant insert, delete on public.provider_services to authenticated;

-- -----------------------------------------------------------------------------
-- handle_new_user : accepte le rôle 'prestataire' (en plus de producer/buyer).
-- La promotion 'admin' reste impossible depuis l'inscription publique (0012).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Utilisateur'),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    case
      when new.raw_user_meta_data ->> 'role' in ('producer', 'buyer', 'prestataire')
        then (new.raw_user_meta_data ->> 'role')::user_role
      else 'buyer'
    end
  );
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Amorce : quelques services pour que le catalogue ne soit pas vide.
-- L'admin pourra en ajouter / désactiver depuis l'interface.
-- -----------------------------------------------------------------------------
insert into public.services (name, domain, description, sort_order) values
  ('Transport de récoltes',        'transport',   'Acheminement des productions vers les marchés et acheteurs.', 10),
  ('Transport de bétail',          'transport',   'Convoyage d''animaux (Tabaski, marchés à bestiaux).',          20),
  ('Location de camion / bâché',   'transport',   'Mise à disposition de véhicules avec ou sans chauffeur.',      30),
  ('Labour au tracteur',           'mecanisation','Préparation des sols à la charrue / au pulvériseur.',          40),
  ('Semis mécanisé',               'mecanisation','Semoir tracté pour arachide, mil, maïs.',                      50),
  ('Battage / récolte mécanisée',  'mecanisation','Battage de l''arachide et des céréales, moissonnage.',         60)
on conflict (name) do nothing;
