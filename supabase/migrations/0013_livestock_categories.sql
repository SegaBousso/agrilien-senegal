-- =============================================================================
-- AgriLien Sénégal — Vente de bétail (élevage)
-- Migration 0013 : catégories d'animaux dédiées. Les éleveurs publient des
-- annonces de bétail exactement comme les maraîchers (réutilise tout l'existant :
-- annonces, demandes, acompte, SMS). Le bétail se vend « à la tête » (cf. unité
-- 'tête' ajoutée côté front).
-- =============================================================================

insert into public.product_categories (name, description, icon, is_active) values
  ('Moutons', 'Ovins : Ladoum, Bali-Bali, Touabire. Forte demande pour la Tabaski.', 'beef', true),
  ('Bovins', 'Bœufs, vaches, taureaux, zébus.', 'beef', true),
  ('Chèvres', 'Caprins : chèvres et boucs.', 'beef', true),
  ('Volaille', 'Poulets, pintades, canards, dindes, œufs.', 'bird', true),
  ('Chevaux & ânes', 'Équins et asins de trait et de transport.', 'beef', true)
on conflict (name) do nothing;
