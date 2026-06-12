import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { RequestStatusBadge } from '@/components/dashboard/StatusBadge';
import { useMyRequests } from '@/hooks/useRequests';
import { useAuth } from '@/context/AuthContext';
import { formatRelative } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

export default function BuyerRequests() {
  const { session } = useAuth();
  const { data: requests, isLoading } = useMyRequests(session?.user.id);

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
