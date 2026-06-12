import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';

/**
 * Page de retour après checkout PayTech (succès ou annulation).
 * Le statut réel de la transaction est confirmé côté serveur par l'IPN ;
 * cette page n'est qu'un accusé visuel pour l'acheteur.
 */
export default function PaymentResultPage({ status }: { status: 'success' | 'cancel' }) {
  const [params] = useSearchParams();
  const ref = params.get('ref');
  const ok = status === 'success';

  return (
    <>
      <Seo title={ok ? 'Paiement confirmé' : 'Paiement annulé'} />
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        {ok ? (
          <CheckCircle2 className="h-16 w-16 text-primary-600" />
        ) : (
          <XCircle className="h-16 w-16 text-amber-500" />
        )}
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          {ok ? 'Merci, votre paiement est confirmé' : 'Paiement annulé'}
        </h1>
        <p className="mt-2 max-w-md text-gray-600">
          {ok
            ? 'Le producteur a été notifié et va préparer votre commande. Vous recevrez une confirmation par SMS.'
            : "Votre paiement n'a pas été finalisé. Vous pouvez réessayer depuis vos demandes."}
        </p>
        {ref && <p className="mt-2 text-xs text-gray-400">Référence : {ref}</p>}
        <div className="mt-6 flex gap-3">
          <Link to="/acheteur/demandes">
            <Button size="lg">Voir mes demandes</Button>
          </Link>
          {!ok && (
            <Link to="/catalogue">
              <Button size="lg" variant="outline">
                Retour au catalogue
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
