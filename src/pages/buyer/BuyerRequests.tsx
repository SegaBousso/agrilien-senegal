import { Link } from 'react-router-dom';
import { CheckCircle2, CreditCard, Send } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { RequestStatusBadge } from '@/components/dashboard/StatusBadge';
import { useMyRequests } from '@/hooks/useRequests';
import { useInitiatePayment, useMyTransactions } from '@/hooks/usePayment';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice, formatRelative } from '@/lib/utils';
import { computeDeposit } from '@/lib/payments';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

export default function BuyerRequests() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { data: requests, isLoading } = useMyRequests(session?.user.id);
  const { data: transactions } = useMyTransactions(!!session?.user.id);
  const initiate = useInitiatePayment();

  // Demandes déjà payées (transaction au statut « paye »).
  const paidRequestIds = new Set(
    (transactions ?? []).filter((t) => t.status === 'paye').map((t) => t.request_id),
  );

  const handlePay = (requestId: string) => {
    initiate.mutate(requestId, {
      onError: (e) =>
        toast(e instanceof Error ? e.message : 'Paiement impossible pour le moment.', 'error'),
    });
  };

  return (
    <>
      <Seo title="Mes demandes" />
      <PageHeader title="Mes demandes" description="Suivez l'état de vos demandes d'achat." />

      {isLoading ? (
        <Spinner />
      ) : requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((r) => {
            const img =
              r.listing?.images?.find((i) => i.is_main)?.image_url ??
              r.listing?.images?.[0]?.image_url ??
              PLACEHOLDER_IMAGE;
            return (
              <Card key={r.id} className="hover:shadow-md">
                <CardBody className="flex items-center gap-4">
                  <Link to={`/annonce/${r.listing?.id}`} className="shrink-0">
                    <img src={img} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/annonce/${r.listing?.id}`} className="truncate font-semibold text-gray-900 hover:text-primary-700">
                        {r.listing?.title}
                      </Link>
                      <RequestStatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Quantité demandée : {r.quantity_requested} {r.listing?.unit} · {formatRelative(r.created_at)}
                    </p>
                    {r.message && <p className="mt-1 truncate text-xs text-gray-400">“{r.message}”</p>}
                  </div>

                  {/* Acompte de mise en relation (demande acceptée). */}
                  {r.status === 'acceptee' && r.listing && (
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(computeDeposit(r.quantity_requested * r.listing.price))}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        acompte · total {formatPrice(r.quantity_requested * r.listing.price)}
                      </span>
                      {paidRequestIds.has(r.id) ? (
                        <span className="flex items-center gap-1 text-sm font-medium text-primary-700">
                          <CheckCircle2 className="h-4 w-4" /> Commande verrouillée
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePay(r.id)}
                          disabled={initiate.isPending}
                        >
                          <CreditCard className="h-4 w-4" />
                          {initiate.isPending ? 'Redirection…' : 'Verrouiller'}
                        </Button>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Send className="h-12 w-12" />}
          title="Aucune demande envoyée"
          description="Parcourez le catalogue et envoyez une demande d'achat à un producteur."
          action={
            <Link to="/catalogue">
              <Button>Trouver des produits</Button>
            </Link>
          }
        />
      )}
    </>
  );
}
