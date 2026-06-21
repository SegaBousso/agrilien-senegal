import type { BuyerType, ListingStatus, RequestStatus, ServiceDomain } from '@/types/database';

/** Les 14 régions du Sénégal (fallback si la table regions est indisponible). */
export const SENEGAL_REGIONS = [
  'Dakar',
  'Thiès',
  'Saint-Louis',
  'Diourbel',
  'Louga',
  'Fatick',
  'Kaolack',
  'Kaffrine',
  'Tambacounda',
  'Kédougou',
  'Kolda',
  'Sédhiou',
  'Ziguinchor',
  'Matam',
] as const;

export const UNITS = ['kg', 'tonne', 'sac', 'caisse', 'litre', 'unité', 'botte', 'tête'] as const;

/** Domaines du catalogue de services (l'admin crée les services dans ces familles). */
export const SERVICE_DOMAINS = ['transport', 'mecanisation', 'elevage', 'conseil', 'autre'] as const;

export const SERVICE_DOMAIN_LABELS: Record<ServiceDomain, string> = {
  transport: 'Transport',
  mecanisation: 'Mécanisation',
  elevage: 'Élevage',
  conseil: 'Conseil',
  autre: 'Autre',
};

/** Sous-titre court par domaine, pour les écrans publics. */
export const SERVICE_DOMAIN_TAGLINES: Record<ServiceDomain, string> = {
  transport: 'Acheminement des récoltes et du bétail',
  mecanisation: 'Tracteurs, labour, semis, battage, récolte',
  elevage: 'Soins, alimentation, accompagnement du cheptel',
  conseil: 'Appui technique, agronomie, gestion',
  autre: 'Autres services agricoles',
};

export const DELIVERY_OPTIONS = [
  'Retrait sur place',
  'Livraison locale',
  'Livraison régionale',
  'À négocier',
] as const;

export const BUYER_TYPE_LABELS: Record<BuyerType, string> = {
  particulier: 'Particulier',
  commercant: 'Commerçant',
  restaurant: 'Restaurant',
  entreprise: 'Entreprise',
  cooperative: 'Coopérative',
  institution: 'Institution',
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  brouillon: 'Brouillon',
  en_attente: 'En attente',
  publiee: 'Publiée',
  suspendue: 'Suspendue',
  vendue: 'Vendue',
  expiree: 'Expirée',
};

export const LISTING_STATUS_STYLES: Record<ListingStatus, string> = {
  brouillon: 'bg-gray-100 text-gray-700',
  en_attente: 'bg-accent-100 text-accent-600',
  publiee: 'bg-primary-100 text-primary-700',
  suspendue: 'bg-red-100 text-red-700',
  vendue: 'bg-blue-100 text-blue-700',
  expiree: 'bg-gray-100 text-gray-500',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  nouvelle: 'Nouvelle',
  en_discussion: 'En discussion',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  terminee: 'Terminée',
};

export const REQUEST_STATUS_STYLES: Record<RequestStatus, string> = {
  nouvelle: 'bg-accent-100 text-accent-600',
  en_discussion: 'bg-blue-100 text-blue-700',
  acceptee: 'bg-primary-100 text-primary-700',
  refusee: 'bg-red-100 text-red-700',
  terminee: 'bg-gray-100 text-gray-600',
};

/** Palette de couleurs pour les graphiques (cohérente avec le design system). */
export const CHART_COLORS = {
  primary: '#16a34a', // vert marque
  accent: '#eab308', // jaune (accent-500, contraste suffisant sur blanc)
  blue: '#2563eb',
  earth: '#b5651d', // terre
  sky: '#0ea5e9',
  series: ['#16a34a', '#eab308', '#2563eb', '#b5651d', '#0ea5e9', '#84cc16'],
} as const;

/**
 * Adhésion « Partenaire » (met la fiche prestataire en avant au Carnet).
 * AFFICHAGE uniquement — le montant facturé est fixé côté serveur dans
 * l'Edge Function `membership-initiate` (source de vérité). Garder synchronisé.
 */
export const MEMBERSHIP = {
  price: 10000,
  days: 30,
  priceLabel: '10 000 FCFA',
  periodLabel: 'mois',
} as const;

/** Image de secours quand une annonce n'a pas de photo. */
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#f0fdf4"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#16a34a" text-anchor="middle" dominant-baseline="middle">AgriLien</text></svg>`,
  );
