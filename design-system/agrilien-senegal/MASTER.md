# AgriLien Sénégal — Design System (Source of Truth)

> **LOGIC:** When building a specific page, first check `design-system/agrilien-senegal/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file. Otherwise, follow the rules below.

> **Direction : « Warm Minimalism »** — Organic Biophilic × Modern Minimalism.
> Chaleur dans la **matière** (couleurs écrues, ombres douces), rigueur dans la
> **forme** (géométrie nette, beaucoup d'air, bordures discrètes, zéro décoration).
> Cette fondation est **appliquée** dans `tailwind.config.ts`, `src/index.css` et
> les primitives `src/components/ui/`.

---

## 1. Principe d'implémentation (NON-DESTRUCTIF)

Les échelles racines de Tailwind sont **redéfinies** pour que tout le code existant
hérite de la direction sans réécrire les pages :

- `gray-*` → échelle **neutre chaude (sable/écru)**.
- `boxShadow` (`sm/md/lg…`) → **ombres douces**.
- `transitionDuration.DEFAULT` → **200ms**.
- `h1–h4` → **Lexend** via `@layer base`.

➡️ **Préférer les classes existantes** (`bg-gray-50`, `text-gray-900`, `shadow-sm`,
`transition`) : elles sont déjà « warm ». Pour le nouveau code dark-ready, utiliser
les **tokens sémantiques** ci-dessous.

## 2. Couleurs

### Marque
| Rôle | Hex | Classe |
|---|---|---|
| Primaire (vert) | `#16a34a` | `primary-600` / `bg-primary-*` |
| Accent (jaune) | `#facc15` | `accent-400` |

### Neutres chauds (écrase `gray`)
`50 #faf8f3` · `100 #f2efe8` · `200 #e7e2d7` · `300 #d5cec0` · `400 #ada496` ·
`500 #7c7466` · `600 #5c5547` · `700 #443f34` · `800 #2c2820` · `900 #1e1a14`

### Tokens sémantiques (variables CSS — light + dark, dark-ready)
| Token | Classe Tailwind | Usage |
|---|---|---|
| `--background` `#FAF8F3` | `bg-background` | Fond global écru |
| `--surface` `#FFFFFF` | `bg-surface` | Cartes / surfaces qui flottent |
| `--surface-muted` `#F2EFE8` | `bg-surface-muted` / `bg-muted` | Zones secondaires |
| `--foreground` `#1E1A14` | `text-foreground` | Texte principal |
| `--muted-foreground` `#5C5547` | `text-muted-foreground` | Texte secondaire |
| `--border` `#E7E2D7` | `border-border` | Bordures subtiles |
| `--ring` `#16a34a` | `ring-ring` | Anneau de focus |

## 3. Typographie

- **Titres** : `Lexend` → `font-display` (auto sur `h1–h4`). Conçue pour la lisibilité.
- **Corps** : `Source Sans 3` → `font-sans` (défaut).
- Chargées via `<link>` Google Fonts dans `index.html`.
- Échelle : 12 · 14 · 16(base) · 18 · 24 · 32. `line-height` corps 1.5–1.75. `tracking-tight` sur titres.

## 4. Fondations visuelles

| Élément | Valeur | Classe |
|---|---|---|
| Ombre contenu | `0 4px 14px -4px rgb(28 25 23 / .08)` | `shadow-soft` / `shadow-sm` |
| Ombre survol/élevée | `0 14px 40px -12px rgb(28 25 23 / .12)` | `shadow-soft-lg` / `shadow-lg` |
| Rayon carte | 20px | `rounded-2xl` |
| Rayon bouton/champ | 14px | `rounded-xl` |
| Transition | 200ms `ease-out` | `transition` (défaut) |
| Press tactile | `scale 0.98` | (intégré au `Button`) |
| Anim. entrée | `fade-in` / `fade-up` | `animate-fade-up` |

## 5. Espacement

- Container : padding `1rem` (mobile) → `1.5rem` (sm) → `2rem` (lg), max-width 1280px.
- Respiration généreuse : sections `py-16`, cartes `p-6`, grilles `gap-6`.
- Rythme vertical 4/8px. Conteneurs dashboards épurés, prêts pour graphiques sur-mesure.

## 6. Iconographie

- **Lucide React uniquement.** Jamais d'emoji comme icône structurelle.
- Tailles cohérentes : `h-4 w-4` (inline), `h-5 w-5` (boutons), `h-6 w-6` (cartes).

## 7. Composants primitifs (`src/components/ui/`)

- **Button** : variants `primary | accent | outline | ghost | danger | subtle`, ombre douce sur actions pleines, `active:scale-[0.98]`, focus `ring-ring`.
- **Card** : `rounded-2xl border-border bg-surface shadow-soft` (dark-ready).
- **Input / Textarea / Select** : `border-border bg-surface`, focus vert, transition 200ms. Toujours via `<Field>` (label + erreur accessible).
- **Dashboard** : `PageHeader`, `StatCard` (carte stat avec icône + accent), `StatusBadge`.

## 8. Accessibilité (obligatoire)

- Contraste texte ≥ 4.5:1 (vérifié sur la palette chaude).
- Focus visible `ring-2 ring-ring`. `prefers-reduced-motion` respecté.
- Pas d'info par la couleur seule (icône + texte). Labels sur tous les champs.
- Cibles tactiles ≥ 44px. Responsive 375 / 768 / 1024 / 1440.

## 9. À éviter

Gris froids (slate) · ombres dures/sombres · coins vifs incohérents · emojis-icônes ·
décorations superflues · dégradés AI violet/rose · neutres figés (`bg-white`) dans le
nouveau code destiné au dark mode (préférer `bg-surface`).

---

### Dark mode — IMPLÉMENTÉ ✅
- Toggle clair/sombre dans la navbar ([ThemeToggle](../../src/components/layout/ThemeToggle.tsx)),
  géré par [ThemeContext](../../src/context/ThemeContext.tsx) : préférence système par défaut,
  persistance `localStorage` (`agrilien-theme`), classe `dark` sur `<html>`, anti-FOUC via script inline `index.html`.
- **Mécanisme clé** : l'échelle `gray` est pilotée par variables CSS `--gray-50…950` qui
  **s'inversent** dans `.dark` (gray-50→foncé, gray-900→clair). Tout l'existant (`bg-gray-50`,
  `text-gray-900`, `border-gray-100`) bascule automatiquement, sans édition de page.
- `bg-white` autonome a été remplacé par `bg-surface` (flip). Les `bg-white/opacity`
  (hero, overlays sur images) restent volontairement blancs dans les deux modes.
- Règle pour le nouveau code : utiliser `bg-surface`/`text-foreground`/`border-border`
  ou les `gray-*` (qui flippent). Éviter `bg-white` autonome.
