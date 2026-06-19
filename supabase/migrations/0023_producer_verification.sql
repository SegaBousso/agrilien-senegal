-- =============================================================================
-- AgriLien Sénégal — Vérification des producteurs (badge « Producteur vérifié »)
-- Migration 0023 — Phase 1 du système de confiance (style Alibaba) :
--   Le producteur DEMANDE la vérification ; un ADMIN l'accorde ou la refuse.
--   Le badge « vérifié » s'affiche ensuite sur ses annonces et son profil.
--
-- Sécurité : le producteur ne peut JAMAIS s'auto-vérifier. Un trigger
-- (enforce_verification_status) n'autorise le propriétaire qu'à passer en
-- 'en_attente' (depuis 'non_verifie'/'rejete') ; seul un admin pose
-- 'verifie'/'rejete'. La décision admin passe par une RPC journalisée.
--
-- Idempotent.
-- =============================================================================

-- Nouveau type d'enum (création atomique → utilisable dans la même transaction,
-- contrairement à ALTER TYPE ADD VALUE).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type verification_status as enum ('non_verifie', 'en_attente', 'verifie', 'rejete');
  end if;
end $$;

alter table public.producer_profiles
  add column if not exists verification_status verification_status not null default 'non_verifie',
  add column if not exists verified_at        timestamptz,
  add column if not exists verification_notes text;

create index if not exists producer_profiles_verif_idx
  on public.producer_profiles (verification_status);

-- -----------------------------------------------------------------------------
-- Garde-fou des transitions (mirroir d'enforce_listing_status) : empêche
-- l'auto-vérification. Gère verified_at automatiquement.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_verification_status ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is distinct from old.verification_status then
    if public.is_admin () then
      if new.verification_status = 'verifie' then
        new.verified_at := now();
      elsif old.verification_status = 'verifie' then
        new.verified_at := null;
      end if;
    else
      -- Le propriétaire ne peut que DEMANDER la vérification.
      if not (old.verification_status in ('non_verifie', 'rejete')
              and new.verification_status = 'en_attente') then
        raise exception 'Transition de vérification non autorisée.' using errcode = '42501';
      end if;
      new.verified_at := null;
      new.verification_notes := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists producer_verification_guard on public.producer_profiles;
create trigger producer_verification_guard
  before update on public.producer_profiles
  for each row execute function public.enforce_verification_status ();

-- -----------------------------------------------------------------------------
-- Décision admin (vérifier / rejeter), journalisée dans admin_actions.
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_producer_verification (
  p_user_id  uuid,
  p_verified boolean,
  p_notes    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new verification_status;
begin
  if not public.is_admin () then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;

  v_new := case when p_verified then 'verifie'::verification_status
                else 'rejete'::verification_status end;

  update public.producer_profiles
     set verification_status = v_new,
         verification_notes  = p_notes
   where user_id = p_user_id;

  insert into public.admin_actions (admin_id, target_user, action, details)
  values (
    auth.uid (),
    p_user_id,
    case when p_verified then 'producer_verified' else 'producer_rejected' end,
    jsonb_build_object('notes', p_notes)
  );

  -- Notifie le producteur de la décision.
  insert into public.notifications (user_id, type, message)
  values (
    p_user_id,
    'verification',
    case
      when p_verified then 'Félicitations ! Votre compte producteur est vérifié ✓ Le badge est désormais visible sur vos annonces.'
      else 'Votre demande de vérification a été refusée.' || coalesce(' Motif : ' || p_notes, '')
    end
  );
end;
$$;

revoke all on function public.admin_set_producer_verification (uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_producer_verification (uuid, boolean, text) to authenticated;
