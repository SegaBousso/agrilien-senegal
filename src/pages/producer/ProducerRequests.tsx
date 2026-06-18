import { useMemo } from 'react';
import { Check, Phone, X } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { RequestStatusBadge } from '@/components/dashboard/StatusBadge';
import { useMyListings } from '@/hooks/useListings';
import { useReceivedRequests, useUpdateRequestStatus } from '@/hooks/useRequests';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatRelative, initials } from '@/lib/utils';
import type { RequestStatus } from '@/types/database';

export default function ProducerRequests() {
  const { producerId } = useAuth();
  const { data: listings } = useMyListings(producerId);
  const listingIds = useMemo(() => (listings ?? []).map((l) => l.id), [listings]);
  const { data: requests, isLoading } = useReceivedRequests(listingIds);
  const updateStatus = useUpdateRequestStatus();
  const { toast } = useToast();

  const setStatus = async (id: string, status: RequestStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast('Statut de la demande mis à jour.', 'success');
    } catch {
      toast('Mise à jour impossible.', 'error');
    }
  };

  return (
    <>
      <Seo title="Demandes reçues" />
      <PageHeader title="Demandes reçues" description="Gérez les demandes d'achat sur vos annonces." />

      {isLoading ? (
        <Spinner />
      ) : requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardBody>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    {/* Avatar acheteur */}
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 font-display text-sm font-bold text-primary-700">
                      {initials(r.buyer_name ?? r.buyer?.full_name ?? '?')}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{r.buyer_name ?? r.buyer?.full_name}</h3>
                        <RequestStatusBadge status={r.status} />
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        souhaite{' '}
                        <span className="font-medium text-gray-900">
                          {r.quantity_requested} {r.listing?.unit}
                        </span>{' '}
                        de « {r.listing?.title} » · {formatRelative(r.created_at)}
                      </p>
                      {r.message && (
                        <p className="mt-2 rounded-xl border-l-2 border-primary-300 bg-muted px-3 py-2 text-sm italic text-gray-700">
                          {r.message}
                        </p>
                      )}
                      {r.buyer?.phone ? (
                        <a
                          href={`tel:${r.buyer.phone}`}
                          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline"
                        >
                          <Phone className="h-4 w-4" /> {r.buyer.phone}
                        </a>
                      ) : (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-400">
                          <Phone className="h-3.5 w-3.5" /> Coordonnées débloquées après paiement de l'acompte
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {(r.status === 'nouvelle' || r.status === 'en_discussion') && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => setStatus(r.id, 'acceptee')}>
                          <Check className="h-4 w-4" /> Accepter
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setStatus(r.id, 'refusee')}>
                          <X className="h-4 w-4" /> Refuser
                        </Button>
                      </>
                    )}
                    {r.status === 'acceptee' && (
                      <Button size="sm" variant="subtle" onClick={() => setStatus(r.id, 'terminee')}>
                        Marquer terminée
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucune demande pour le moment"
          description="Les demandes d'achat de vos annonces apparaîtront ici."
        />
      )}
    </>
  );
}
