import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import { IntechPaymentModal } from '@/components/payments/IntechPaymentModal';
import { useAuth } from '@/context/AuthContext';

/**
 * Page de test du paiement InTech (cash-in Wave / Orange Money).
 * Nécessite d'être connecté (l'Edge Function vérifie le JWT).
 * À retirer une fois l'intégration validée.
 */
export default function IntechTestPage() {
  const { session } = useAuth();
  const [amount, setAmount] = useState(100);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Seo title="Test paiement InTech" />
      <div className="container max-w-md py-12">
        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-center gap-2 text-primary-700">
              <FlaskConical className="h-5 w-5" />
              <h1 className="font-display text-lg font-bold">Test paiement InTech</h1>
            </div>

            {!session && (
              <p className="rounded-lg bg-accent-100 px-3 py-2 text-sm text-accent-800">
                Connecte-toi d'abord : la fonction serveur vérifie ta session.
              </p>
            )}

            <Field label="Montant (FCFA)" htmlFor="amount" hint="En mode test, l'opérateur peut débiter un petit montant.">
              <Input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </Field>

            <Button onClick={() => setOpen(true)} disabled={!session || amount < 1} className="w-full">
              Lancer un paiement test
            </Button>

            <p className="text-xs text-gray-400">
              Prérequis : secrets <code>INTECH_API_KEY</code> / <code>INTECH_BASE_URL</code> posés et
              migration <code>0010</code> exécutée.
            </p>
          </CardBody>
        </Card>
      </div>

      <IntechPaymentModal open={open} onClose={() => setOpen(false)} amount={amount} />
    </>
  );
}
