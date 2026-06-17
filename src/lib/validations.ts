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
    role: z.enum(['producer', 'buyer'], {
      errorMap: () => ({ message: 'Choisissez un type de compte' }),
    }),
    // Champs producteur
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
  .refine((data) => data.role !== 'producer' || (data.farm_name && data.farm_name.length >= 2), {
    message: "Le nom de l'exploitation est requis",
    path: ['farm_name'],
  })
  .refine((data) => data.role !== 'producer' || !!data.region, {
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
  message: z.string().min(10, 'Message trop court (10 caractères min.)').max(1000),
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

// --- Contact ------------------------------------------------------------------
export const contactSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  subject: z.string().min(3, 'Sujet requis'),
  message: z.string().min(10, 'Message trop court'),
});
export type ContactInput = z.infer<typeof contactSchema>;
