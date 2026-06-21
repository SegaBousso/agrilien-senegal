-- =============================================================================
-- AgriLien Sénégal — Carnet de prestataires (annuaire de services vérifiés)
-- Migration 0026 — Première brique de l'expansion « services ».
--
-- Choix assumés (cf. note de cadrage) :
--   • On commence par TRANSPORT et MÉCANISATION (revenu évident, peu régulé) —
--     pas le vétérinaire (le plus régulé/risqué), qui viendra plus tard.
--   • Pas de réservation ni d'acompte côté client : c'est un ANNUAIRE. Le contact
--     est direct (téléphone / WhatsApp). La monétisation est côté PRESTATAIRE,
--     via une ADHÉSION (membership) que l'admin active — elle met l'entrée en
--     avant (« Partenaire ») dans le Carnet.
--   • Vérification calquée sur les producteurs : le prestataire DEMANDE, l'admin
--     accorde. Seules les entrées vérifiées + publiées sont visibles du public.
--
-- Idempotent.
-- =============================================================================

-- Réutilise l'enum verification_status de 0023 (non_verifie/en_attente/verifie/rejete).

create table if not exists public.service_providers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users (id) on delete set null,
  name                text not null,
  category            text not null check (category in ('transport', 'mecanisation')),
  description         text,
  region              text not null,
  commune             text,
  service_areas       text[] not null default '{}',
  phone               text not null,
  whatsapp            text,
  profile_image       text,
  verification_status verification_status not null default 'non_verifie',
  verification_notes  text,
  membership_active   boolean not null default false,
  membership_until    date,
  is_published        boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists service_providers_category_idx on public.service_providers (category);
create index if not exists service_providers_region_idx   on public.service_providers (region);
create index if not exists service_providers_verif_idx    on public.service_providers (verification_status);
create index if not exists service_providers_user_idx     on public.service_providers (user_id);

-- -----------------------------------------------------------------------------
-- updated_at automatique.
-- -----------------------------------------------------------------------------
create or replace function public.touch_service_providers ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists service_providers_touch on public.service_providers;
create trigger service_providers_touch
  before update on public.service_providers
  for each row execute function public.touch_service_providers ();

-- -----------------------------------------------------------------------------
-- Garde-fou : un prestataire ne peut PAS s'auto-vérifier ni s'auto-adhérer.
-- Il peut seulement DEMANDER la vérification (→ 'en_attente'). L'admin pose
-- 'verifie'/'rejete' et active l'adhésion (via RPC).
-- -----------------------------------------------------------------------------
create or replace function public.enforce_provider_status ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin () then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- À la création, le prestataire part toujours de zéro.
    new.verification_status := 'non_verifie';
    new.verification_notes  := null;
    new.membership_active   := false;
    new.membership_until    := null;
  elsif tg_op = 'UPDATE' then
    if new.verification_status is distinct from old.verification_status then
      if not (old.verification_status in ('non_verifie', 'rejete')
              and new.verification_status = 'en_attente') then
        raise exception 'Transition de vérification non autorisée.' using errcode = '42501';
      end if;
      new.verification_notes := null;
    end if;
    -- L'adhésion reste la chasse gardée de l'admin.
    new.membership_active := old.membership_active;
    new.membership_until  := old.membership_until;
  end if;

  return new;
end;
$$;

drop trigger if exists service_provider_status_guard on public.service_providers;
create trigger service_provider_status_guard
  before insert or update on public.service_providers
  for each row execute function public.enforce_provider_status ();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.service_providers enable row level security;

drop policy if exists "Carnet visible (vérifié) ou propriétaire/admin" on public.service_providers;
create policy "Carnet visible (vérifié) ou propriétaire/admin"
  on public.service_providers
  for select
  using (
    (is_published and verification_status = 'verifie')
    or user_id = auth.uid ()
    or public.is_admin ()
  );

drop policy if exists "Prestataire crée son entrée" on public.service_providers;
create policy "Prestataire crée son entrée"
  on public.service_providers
  for insert
  with check (user_id = auth.uid ());

drop policy if exists "Prestataire ou admin met à jour" on public.service_providers;
create policy "Prestataire ou admin met à jour"
  on public.service_providers
  for update
  using (user_id = auth.uid () or public.is_admin ())
  with check (user_id = auth.uid () or public.is_admin ());

drop policy if exists "Prestataire ou admin supprime" on public.service_providers;
create policy "Prestataire ou admin supprime"
  on public.service_providers
  for delete
  using (user_id = auth.uid () or public.is_admin ());

grant select on public.service_providers to anon, authenticated;
grant insert, update, delete on public.service_providers to authenticated;

-- -----------------------------------------------------------------------------
-- Décision admin : vérifier / rejeter (journalisée + notifie le prestataire).
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_provider_verification (
  p_id       uuid,
  p_verified boolean,
  p_notes    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new  verification_status;
  v_user uuid;
  v_name text;
begin
  if not public.is_admin () then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;

  v_new := case when p_verified then 'verifie'::verification_status
                else 'rejete'::verification_status end;

  update public.service_providers
     set verification_status = v_new,
         verification_notes  = p_notes
   where id = p_id
   returning user_id, name into v_user, v_name;

  insert into public.admin_actions (admin_id, target_user, action, details)
  values (
    auth.uid (),
    v_user,
    case when p_verified then 'provider_verified' else 'provider_rejected' end,
    jsonb_build_object('provider_id', p_id, 'notes', p_notes)
  );

  if v_user is not null then
    insert into public.notifications (user_id, type, message)
    values (
      v_user,
      'service',
      case
        when p_verified then 'Votre service « ' || v_name || ' » est vérifié ✓ Il apparaît maintenant dans le Carnet des prestataires.'
        else 'Votre inscription au Carnet a été refusée.' || coalesce(' Motif : ' || p_notes, '')
      end
    );
  end if;
end;
$$;

revoke all on function public.admin_set_provider_verification (uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_provider_verification (uuid, boolean, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Adhésion (« Partenaire ») : active/désactive la mise en avant. Revenu côté
-- prestataire ; le paiement effectif (PayTech) sera branché plus tard.
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_provider_membership (
  p_id     uuid,
  p_active boolean,
  p_until  date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_name text;
begin
  if not public.is_admin () then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;

  update public.service_providers
     set membership_active = p_active,
         membership_until  = case when p_active then p_until else null end
   where id = p_id
   returning user_id, name into v_user, v_name;

  insert into public.admin_actions (admin_id, target_user, action, details)
  values (
    auth.uid (),
    v_user,
    case when p_active then 'provider_membership_on' else 'provider_membership_off' end,
    jsonb_build_object('provider_id', p_id, 'until', p_until)
  );

  if v_user is not null and p_active then
    insert into public.notifications (user_id, type, message)
    values (
      v_user,
      'service',
      'Votre adhésion « Partenaire » est active. Votre service « ' || v_name || ' » est mis en avant dans le Carnet.'
    );
  end if;
end;
$$;

revoke all on function public.admin_set_provider_membership (uuid, boolean, date) from public, anon;
grant execute on function public.admin_set_provider_membership (uuid, boolean, date) to authenticated;
