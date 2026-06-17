/**
 * Modèle d'acompte de mise en relation.
 * L'acheteur paie un acompte (pas le total) pour verrouiller la commande ;
 * le reste se règle en direct à la livraison. Le calcul fait FOI côté serveur
 * (Edge Function payment-initiate) — cette copie sert à l'affichage front.
 * Garde les deux en cohérence si tu changes les paramètres.
 */
export const DEPOSIT_RATE = 0.1; // 10 % du total
export const DEPOSIT_MIN = 1000; // plancher (FCFA)
export const DEPOSIT_MAX = 15000; // plafond (FCFA)

/** Acompte = total × taux, borné [MIN, MAX], jamais supérieur au total. */
export function computeDeposit(total: number): number {
  const raw = Math.round(total * DEPOSIT_RATE);
  const clamped = Math.max(DEPOSIT_MIN, Math.min(raw, DEPOSIT_MAX));
  return Math.min(clamped, Math.round(total));
}
