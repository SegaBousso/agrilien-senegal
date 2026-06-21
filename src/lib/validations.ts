import { z } from 'zod';
import { SENEGAL_REGIONS, UNITS } from './constants';

// Mobiles sénégalais : préfixes 70 (Expresso), 75 (Free/Promobile), 76 (Free),
// 77 (Orange), 78 (Orange/Yas). Indicatif +221 / 00221 optionnel.
const phoneRegex = /^(\+221|00221)?\s?(7[05678])\s?\d{3}\s?\d{2}\s?\d{2}$/;

// --- Authentification ---------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
    phone: z
      .string()
      .trim()
      .min(1, 'Téléphone requis')
      .regex(phoneRegex, 'Numéro sénégalais invalide (ex. 77 123 45 67)'),
    password: z.string().min(8, 'Au moins 8 caractères'),
    confirm_password: z.string(),
    role: z.enum(['producer', 'buyer', 'prestataire'], {
      errorMap: () => ({ message: 'Choisissez un type de compte' }),
    }),
    // Champs producteur / prestataire (farm_name = nom du service pour un prestataire)
    farm_name: z.string().optional(),
    region: z.string().optional(),
    // Champs acheteur
    buyer_type: z
      .enum(['particulier', 'commercant', 'restaurant', 'entreprise', 'cooperative', 'institution'])
      .optional(),
    organization_name: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  })
  .refine(
    (data) =>
      !['producer', 'prestataire'].includes(data.role) || (data.farm_name && data.farm_name.length >= 2),
    { message: 'Ce nom est requis', path: ['farm_name'] },
  )
  .refine((data) => !['producer', 'prestataire'].includes(data.role) || !!data.region, {
    message: 'La région est requise',
    path: ['region'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

// --- Annonce ------------------------------------------------------------------
export const listingSchema = z.object({
  title: z.string().min(3, 'Titre trop court').max(120, 'Titre trop long'),
  description: z.string().max(2000, 'Description trop longue').optional().or(z.literal('')),
  category_id: z.string().uuid('Catégorie requise'),
  quantity: z.coerce.number().positive('Quantité positive requise'),
  unit: z.enum(UNITS),
  price: z.coerce.number().nonnegative('Prix invalide'),
  region: z.enum(SENEGAL_REGIONS),
  locality: z.string().max(120).optional().or(z.literal('')),
  availability_date: z.string().optional().or(z.literal('')),
  delivery_option: z.string().optional().or(z.literal('')),
  // Champs bétail (optionnels, affichés seulement pour les catégories d'élevage).
  animal_race: z.string().max(80).optional().or(z.literal('')),
  animal_age: z.string().max(40).optional().or(z.literal('')),
  animal_sexe: z.enum(['male', 'femelle']).optional().or(z.literal('')),
  animal_poids: z.coerce.number().nonnegative('Poids invalide').optional(),
  animal_vaccine: z.boolean().optional(),
});
export type ListingInput = z.infer<typeof listingSchema>;

// --- Demande d'achat ----------------------------------------------------------
export const purchaseRequestSchema = z.object({
  quantity_requested: z.coerce.number().positive('Quantité requise'),
  // Message facultatif : un acheteur qui n'écrit pas peut envoyer sa demande
  // (ou choisir un message tout fait). Le contact se fait ensuite par appel.
  message: z.string().max(1000, 'Message trop long').optional().or(z.literal('')),
});
export type PurchaseRequestInput = z.infer<typeof purchaseRequestSchema>;

// --- Catégorie (admin) --------------------------------------------------------
export const categorySchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  description: z.string().optional().or(z.literal('')),
  icon: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categorySchema>;

// --- Prix officiel (admin) ----------------------------------------------------
export const officialPriceSchema = z.object({
  label: z.string().min(2, 'Libellé requis'),
  keyword: z.string().min(2, 'Mot-clé requis'),
  campaign: z.string().optional().or(z.literal('')),
  price: z.coerce.number().positive('Prix invalide'),
  unit: z.enum(UNITS),
  source: z.string().optional().or(z.literal('')),
  starts_on: z.string().optional().or(z.literal('')),
  ends_on: z.string().optional().or(z.literal('')),
  active: z.boolean().default(true),
});
export type OfficialPriceInput = z.infer<typeof officialPriceSchema>;

// --- Prestataire (Carnet de services) -----------------------------------------
export const serviceProviderSchema = z.object({
  name: z.string().min(2, 'Nom du service requis').max(120, 'Nom trop long'),
  // Services proposés, choisis dans le catalogue géré par l'admin.
  service_ids: z.array(z.string().uuid()).default([]),
  region: z.enum(SENEGAL_REGIONS, {
    errorMap: () => ({ message: 'Région requise' }),
  }),
  commune: z.string().max(120).optional().or(z.literal('')),
  service_areas: z.array(z.enum(SENEGAL_REGIONS)).default([]),
  phone: z
    .string()
    .trim()
    .min(1, 'Téléphone requis')
    .regex(phoneRegex, 'Numéro sénégalais invalide (ex. 77 123 45 67)'),
  whatsapp: z
    .string()
    .trim()
    .regex(phoneRegex, 'Numéro WhatsApp invalide')
    .optional()
    .or(z.literal('')),
  description: z.string().max(1500, 'Description trop longue').optional().or(z.literal('')),
});
export type ServiceProviderInput = z.infer<typeof serviceProviderSchema>;

// --- Service du catalogue (admin) ---------------------------------------------
export const serviceSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(120, 'Nom trop long'),
  domain: z.enum(['transport', 'mecanisation', 'elevage', 'conseil', 'autre'], {
    errorMap: () => ({ message: 'Domaine requis' }),
  }),
  description: z.string().max(500, 'Description trop longue').optional().or(z.literal('')),
  icon: z.string().optional().or(z.literal('')),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

// --- Contact ------------------------------------------------------------------
export const contactSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  subject: z.string().min(3, 'Sujet requis'),
  message: z.string().min(10, 'Message trop court'),
});
export type ContactInput = z.infer<typeof contactSchema>;
