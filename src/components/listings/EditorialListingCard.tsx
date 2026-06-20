import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, MapPin, Package } from 'lucide-react';
import { useToggleFavorite } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import { VerifiedBadge } from '@/components/producer/VerifiedBadge';
import { KraftTag } from '@/components/listings/KraftTag';
import { RatingChip } from '@/components/reviews/Stars';
import { cn, formatQuantity } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';
import type { ListingWithRelations } from '@/types/database';

const ED = '"Bricolage Grotesque", Lexend, system-ui, sans-serif';
const MONO = '"Spline Sans Mono", ui-monospace, SFMono-Regular, monospace';
const BISSAP = '#8A1C3B';

/**
 * Carte produit éditoriale de la page d'accueil alternative : photo + étiquette
 * kraft, région en mono, titre display, badge vérifié. Plus expressive que la
 * carte standard, accordée à l'univers « registre du marché ».
 */
export function EditorialListingCard({
  listing,
  isFavorite = false,
}: {
  listing: ListingWithRelations;
  isFavorite?: boolean;
}) {
  const { session, role } = useAuth();
  const toggle = useToggleFavorite();

  const image =
    listing.images?.find((i) => i.is_main)?.image_url ?? listing.images?.[0]?.image_url ?? PLACEHOLDER_IMAGE;
  const verified = listing.producer?.verification_status === 'verifie';
  const canFavorite = session && role === 'buyer';

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg">
      <Link to={`/annonce/${listing.id}`} className="relative block aspect-[5/4] overflow-hidden">
        <img
          src={image}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

        {/* Étiquette kraft de prix */}
        <div className="absolute right-3 top-3 rotate-[5deg] transition-transform duration-300 group-hover:rotate-[2deg]">
          <KraftTag price={listing.price} unit={listing.unit} />
        </div>

        {/* Favori (acheteur connecté) */}
        {canFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle.mutate({ listingId: listing.id, isFavorite });
            }}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-gray-600 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:scale-110 hover:text-red-500"
          >
            <Heart className={cn('h-[18px] w-[18px]', isFavorite && 'fill-red-500 text-red-500')} />
          </button>
        )}

        {/* Région (mono) en bas de l'image */}
        <p
          className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 p-3 text-xs text-white"
          style={{ fontFamily: MONO, letterSpacing: '0.08em' }}
        >
          <MapPin className="h-3.5 w-3.5" /> {listing.region.toUpperCase()}
        </p>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-2">
          <h3
            className="flex-1 text-lg leading-snug text-gray-900 transition-colors group-hover:text-[#8A1C3B]"
            style={{ fontFamily: ED, fontWeight: 700, letterSpacing: '-0.01em' }}
          >
            <Link to={`/annonce/${listing.id}`} className="line-clamp-2">
              {listing.title}
            </Link>
          </h3>
          {verified && <VerifiedBadge className="mt-0.5 shrink-0" label="" />}
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500" style={{ fontFamily: MONO }}>
          <Package className="h-3.5 w-3.5" /> {formatQuantity(listing.quantity, listing.unit)} disponible
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3.5">
          <div className="min-w-0">
            {listing.producer?.farm_name && (
              <span className="block truncate text-xs text-gray-500">{listing.producer.farm_name}</span>
            )}
            {listing.producer && (
              <RatingChip avg={listing.producer.rating_avg} count={listing.producer.rating_count} className="mt-0.5" />
            )}
          </div>
          <Link
            to={`/annonce/${listing.id}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold"
            style={{ color: BISSAP }}
          >
            Voir l'offre
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
