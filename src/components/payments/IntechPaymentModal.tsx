import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, Smartphone, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { useInitiateIntech, useIntechStatus } from '@/hooks/useIntech';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/utils';
import type { IntechInitInput } from '@/services/intech.service';

/** Opérateurs cash-in autorisés côté client (cf. ALLOWED_CLIENT_SERVICES). */
const OPERATORS: { label: string; code: IntechInitInput['codeService'] }[] = [
  { label: 'Wave', code: 'WAVE_SN_API_CASH_IN' },
  { label: 'Orange Money', code: 'ORANGE_SN_API_CASH_IN' },
  { label: 'Free Money', code: 'FREE_SN_WALLET_CASH_IN' },
  { label: 'Wizall', code: 'WIZALL_SN_API_CASH_IN' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  amount: number;
  requestId?: string;
  defaultPhone?: string;
  onSuccess?: () => void;
}

export function IntechPaymentModal({ open, onClose, amount, requestId, defaultPhone, onSuccess }: Props) {
  const { toast } = useToast();
  const [code, setCode] = useState<IntechInitInput['codeService']>('WAVE_SN_API_CASH_IN');
  const [phone, setPhone] = useState(defaultPhone ?? '');
  const [externalId, setExternalId] = useState<string>();

  const initiate = useInitiateIntech();
  const { data: status } = useIntechStatus(externalId);

  // Notifie le parent une fois (et une seule) le paiement confirmé.
  useEffect(() => {
    if (status === 'SUCCESS') onSuccess?.();
  }, [status, onSuccess]);

  const handlePay = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      toast('Numéro invalide (format 77xxxxxxx).', 'error');
      return;
    }
    initiate.mutate(
      {
        codeService: code,
        amount,
        phone: cleanPhone,
        requestId,
        // Champs spécifiques Wave/OM (deep link, QR Orange Money).
        extra: { sender: 'AgriLien', useOMQrCode: true },
      },
      {
        onSuccess: (res) => {
          setExternalId(res.externalTransactionId);
          // Ouvre le lien opérateur si fourni (deep link Wave/OM ou page carte).
          const link = res.deepLinkUrl ?? res.authLinkUrl;
          if (link) window.open(link, '_blank', 'noopener');
        },
        onError: (e) =>
          toast(e instanceof Error ? e.message : 'Paiement impossible pour le moment.', 'error'),
      },
    );
  };

  const terminal = status === 'SUCCESS' || status === 'FAILLED' || status === 'CANCELED';

  return (
    <Modal open={open} onClose={onClose} title="Payer par mobile money">
      {/* État : paiement initié -> suivi du statut */}
      {externalId ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          {status === 'SUCCESS' ? (
            <CheckCircle2 className="h-14 w-14 text-primary-600" />
          ) : status === 'FAILLED' || status === 'CANCELED' ? (
            <XCircle className="h-14 w-14 text-red-500" />
          ) : (
            <Loader2 className="h-14 w-14 animate-spin text-primary-500" />
          )}
          <p className="font-semibold text-gray-900">
            {status === 'SUCCESS'
              ? 'Paiement confirmé 🎉'
              : status === 'FAILLED'
                ? 'Paiement échoué'
                : status === 'CANCELED'
                  ? 'Paiement annulé'
                  : 'Paiement en cours…'}
          </p>
          {!terminal && (
            <p className="max-w-xs text-sm text-gray-500">
              Validez le paiement sur votre téléphone (Wave / Orange Money). Le statut se met à
              jour automatiquement ici.
            </p>
          )}
          <Button variant={terminal ? 'primary' : 'outline'} onClick={onClose} className="mt-2">
            {terminal ? 'Fermer' : 'Continuer en arrière-plan'}
          </Button>
        </div>
      ) : (
        /* État : formulaire */
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
            <span className="text-sm text-gray-600">Montant à payer</span>
            <span className="font-display text-lg font-bold text-gray-900">{formatPrice(amount)}</span>
          </div>

          <Field label="Opérateur" htmlFor="intech-op">
            <Select
              id="intech-op"
              value={code}
              onChange={(e) => setCode(e.target.value as IntechInitInput['codeService'])}
            >
              {OPERATORS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Numéro mobile money" htmlFor="intech-phone" hint="Format : 77 123 45 67">
            <div className="relative">
              <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="intech-phone"
                type="tel"
                inputMode="numeric"
                placeholder="770000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9"
              />
            </div>
          </Field>

          <Button onClick={handlePay} disabled={initiate.isPending} className="w-full">
            {initiate.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Initialisation…
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" /> Payer {formatPrice(amount)}
              </>
            )}
          </Button>
          <p className="text-center text-xs text-gray-400">
            Vous serez redirigé vers votre application mobile money pour valider.
          </p>
        </div>
      )}
    </Modal>
  );
}
