-- =============================================================================
-- AgriLien Sénégal — Caractéristiques animales (annonces de bétail)
-- Migration 0014 : attributs optionnels propres au bétail, stockés en JSONB
-- pour ne pas alourdir les annonces de produits. Un flag is_livestock sur la
-- catégorie déclenche l'affichage des champs animaux dans le formulaire.
-- Forme du JSON : { race, age, sexe, poids, vaccine }.
-- =============================================================================

alter table public.listings
  add column if not exists attributes jsonb;

alter table public.product_categories
  add column if not exists is_livestock boolean not null default false;

-- Marque les catégories d'élevage ajoutées en 0013.
update public.product_categories
   set is_livestock = true
 where name in ('Moutons', 'Bovins', 'Chèvres', 'Volaille', 'Chevaux & ânes');
