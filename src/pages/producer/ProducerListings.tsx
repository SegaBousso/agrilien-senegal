import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ListingStatusBadge } from '@/components/dashboard/StatusBadge';
import { useDeleteListing, useMyListings } from '@/hooks/useListings';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice, formatQuantity } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

export default function ProducerListings() {
  const { producerId } = useAuth();
  const { data: listings, isLoading } = useMyListings(producerId);
  const deleteListing = useDeleteListing();
  const { toast } = useToast();
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteListing.mutateAsync(toDelete.id);
      toast('Annonce supprimée.', 'success');
    } catch {
      toast('Suppression impossible.', 'error');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <Seo title="Mes annonces" />
      <PageHeader
        title="Mes annonces"
        description="Gérez vos publications de récoltes."
        action={
          <Link to="/producteur/annonce/nouvelle">
            <Button>
              <PlusCircle className="h-4 w-4" /> Nouvelle annonce
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : listings && listings.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Quantité</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listings.map((l) => {
                const img =
                  l.images?.find((i) => i.is_main)?.image_url ?? l.images?.[0]?.image_url ?? PLACEHOLDER_IMAGE;
                return (
                  <tr key={l.id} className="transition-colors hover:bg-muted">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={img} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{l.title}</p>
                          <p className="text-xs text-gray-500">{l.region}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                      {formatQuantity(l.quantity, l.unit)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatPrice(l.price)}</td>
                    <td className="px-4 py-3">
                      <ListingStatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/producteur/annonce/${l.id}/modifier`}>
                          <Button variant="ghost" size="icon" aria-label="Modifier">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Supprimer"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => setToDelete({ id: l.id, title: l.title })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Aucune annonce"
          description="Publiez votre première récolte pour commencer à vendre."
          action={
            <Link to="/producteur/annonce/nouvelle">
              <Button>Créer une annonce</Button>
            </Link>
          }
        />
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Supprimer l'annonce ?">
        <p className="text-sm text-gray-600">
          Voulez-vous vraiment supprimer « {toDelete?.title} » ? Cette action est irréversible.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Annuler
          </Button>
          <Button variant="danger" loading={deleteListing.isPending} onClick={confirmDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </>
  );
}
