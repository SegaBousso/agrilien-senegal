-- =============================================================================
-- AgriLien Sénégal — Fiche utilisateur détaillée (admin)
-- Migration 0022 : RPC SECURITY DEFINER qui renvoie en un seul aller-retour la
-- fiche complète d'un utilisateur pour le modal d'administration : identité,
-- profil de rôle (producteur/acheteur), compteurs d'activité et historique des
-- actions admin. Réservée aux administrateurs (garde is_admin()).
--
-- Idempotent : create or replace.
-- =============================================================================

create or replace function public.admin_user_detail (p_user_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result        json;
  v_producer_id uuid;
begin
  if not public.is_admin () then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;

  -- Profil producteur éventuel (les annonces référencent producer_profiles.id).
  select id into v_producer_id from public.producer_profiles where user_id = p_user_id;

  select json_build_object(
    'profile', (
      select json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'email', p.email,
        'phone', p.phone,
        'role', p.role,
        'suspended', p.suspended,
        'created_at', p.created_at
      )
      from public.profiles p where p.id = p_user_id
    ),
    'producer', (
      select json_build_object(
        'farm_name', pp.farm_name,
        'region', pp.region,
        'commune', pp.commune
      )
      from public.producer_profiles pp where pp.user_id = p_user_id
    ),
    'buyer', (
      select json_build_object(
        'buyer_type', bp.buyer_type,
        'organization_name', bp.organization_name,
        'region', bp.region
      )
      from public.buyer_profiles bp where bp.user_id = p_user_id
    ),
    'activity', json_build_object(
      'listings_count', coalesce((
        select count(*) from public.listings where producer_id = v_producer_id), 0),
      'requests_received', coalesce((
        select count(*) from public.purchase_requests r
        join public.listings l on l.id = r.listing_id
        where l.producer_id = v_producer_id), 0),
      'requests_sent', coalesce((
        select count(*) from public.purchase_requests where buyer_id = p_user_id), 0),
      'favorites_count', coalesce((
        select count(*) from public.favorites where user_id = p_user_id), 0),
      'deposits_paid_count', coalesce((
        select count(*) from public.transactions where buyer_id = p_user_id and status = 'paye'), 0),
      'deposits_paid_amount', coalesce((
        select sum(amount) from public.transactions where buyer_id = p_user_id and status = 'paye'), 0)
    ),
    'recent_actions', coalesce((
      select json_agg(a) from (
        select aa.action, aa.created_at, aa.details, ap.full_name as admin_name
        from public.admin_actions aa
        left join public.profiles ap on ap.id = aa.admin_id
        where aa.target_user = p_user_id
        order by aa.created_at desc
        limit 5
      ) a
    ), '[]'::json)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_user_detail (uuid) from public, anon;
grant execute on function public.admin_user_detail (uuid) to authenticated;
