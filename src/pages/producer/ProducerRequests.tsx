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
import { formatRelative } from '@/lib/utils';
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{r.listing?.title}</h3>
                      <RequestStatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="font-medium">{r.buyer?.full_name}</span> souhaite{' '}
                      <span className="font-medium">
                        {r.quantity_requested} {r.listing?.unit}
                      </span>{' '}
                      · {formatRelative(r.created_at)}
                    </p>
                    {r.message && (
                      <p className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">“{r.message}”</p>
                    )}
                    {r.buyer?.phone && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary-700">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${r.buyer.phone}`} className="font-medium hover:underline">
                          {r.buyer.phone}
                        </a>
                      </p>
                    )}
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
