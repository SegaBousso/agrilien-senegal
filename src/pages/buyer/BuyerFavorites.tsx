import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { EmptyState, ListingCardSkeleton } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ListingCard } from '@/components/listings/ListingCard';
import { useFavoriteListings } from '@/hooks/useFavorites';

export default function BuyerFavorites() {
  const { data: favorites, isLoading } = useFavoriteListings();

  return (
    <>
      <Seo title="Mes favoris" />
      <PageHeader
        title="Mes favoris"
        description={
          favorites && favorites.length > 0
            ? `${favorites.length} annonce${favorites.length > 1 ? 's' : ''} sauvegardée${favorites.length > 1 ? 's' : ''}.`
            : 'Les annonces que vous avez sauvegardées.'
        }
      />

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : favorites && favorites.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((l) => (
            <ListingCard key={l.id} listing={l} isFavorite />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Heart className="h-12 w-12" />}
          title="Aucun favori"
          description="Ajoutez des annonces à vos favoris pour les retrouver facilement ici."
          action={
            <Link to="/catalogue">
              <Button>Parcourir le catalogue</Button>
            </Link>
          }
        />
      )}
    </>
  );
}
