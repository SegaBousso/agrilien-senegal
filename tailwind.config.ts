import type { Config } from 'tailwindcss';

/**
 * AgriLien — Système de design « Warm Minimalism »
 * (Organic Biophilic × Modern Minimalism)
 *
 * Stratégie non-destructive : les échelles `gray`, `boxShadow` et la durée de
 * transition par défaut sont redéfinies à la racine. Tout le code existant
 * (gray-*, shadow-sm/md, transition…) hérite automatiquement de la nouvelle
 * direction artistique, sans modifier les pages.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        // ── Tokens sémantiques (variables CSS, light + dark) ──────────────
        // Format canal rgb pour supporter l'opacité Tailwind (bg-surface/60).
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          muted: 'rgb(var(--surface-muted) / <alpha-value>)',
        },
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--surface-muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',

        // ── Marque ────────────────────────────────────────────────────────
        primary: {
          DEFAULT: '#16a34a',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          DEFAULT: '#facc15',
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        },

        // ── Neutres chauds (sable / écru), pilotés par variables CSS ───────
        // L'échelle s'INVERSE en mode sombre (voir .dark dans index.css) : tout
        // l'existant (bg-gray-50, text-gray-900, border-gray-100…) bascule seul.
        gray: {
          50: 'rgb(var(--gray-50) / <alpha-value>)',
          100: 'rgb(var(--gray-100) / <alpha-value>)',
          200: 'rgb(var(--gray-200) / <alpha-value>)',
          300: 'rgb(var(--gray-300) / <alpha-value>)',
          400: 'rgb(var(--gray-400) / <alpha-value>)',
          500: 'rgb(var(--gray-500) / <alpha-value>)',
          600: 'rgb(var(--gray-600) / <alpha-value>)',
          700: 'rgb(var(--gray-700) / <alpha-value>)',
          800: 'rgb(var(--gray-800) / <alpha-value>)',
          900: 'rgb(var(--gray-900) / <alpha-value>)',
          950: 'rgb(var(--gray-950) / <alpha-value>)',
        },
      },

      fontFamily: {
        // Corps : Source Sans 3 (lisible, humaniste). Titres : Lexend.
        sans: ['"Source Sans 3"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Lexend', '"Source Sans 3"', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },

      // ── Ombres douces standardisées (biophilic) — écrase l'échelle ──────
      boxShadow: {
        xs: '0 1px 2px 0 rgb(28 25 23 / 0.04)',
        sm: '0 2px 8px -2px rgb(28 25 23 / 0.06)',
        DEFAULT: '0 4px 14px -4px rgb(28 25 23 / 0.08)',
        md: '0 6px 20px -6px rgb(28 25 23 / 0.10)',
        lg: '0 14px 40px -12px rgb(28 25 23 / 0.12)',
        xl: '0 24px 60px -16px rgb(28 25 23 / 0.14)',
        // Alias explicites
        soft: '0 4px 14px -4px rgb(28 25 23 / 0.08)',
        'soft-lg': '0 14px 40px -12px rgb(28 25 23 / 0.12)',
        focus: '0 0 0 3px rgb(22 163 74 / 0.18)',
        none: 'none',
      },

      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
