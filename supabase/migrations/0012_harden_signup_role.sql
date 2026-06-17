-- =============================================================================
-- AgriLien Sénégal — Durcissement de l'inscription
-- Migration 0012 : handle_new_user acceptait n'importe quel `role` envoyé dans
-- les métadonnées de signup (raw_user_meta_data->>'role'), permettant à un
-- utilisateur de se créer directement en 'admin' via l'API publique auth.signUp.
-- On restreint le rôle auto-attribué à 'producer' | 'buyer' (tout le reste ->
-- 'buyer'). La promotion 'admin' ne peut donc se faire que côté serveur/SQL.
-- (Complète 0005 qui protégeait déjà les UPDATE du rôle.)
-- =============================================================================

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
      when new.raw_user_meta_data ->> 'role' in ('producer', 'buyer')
        then (new.raw_user_meta_data ->> 'role')::user_role
      else 'buyer'
    end
  );
  return new;
end;
$$;
