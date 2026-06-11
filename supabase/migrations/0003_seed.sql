-- =============================================================================
-- AgriLien Sénégal — Données initiales
-- Migration 0003 : régions du Sénégal + catégories de produits
-- =============================================================================

-- Les 14 régions du Sénégal
insert into public.regions (name) values
  ('Dakar'), ('Thiès'), ('Saint-Louis'), ('Diourbel'), ('Louga'),
  ('Fatick'), ('Kaolack'), ('Kaffrine'), ('Tambacounda'), ('Kédougou'),
  ('Kolda'), ('Sédhiou'), ('Ziguinchor'), ('Matam')
on conflict (name) do nothing;

-- Catégories de produits agricoles
insert into public.product_categories (name, description, icon, is_active) values
  ('Céréales', 'Mil, maïs, riz, sorgho, fonio', 'wheat', true),
  ('Fruits', 'Mangues, oranges, bananes, pastèques', 'apple', true),
  ('Légumes', 'Tomates, oignons, carottes, choux', 'carrot', true),
  ('Légumineuses', 'Niébé, arachide, haricots', 'bean', true),
  ('Tubercules', 'Manioc, patate douce, igname', 'sprout', true),
  ('Élevage', 'Volaille, bétail, produits laitiers', 'beef', true),
  ('Produits halieutiques', 'Poissons frais et séchés', 'fish', true),
  ('Produits transformés', 'Confitures, jus, céréales transformées', 'package', true)
on conflict (name) do nothing;
