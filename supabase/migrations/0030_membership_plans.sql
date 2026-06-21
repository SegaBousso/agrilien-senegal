-- =============================================================================
-- AgriLien Sénégal — Forfaits d'adhésion « Partenaire »
-- Migration 0030 — Transforme l'adhésion à prix unique (0029) en un CATALOGUE
-- de forfaits géré par l'admin (mensuel, trimestriel, annuel…), façon page de
-- tarification d'un site d'abonnement.
--
-- Le prix et la durée d'un forfait restent la SOURCE DE VÉRITÉ côté serveur :
-- l'Edge Function membership-initiate lit le forfait choisi ici (jamais le
-- montant envoyé par le client). transactions.membership_days est rempli depuis
-- duration_days du forfait, et le trigger d'activation (0029) l'utilise tel quel.
--
-- Idempotent.
-- =============================================================================

create table if not exists public.membership_plans (
  id            uuid primary key default gen_random_uuid (),
  name          text not null unique,
  duration_days integer not null check (duration_days > 0),
  price         numeric(12, 2) not null check (price >= 0),
  description   text,
  highlight     boolean not null default false,  -- forfait « recommandé »
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists membership_plans_active_idx on public.membership_plans (is_active);

drop trigger if exists membership_plans_updated_at on public.membership_plans;
create trigger membership_plans_updated_at
  before update on public.membership_plans
  for each row execute function public.set_updated_at ();

alter table public.membership_plans enable row level security;

drop policy if exists "Forfaits actifs visibles, admin tout" on public.membership_plans;
create policy "Forfaits actifs visibles, admin tout"
  on public.membership_plans
  for select
  using (is_active or public.is_admin ());

drop policy if exists "Admin gère les forfaits" on public.membership_plans;
create policy "Admin gère les forfaits"
  on public.membership_plans
  for all
  using (public.is_admin ())
  with check (public.is_admin ());

grant select on public.membership_plans to anon, authenticated;
grant insert, update, delete on public.membership_plans to authenticated;

-- Traçabilité : on garde le forfait acheté sur la transaction.
alter table public.transactions
  add column if not exists membership_plan_id uuid references public.membership_plans (id) on delete set null;

-- -----------------------------------------------------------------------------
-- Amorce : trois forfaits par défaut (l'admin peut tout modifier ensuite).
-- -----------------------------------------------------------------------------
insert into public.membership_plans (name, duration_days, price, description, highlight, sort_order) values
  ('Mensuel',     30,  10000, 'Pour tester la mise en avant, sans engagement.',        false, 10),
  ('Trimestriel', 90,  27000, '3 mois — environ 10% d''économie par rapport au mois.', true,  20),
  ('Annuel',      365, 90000, '12 mois — la meilleure valeur (~25% d''économie).',     false, 30)
on conflict (name) do nothing;
