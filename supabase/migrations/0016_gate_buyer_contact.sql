-- =============================================================================
-- AgriLien Sénégal — Gating du contact acheteur derrière l'acompte
-- Migration 0016 : cohérence avec le modèle d'acompte. Le producteur voyait le
-- TÉLÉPHONE/EMAIL de l'acheteur dès la demande -> il pouvait conclure hors
-- plateforme sans payer (perte de revenu). Désormais :
--   - le NOM de l'acheteur reste visible (dénormalisé sur la demande) pour
--     décider d'accepter/refuser ;
--   - le PROFIL (téléphone/email) n'est lisible par le producteur qu'APRÈS un
--     paiement d'acompte confirmé (transaction 'paye').
-- =============================================================================

-- 1. Nom de l'acheteur dénormalisé sur la demande (non sensible, toujours visible).
alter table public.purchase_requests
  add column if not exists buyer_name text;

update public.purchase_requests pr
   set buyer_name = p.full_name
  from public.profiles p
 where p.id = pr.buyer_id
   and pr.buyer_name is null;

create or replace function public.set_request_buyer_name ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.buyer_name is null then
    select full_name into new.buyer_name from public.profiles where id = new.buyer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists requests_set_buyer_name on public.purchase_requests;
create trigger requests_set_buyer_name
  before insert on public.purchase_requests
  for each row execute function public.set_request_buyer_name ();

-- 2. RLS : le producteur ne lit le profil (téléphone/email) de l'acheteur
--    qu'APRÈS un paiement d'acompte confirmé. Remplace la clause de 0005 qui
--    l'autorisait dès qu'une demande existait.
drop policy if exists "Lecture des profils (restreinte)" on public.profiles;
create policy "Lecture des profils (restreinte)"
  on public.profiles for select using (
    auth.uid () = id
    or public.is_admin ()
    or exists (
      select 1 from public.producer_profiles pp where pp.user_id = profiles.id
    )
    or exists (
      select 1
      from public.transactions t
      join public.purchase_requests r on r.id = t.request_id
      join public.listings l on l.id = r.listing_id
      where r.buyer_id = profiles.id
        and l.producer_id = public.current_producer_id ()
        and t.status = 'paye'
    )
  );
