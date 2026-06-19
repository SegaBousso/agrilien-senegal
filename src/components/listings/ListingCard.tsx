import { Link } from 'react-router-dom';
import { ArrowRight, Heart, MapPin, Package, Sprout } from 'lucide-react';
import { useToggleFavorite } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import { VerifiedBadge } from '@/components/producer/VerifiedBadge';
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
  const farmName = listing.producer?.farm_name;
  const isVerified = listing.producer?.verification_status === 'verifie';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg">
      <Link to={`/annonce/${listing.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <img
          src={mainImage}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
        />
        {/* Voile bas pour lisibilité de la pastille de prix */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/45 to-transparent"
        />

        {/* Catégorie — puce en verre */}
        {listing.category && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-surface/95 px-2.5 py-1 text-xs font-semibold text-primary-700 shadow-sm ring-1 ring-black/5 backdrop-blur">
            {listing.category.name}
          </span>
        )}

        {/* Favori */}
        {canFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle.mutate({ listingId: listing.id, isFavorite });
            }}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-gray-600 shadow-sm ring-1 ring-black/5 backdrop-blur transition-all duration-200 hover:scale-110 hover:text-red-500 active:scale-90"
          >
            <Heart className={cn('h-[18px] w-[18px]', isFavorite && 'fill-red-500 text-red-500')} />
          </button>
        )}

        {/* Pastille de prix en verre, sur l'image */}
        <div className="absolute bottom-3 left-3 flex items-baseline gap-1 rounded-full bg-surface/95 px-3 py-1.5 shadow-soft ring-1 ring-black/5 backdrop-blur">
          <span className="font-display text-base font-bold tracking-tight text-primary-700">
            {formatPrice(listing.price)}
          </span>
          <span className="text-[11px] font-medium text-gray-500">/ {listing.unit}</span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {/* Attribution producteur */}
        {farmName && (
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-primary-600">
            <Sprout className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{farmName}</span>
            {isVerified && <VerifiedBadge className="shrink-0 px-1.5 py-0" label="" />}
          </p>
        )}

        <Link to={`/annonce/${listing.id}`}>
          <h3 className="line-clamp-2 font-display font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary-700">
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

        {/* Pied : séparateur fin + CTA avec flèche qui glisse au survol */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3.5">
          <Link
            to={`/annonce/${listing.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
          >
            Voir l'offre
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
