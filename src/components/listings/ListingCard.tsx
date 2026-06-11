import { Link } from 'react-router-dom';
import { Heart, MapPin, Package } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useToggleFavorite } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import { cn, formatPrice, formatQuantity } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';
import type { ListingWithRelations } from '@/types/database';

interface ListingCardProps {
  listing: ListingWithRelations;
  isFavorite?: boolean;
  showFavorite?: boolean;
}

export function ListingCard({ listing, isFavorite = false, showFavorite = true }: ListingCardProps) {
  const { session, role } = useAuth();
  const toggle = useToggleFavorite();

  const mainImage =
    listing.images?.find((i) => i.is_main)?.image_url ??
    listing.images?.[0]?.image_url ??
    PLACEHOLDER_IMAGE;

  const canFavorite = showFavorite && session && role === 'buyer';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg">
      <Link to={`/annonce/${listing.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <img
          src={mainImage}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {listing.category && (
          <Badge className="absolute left-3 top-3 bg-white/90 text-primary-700 backdrop-blur">
            {listing.category.name}
          </Badge>
        )}
        {canFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle.mutate({ listingId: listing.id, isFavorite });
            }}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm backdrop-blur transition hover:text-red-500"
          >
            <Heart className={cn('h-5 w-5', isFavorite && 'fill-red-500 text-red-500')} />
          </button>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/annonce/${listing.id}`}>
          <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-primary-700">
            {listing.title}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {listing.region}
          </span>
          <span className="inline-flex items-center gap-1">
            <Package className="h-3.5 w-3.5" /> {formatQuantity(listing.quantity, listing.unit)}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-primary-700">
              {formatPrice(listing.price)}
            </p>
            <p className="text-xs text-gray-400">/ {listing.unit}</p>
          </div>
          <Link
            to={`/annonce/${listing.id}`}
            className="rounded-xl bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
          >
            Voir l'offre
          </Link>
        </div>
      </div>
    </article>
  );
}
