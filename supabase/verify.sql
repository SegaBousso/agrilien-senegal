-- =============================================================================
-- AgriLien Sénégal — Script de vérification (lecture seule)
-- À exécuter dans le SQL Editor de Supabase APRÈS les 4 migrations.
-- Chaque bloc renvoie un rapport ; tout doit être au vert (status = 'OK').
-- =============================================================================

-- 1) Tables attendues -----------------------------------------------------------
with expected(name) as (
  values ('profiles'), ('regions'), ('producer_profiles'), ('buyer_profiles'),
         ('product_categories'), ('listings'), ('listing_images'),
         ('purchase_requests'), ('favorites'), ('notifications')
)
select
  e.name as table_name,
  case when t.tablename is null then '❌ MANQUANTE' else '✅ OK' end as status
from expected e
left join pg_tables t on t.tablename = e.name and t.schemaname = 'public'
order by e.name;

-- 2) RLS activée sur chaque table ----------------------------------------------
select
  c.relname as table_name,
  case when c.relrowsecurity then '✅ RLS ON' else '❌ RLS OFF' end as status,
  count(p.polname) as nb_policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles','regions','producer_profiles','buyer_profiles','product_categories',
    'listings','listing_images','purchase_requests','favorites','notifications'
  )
group by c.relname, c.relrowsecurity
order by c.relname;

-- 3) Enums (types) -------------------------------------------------------------
with expected(name) as (
  values ('user_role'), ('buyer_type'), ('listing_status'), ('request_status')
)
select
  e.name as enum_name,
  case when t.typname is null then '❌ MANQUANT' else '✅ OK' end as status
from expected e
left join pg_type t on t.typname = e.name
order by e.name;

-- 4) Fonctions & triggers ------------------------------------------------------
with expected(name) as (
  values ('handle_new_user'), ('set_updated_at'), ('enforce_listing_status'),
         ('is_admin'), ('current_producer_id'), ('current_user_role')
)
select
  e.name as function_name,
  case when p.proname is null then '❌ MANQUANTE' else '✅ OK' end as status
from expected e
left join pg_proc p on p.proname = e.name
order by e.name;

select
  tgname as trigger_name,
  case when tgname is null then '❌' else '✅ OK' end as status
from pg_trigger
where tgname in ('on_auth_user_created', 'listings_status_guard', 'listings_updated_at', 'profiles_updated_at')
order by tgname;

-- 5) Données initiales ----------------------------------------------------------
select
  '14 régions attendues' as verif,
  count(*) as trouve,
  case when count(*) = 14 then '✅ OK' else '⚠️ vérifier' end as status
from public.regions;

select
  'Catégories actives' as verif,
  count(*) as trouve,
  case when count(*) >= 1 then '✅ OK' else '⚠️ aucune' end as status
from public.product_categories
where is_active;

-- 6) Storage : bucket des images -----------------------------------------------
select
  'bucket listing-images' as verif,
  case
    when exists (select 1 from storage.buckets where id = 'listing-images' and public)
    then '✅ OK (public)'
    else '❌ MANQUANT — créez-le (Storage > New bucket, public)'
  end as status;

-- 7) Comptes administrateurs ---------------------------------------------------
select
  'Administrateurs' as verif,
  count(*) as nombre,
  case when count(*) >= 1 then '✅ OK'
       else '⚠️ aucun admin — exécutez: update public.profiles set role=''admin'' where email=''vous@exemple.com'';'
  end as status
from public.profiles
where role = 'admin';
