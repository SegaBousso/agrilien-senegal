-- =============================================================================
-- AgriLien Sénégal — Admin : comptage par région en base
-- Migration 0015 : fetchAdminStats chargeait TOUTES les lignes `region` côté
-- client (plafond Supabase de 1000 lignes -> stats fausses au-delà). On agrège
-- en base via une RPC SECURITY DEFINER (admin only).
-- =============================================================================

create or replace function public.admin_listings_by_region ()
returns table (region text, count bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin () then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;

  return query
    select l.region, count(*)::bigint
    from public.listings l
    group by l.region
    order by count(*) desc;
end;
$$;
