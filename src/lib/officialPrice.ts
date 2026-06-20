import type { OfficialPrice } from '@/types/database';

/** Une référence est en vigueur si `active` et que la date du jour est dans la fenêtre. */
export function isInForce(p: OfficialPrice, today = new Date()): boolean {
  if (!p.active) return false;
  const d = today.toISOString().slice(0, 10); // YYYY-MM-DD
  if (p.starts_on && d < p.starts_on) return false;
  if (p.ends_on && d > p.ends_on) return false;
  return true;
}

/**
 * Renvoie le prix officiel applicable à un titre d'annonce (1er mot-clé trouvé),
 * parmi les références en vigueur. `null` si aucune ne correspond.
 */
export function matchOfficialPrice(title: string, prices: OfficialPrice[]): OfficialPrice | null {
  if (!title) return null;
  const t = title.toLowerCase();
  return prices.find((p) => isInForce(p) && t.includes(p.keyword.toLowerCase().trim())) ?? null;
}
