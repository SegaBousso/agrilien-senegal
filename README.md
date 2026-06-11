# 🌱 AgriLien Sénégal

Plateforme web qui connecte les **producteurs agricoles** sénégalais aux **acheteurs**
(particuliers, commerçants, restaurants, entreprises, coopératives, institutions).

Les producteurs publient leurs récoltes (photos, quantité, prix, région) ; les acheteurs
recherchent, filtrent, mettent en favoris et envoient des demandes d'achat. Un espace
d'administration permet de modérer les annonces, gérer les utilisateurs et les catégories.

---

## 🧱 Stack technique

| Domaine | Technologie |
|---|---|
| Frontend | React 18 + TypeScript (strict), Vite |
| Styling | Tailwind CSS (vert `#16a34a` / jaune `#facc15`) |
| Routing | React Router v6 |
| Formulaires | React Hook Form + Zod |
| Data fetching | TanStack Query |
| UI | Composants maison style shadcn/ui + Lucide React |
| Backend / DB / Storage / Auth | Supabase (PostgreSQL + RLS) |
| Hébergement | Vercel (frontend) + Supabase (backend) |

---

## 🚀 Démarrage rapide

### 1. Prérequis
- Node.js ≥ 18
- Un projet [Supabase](https://app.supabase.com)

### 2. Installation

```bash
npm install
cp .env.example .env.local
```

Renseignez `.env.local` avec les clés de votre projet Supabase
(**Settings → API**) :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
VITE_SUPABASE_STORAGE_BUCKET=listing-images
```

### 3. Base de données

Dans le **SQL Editor** de Supabase, exécutez dans l'ordre les migrations du dossier
[`supabase/migrations/`](supabase/migrations/) :

1. `0001_schema.sql` — enums, tables, index, triggers
2. `0002_rls.sql` — Row Level Security + helpers
3. `0003_seed.sql` — 14 régions du Sénégal + catégories
4. `0004_storage.sql` — bucket public `listing-images` + politiques

> Le trigger `handle_new_user` crée automatiquement un profil dans `public.profiles`
> à chaque inscription, en lisant `full_name`, `phone` et `role` depuis les métadonnées.

**Vérifier l'installation** : exécutez [`supabase/verify.sql`](supabase/verify.sql) (lecture seule) —
tout doit afficher `✅ OK`.

**Données de démo (optionnel)** : exécutez [`supabase/seed_demo.sql`](supabase/seed_demo.sql) pour
peupler l'app sans saisie manuelle — 4 comptes (mot de passe `Demo1234!`), 9 annonces avec photos,
demandes et favoris. Le bloc « NETTOYAGE » en fin de fichier permet de tout supprimer.

### 4. Lancer en local

```bash
npm run dev
```

L'application démarre sur http://localhost:5173

---

## 👤 Rôles & comptes

| Rôle | Accès |
|---|---|
| **Visiteur** | Accueil, catalogue, détail d'annonce, inscription |
| **Producteur** | Profil, CRUD annonces (+ photos), demandes reçues |
| **Acheteur** | Profil, recherche, favoris, demandes d'achat |
| **Administrateur** | Modération annonces, gestion utilisateurs/catégories, statistiques |

### Créer un administrateur

L'inscription ne crée que des comptes `producer` ou `buyer`. Pour promouvoir un compte en
admin, exécutez dans le SQL Editor :

```sql
update public.profiles set role = 'admin' where email = 'admin@exemple.com';
```

---

## 🔐 Sécurité (RLS)

Les politiques Row Level Security garantissent côté serveur que :

- un producteur ne modifie que **ses** annonces et voit les demandes sur **ses** annonces ;
- un acheteur ne voit que **ses** favoris et **ses** demandes ;
- les annonces `publiee` sont visibles par tous ;
- seul un **admin** peut faire passer une annonce en `publiee` ou `suspendue`
  (garde-fou via le trigger `enforce_listing_status`) ;
- seul un **admin** accède à la gestion globale.

La validation est faite **côté client** (Zod + React Hook Form) **et côté serveur**
(contraintes SQL + RLS).

---

## 📁 Architecture

```
src/
├── components/      # UI réutilisable
│   ├── ui/          # Primitives (Button, Input, Card, Modal, États…)
│   ├── layout/      # Navbar, Footer, Logo, layouts public & dashboard
│   ├── listings/    # ListingCard
│   ├── dashboard/   # PageHeader, StatCard, StatusBadge
│   └── auth/        # ProtectedRoute
├── context/         # AuthContext, ToastContext
├── hooks/           # useListings, useCatalog, useFavorites, useRequests, useAdmin
├── lib/             # supabase, utils, constants, validations (Zod)
├── pages/           # Pages par espace (public, auth, producer, buyer, admin)
├── services/        # Accès données Supabase (couche métier)
└── types/           # Types de la base de données
```

---

## 📜 Scripts

```bash
npm run dev        # serveur de développement
npm run build      # build production (tsc -b && vite build)
npm run preview    # prévisualiser le build
npm run lint       # ESLint
npm run typecheck  # vérification des types
npm run format     # Prettier
```

---

## ☁️ Déploiement sur Vercel

1. Importez le dépôt sur [Vercel](https://vercel.com).
2. Framework détecté : **Vite** (config dans [`vercel.json`](vercel.json), avec rewrite SPA).
3. Ajoutez les variables d'environnement `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   et `VITE_SUPABASE_STORAGE_BUCKET`.
4. Déployez. 🎉

---

## 🗺️ Routes principales

| Route | Description | Accès |
|---|---|---|
| `/` | Accueil | Public |
| `/catalogue` | Catalogue + filtres | Public |
| `/annonce/:id` | Détail d'annonce | Public |
| `/inscription` `/connexion` | Auth | Public |
| `/producteur/*` | Espace producteur | `producer` |
| `/acheteur/*` | Espace acheteur | `buyer` |
| `/admin/*` | Administration | `admin` |

---

## 🛣️ Évolutions prévues (V2 / V3)

Paiement Orange Money / Wave · messagerie temps réel · notation des producteurs ·
suivi logistique · application mobile · recommandation de prix par IA.

---

Conçu pour l'agriculture sénégalaise. 🇸🇳
