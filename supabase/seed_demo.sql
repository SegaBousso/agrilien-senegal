-- =============================================================================
-- AgriLien Sénégal — Jeu de données de DÉMO (optionnel, dev/test uniquement)
-- À exécuter dans le SQL Editor de Supabase APRÈS les 4 migrations.
-- Idempotent : ré-exécutable sans erreur (on conflict do nothing).
--
-- Comptes créés (mot de passe commun : Demo1234!) :
--   • producteur1@demo.agrilien.sn   (producteur — Awa Diop)
--   • producteur2@demo.agrilien.sn   (producteur — Modou Sarr)
--   • acheteur@demo.agrilien.sn      (acheteur   — Fatou Ndiaye)
--   • admin@demo.agrilien.sn         (admin)
--
-- ⚠️ Données fictives. Pour tout supprimer : voir le bloc « NETTOYAGE » en bas.
-- =============================================================================

-- 1) Comptes d'authentification ------------------------------------------------
-- Le trigger handle_new_user crée automatiquement public.profiles (nom, rôle…).
do $$
declare
  pwd text := crypt('Demo1234!', gen_salt('bf'));
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    ('00000000-0000-0000-0000-000000000000', 'a0000001-0000-4000-8000-000000000001',
     'authenticated', 'authenticated', 'producteur1@demo.agrilien.sn', pwd, now(),
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Awa Diop","phone":"77 123 45 67","role":"producer"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', 'a0000002-0000-4000-8000-000000000002',
     'authenticated', 'authenticated', 'producteur2@demo.agrilien.sn', pwd, now(),
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Modou Sarr","phone":"76 987 65 43","role":"producer"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', 'b0000001-0000-4000-8000-000000000003',
     'authenticated', 'authenticated', 'acheteur@demo.agrilien.sn', pwd, now(),
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Fatou Ndiaye","phone":"70 111 22 33","role":"buyer"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', 'c0000001-0000-4000-8000-000000000004',
     'authenticated', 'authenticated', 'admin@demo.agrilien.sn', pwd, now(),
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"Administrateur Démo","role":"admin"}', now(), now())
  on conflict (id) do nothing;
end $$;

-- Identités email (nécessaire pour la connexion sur Supabase récent).
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), 'a0000001-0000-4000-8000-000000000001',
   '{"sub":"a0000001-0000-4000-8000-000000000001","email":"producteur1@demo.agrilien.sn"}',
   'email', 'producteur1@demo.agrilien.sn', now(), now(), now()),
  (gen_random_uuid(), 'a0000002-0000-4000-8000-000000000002',
   '{"sub":"a0000002-0000-4000-8000-000000000002","email":"producteur2@demo.agrilien.sn"}',
   'email', 'producteur2@demo.agrilien.sn', now(), now(), now()),
  (gen_random_uuid(), 'b0000001-0000-4000-8000-000000000003',
   '{"sub":"b0000001-0000-4000-8000-000000000003","email":"acheteur@demo.agrilien.sn"}',
   'email', 'acheteur@demo.agrilien.sn', now(), now(), now()),
  (gen_random_uuid(), 'c0000001-0000-4000-8000-000000000004',
   '{"sub":"c0000001-0000-4000-8000-000000000004","email":"admin@demo.agrilien.sn"}',
   'email', 'admin@demo.agrilien.sn', now(), now(), now())
on conflict do nothing;

-- S'assure que le rôle admin est bien positionné (au cas où le trigger ait varié).
update public.profiles set role = 'admin' where email = 'admin@demo.agrilien.sn';

-- 2) Profils producteur --------------------------------------------------------
insert into public.producer_profiles (id, user_id, farm_name, region, commune, description)
values
  ('d0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
   'Ferme des Niayes', 'Dakar', 'Keur Massar',
   'Exploitation maraîchère familiale spécialisée dans les fruits et légumes frais de la zone des Niayes.'),
  ('d0000002-0000-4000-8000-000000000002', 'a0000002-0000-4000-8000-000000000002',
   'Exploitation du Saloum', 'Kaolack', 'Ndoffane',
   'Céréales, arachide et oignons cultivés dans le bassin arachidier.')
on conflict (id) do nothing;

-- 3) Profil acheteur -----------------------------------------------------------
insert into public.buyer_profiles (user_id, buyer_type, organization_name, region)
values ('b0000001-0000-4000-8000-000000000003', 'restaurant', 'Restaurant Teranga', 'Dakar')
on conflict (user_id) do nothing;

-- 4) Annonces + images ---------------------------------------------------------
-- Le garde-fou enforce_listing_status bloque l'insertion d'annonces 'publiee'
-- hors session admin : on le désactive le temps du seed, puis on le réactive.
alter table public.listings disable trigger listings_status_guard;

insert into public.listings (id, producer_id, category_id, title, description, quantity, unit, price, region, locality, availability_date, delivery_option, status)
values
  ('e0000001-0000-4000-8000-000000000001', 'd0000001-0000-4000-8000-000000000001',
   (select id from public.product_categories where name = 'Fruits' limit 1),
   'Mangues Kent fraîches', 'Mangues Kent juteuses, calibre export, récoltées à maturité. Idéales pour la vente au détail ou la transformation.',
   500, 'kg', 600, 'Dakar', 'Keur Massar', current_date + 5, 'Livraison régionale', 'publiee'),
  ('e0000002-0000-4000-8000-000000000002', 'd0000001-0000-4000-8000-000000000001',
   (select id from public.product_categories where name = 'Légumes' limit 1),
   'Tomates fraîches de saison', 'Tomates fermes et savoureuses, parfaites pour la restauration. Disponibilité immédiate.',
   300, 'kg', 450, 'Dakar', 'Sangalkam', current_date + 2, 'Retrait sur place', 'publiee'),
  ('e0000003-0000-4000-8000-000000000003', 'd0000002-0000-4000-8000-000000000002',
   (select id from public.product_categories where name = 'Légumes' limit 1),
   'Oignons locaux', 'Oignons violets de Galmi, bien conservés, vendus au sac de 25 kg.',
   2000, 'kg', 350, 'Kaolack', 'Ndoffane', current_date + 1, 'Livraison régionale', 'publiee'),
  ('e0000004-0000-4000-8000-000000000004', 'd0000002-0000-4000-8000-000000000002',
   (select id from public.product_categories where name = 'Céréales' limit 1),
   'Mil souna de qualité', 'Mil souna propre et bien séché, récolte de la saison. Sacs de 50 kg disponibles.',
   1500, 'kg', 300, 'Kaolack', 'Ndoffane', current_date + 7, 'À négocier', 'publiee'),
  ('e0000005-0000-4000-8000-000000000005', 'd0000001-0000-4000-8000-000000000001',
   (select id from public.product_categories where name = 'Fruits' limit 1),
   'Pastèques sucrées', 'Pastèques de grande taille, chair rouge et sucrée. Vente en gros.',
   800, 'unité', 1000, 'Thiès', 'Pout', current_date + 3, 'Livraison locale', 'publiee'),
  ('e0000006-0000-4000-8000-000000000006', 'd0000002-0000-4000-8000-000000000002',
   (select id from public.product_categories where name = 'Légumineuses' limit 1),
   'Arachide en coque', 'Arachide de qualité supérieure, bien triée, idéale pour huilerie ou bouche.',
   3000, 'kg', 500, 'Kaolack', 'Ndoffane', current_date + 10, 'À négocier', 'publiee'),
  ('e0000007-0000-4000-8000-000000000007', 'd0000002-0000-4000-8000-000000000002',
   (select id from public.product_categories where name = 'Céréales' limit 1),
   'Riz de la vallée', 'Riz blanc local de la vallée du fleuve, propre et bien usiné.',
   2500, 'kg', 400, 'Saint-Louis', 'Ross Béthio', current_date + 4, 'Livraison régionale', 'publiee'),
  ('e0000008-0000-4000-8000-000000000008', 'd0000001-0000-4000-8000-000000000001',
   (select id from public.product_categories where name = 'Légumes' limit 1),
   'Carottes fraîches', 'Carottes croquantes des Niayes, lavées et calibrées.',
   400, 'kg', 500, 'Dakar', 'Keur Massar', current_date + 6, 'Retrait sur place', 'en_attente'),
  ('e0000009-0000-4000-8000-000000000009', 'd0000002-0000-4000-8000-000000000002',
   (select id from public.product_categories where name = 'Élevage' limit 1),
   'Œufs de ferme', 'Œufs frais de poules élevées au sol, plateaux de 30.',
   200, 'caisse', 2500, 'Kaolack', 'Kahone', current_date + 1, 'Livraison locale', 'en_attente')
on conflict (id) do nothing;

alter table public.listings enable trigger listings_status_guard;

-- Images principales (photos libres Unsplash)
insert into public.listing_images (listing_id, image_url, is_main)
values
  ('e0000001-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80', true),
  ('e0000002-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80', true),
  ('e0000003-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80', true),
  ('e0000004-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80', true),
  ('e0000005-0000-4000-8000-000000000005', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80', true),
  ('e0000006-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?w=800&q=80', true),
  ('e0000007-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80', true),
  ('e0000008-0000-4000-8000-000000000008', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&q=80', true),
  ('e0000009-0000-4000-8000-000000000009', 'https://images.unsplash.com/photo-1569288063643-5d29ad64df09?w=800&q=80', true)
on conflict do nothing;

-- 5) Demandes d'achat (de l'acheteur démo) -------------------------------------
insert into public.purchase_requests (id, listing_id, buyer_id, quantity_requested, message, status)
values
  ('f0000001-0000-4000-8000-000000000001', 'e0000001-0000-4000-8000-000000000001',
   'b0000001-0000-4000-8000-000000000003', 100,
   'Bonjour, je souhaite 100 kg de mangues pour mon restaurant. Possible cette semaine ?', 'nouvelle'),
  ('f0000002-0000-4000-8000-000000000002', 'e0000003-0000-4000-8000-000000000003',
   'b0000001-0000-4000-8000-000000000003', 200,
   'Intéressée par 200 kg d''oignons. Quel est votre meilleur prix au sac ?', 'en_discussion')
on conflict (id) do nothing;

-- 6) Favoris (de l'acheteur démo) ----------------------------------------------
insert into public.favorites (user_id, listing_id)
values
  ('b0000001-0000-4000-8000-000000000003', 'e0000002-0000-4000-8000-000000000002'),
  ('b0000001-0000-4000-8000-000000000003', 'e0000005-0000-4000-8000-000000000005')
on conflict (user_id, listing_id) do nothing;

-- =============================================================================
-- ✅ Terminé. 7 annonces publiées (catalogue), 2 en attente (modération admin),
--    2 demandes et 2 favoris pour l'acheteur démo.
--
-- 🔑 Connexion démo (Authentication doit autoriser email/password) :
--    producteur1@demo.agrilien.sn · acheteur@demo.agrilien.sn ·
--    admin@demo.agrilien.sn  — mot de passe : Demo1234!
-- =============================================================================

-- -----------------------------------------------------------------------------
-- NETTOYAGE (décommentez et exécutez pour TOUT supprimer)
-- La suppression des comptes auth.users supprime en cascade profils, annonces,
-- images, demandes et favoris liés.
-- -----------------------------------------------------------------------------
-- delete from auth.users where email in (
--   'producteur1@demo.agrilien.sn', 'producteur2@demo.agrilien.sn',
--   'acheteur@demo.agrilien.sn', 'admin@demo.agrilien.sn'
-- );
