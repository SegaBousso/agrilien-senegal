import { supabase } from '@/lib/supabase';

/** Statuts InTech (doc get-transaction-status). FAILLED = orthographe doc. */
export type IntechStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILLED'
  | 'REFUNDED'
  | 'CANCELED';

export interface IntechInitResult {
  externalTransactionId: string;
  transactionId: string | null;
  status: IntechStatus;
  /** Lien d'autorisation (carte bancaire) — à ouvrir si présent. */
  authLinkUrl: string | null;
  /** Deep link Wave/Orange Money — à ouvrir si présent. */
  deepLinkUrl: string | null;
  notificationMessage: string | null;
}

export interface IntechInitInput {
  codeService: 'WAVE_SN_API_CASH_IN' | 'ORANGE_SN_API_CASH_IN' | 'FREE_SN_WALLET_CASH_IN' | 'WIZALL_SN_API_CASH_IN';
  amount: number;
  phone: string;
  requestId?: string;
  /** Champ libre renvoyé tel quel dans le callback (doc : champ `data`). */
  data?: Record<string, unknown>;
  /** Champs spécifiques service (ex. sender, successRedirectUrl, useOMQrCode). */
  extra?: Record<string, unknown>;
}

/** Initie une opération InTech (cash-in) via l'Edge Function serveur. */
export async function initiateIntechOperation(input: IntechInitInput): Promise<IntechInitResult> {
  const { data, error } = await supabase.functions.invoke<IntechInitResult>('intech-operation', {
    body: input,
  });
  if (error) throw error;
  if (!data) throw new Error('Réponse InTech invalide.');
  return data;
}

/**
 * Statut d'une opération — lu depuis NOTRE table (mise à jour par le callback),
 * pas depuis l'API InTech (clé serveur + limite 3/min côté InTech).
 */
export async function fetchIntechStatus(externalTransactionId: string): Promise<IntechStatus | null> {
  const { data, error } = await supabase
    .from('intech_transactions')
    .select('status')
    .eq('external_transaction_id', externalTransactionId)
    .maybeSingle();
  if (error) throw error;
  return (data?.status as IntechStatus) ?? null;
}
