-- =============================================================================
-- AgriLien Sénégal — Gestion sécurisée des utilisateurs par l'admin
-- Migration 0017 : journal d'audit + indicateur de suspension.
--
-- Principe (moindre privilège + traçabilité) : les actions sensibles
-- (suspendre, réactiver, réinitialiser le mot de passe) passent par l'Edge
-- Function `admin-users` (service_role + garde is_admin) et sont JOURNALISÉES.
-- L'admin ne DÉFINIT jamais un mot de passe : il déclenche un email de reset.
-- =============================================================================

-- Indicateur de suspension (miroir UI du ban auth.users géré par l'Edge Function).
alter table public.profiles
  add column if not exists suspended boolean not null default false;

-- Journal d'audit des actions admin sur les comptes.
create table if not exists public.admin_actions (
  id           uuid primary key default gen_random_uuid (),
  admin_id     uuid references public.profiles (id) on delete set null,
  target_user  uuid references public.profiles (id) on delete set null,
  action       text not null,            -- 'suspend' | 'reactivate' | 'reset_password' | 'role_change'
  details      jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists admin_actions_target_idx on public.admin_actions (target_user);
create index if not exists admin_actions_created_idx on public.admin_actions (created_at desc);

-- RLS : lecture réservée aux admins ; écriture réservée au service_role
-- (Edge Function) -> aucune policy d'insert pour les clients.
alter table public.admin_actions enable row level security;

create policy "Admin lit le journal d'audit"
  on public.admin_actions for select using (public.is_admin ());
