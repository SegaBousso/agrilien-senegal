import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BadgeCheck,
  Beef,
  CalendarDays,
  ChevronRight,
  Heart,
  MapPin,
  Package,
  Phone,
  Scale,
  ShieldCheck,
  Sprout,
  Truck,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner, ErrorState } from '@/components/ui/States';
import { useListing } from '@/hooks/useListings';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { useCreatePurchaseRequest } from '@/hooks/useRequests';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { purchaseRequestSchema, type PurchaseRequestInput } from '@/lib/validations';
import { cn, formatDate, formatPrice, formatQuantity, initials } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading, isError } = useListing(id);
  const { session, role } = useAuth();
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFav = useToggleFavorite();
  const { toast } = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const [requestOpen, setRequestOpen] = useState(false);

  if (isLoading) return <Spinner label="Chargement de l'annonce…" />;
  if (isError || !listing)
    return (
      <div className="container py-16">
        <ErrorState
          title="Annonce introuvable"
          description="Cette annonce n'existe pas ou n'est plus disponible."
          action={
            <Link to="/catalogue">
              <Button>Retour au catalogue</Button>
            </Link>
          }
        />
      </div>
    );

  const images = listing.images?.length
    ? listing.images
    : [{ id: 'ph', image_url: PLACEHOLDER_IMAGE, is_main: true, listing_id: '', created_at: '' }];
  const isFavorite = (favoriteIds ?? []).includes(listing.id);
  const isBuyer = role === 'buyer';
  const farmName = listing.producer?.farm_name ?? 'Producteur';

  return (
    <>
      <Seo title={listing.title} description={listing.description ?? `${listing.title} disponible à ${listing.region}.`} />

      <div className="container py-8">
        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'Ariane" className="mb-5 flex items-center gap-1.5 text-sm text-gray-500">
          <Link to="/" className="transition-colors hover:text-primary-700">
            Accueil
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to="/catalogue" className="transition-colors hover:text-primary-700">
            Catalogue
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-medium text-gray-700">{listing.title}</span>
        </nav>

        {/* En-tête */}
        <div className="mb-6">
          {listing.category && (
            <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
              {listing.category.name}
            </span>
          )}
          <h1 className="mt-3 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">{listing.title}</h1>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="h-4 w-4" /> {listing.region}
            {listing.locality ? ` · ${listing.locality}` : ''}
          </p>
        </div>

        {/* Galerie + panneau d'achat */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* Galerie */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
              <img
                src={images[activeImage]?.image_url}
                alt={listing.title}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition-all',
                      i === activeImage
                        ? 'ring-primary-600 ring-offset-2 ring-offset-background'
                        : 'ring-transparent hover:ring-primary-200',
                    )}
                    aria-label={`Image ${i + 1}`}
                  >
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Panneau d'achat (sticky desktop) */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold tracking-tight text-primary-700">
                  {formatPrice(listing.price)}
                </span>
                <span className="text-gray-500">/ {listing.unit}</span>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-3">
                <Info icon={Package} label="Quantité" value={formatQuantity(listing.quantity, listing.unit)} />
                <Info icon={MapPin} label="Localisation" value={`${listing.region}${listing.locality ? ` · ${listing.locality}` : ''}`} />
                <Info icon={CalendarDays} label="Disponible le" value={formatDate(listing.availability_date)} />
                <Info icon={Truck} label="Livraison" value={listing.delivery_option ?? 'À convenir'} />
                {listing.attributes?.race && <Info icon={Beef} label="Race" value={listing.attributes.race} />}
                {listing.attributes?.age && <Info icon={CalendarDays} label="Âge" value={listing.attributes.age} />}
                {listing.attributes?.sexe && (
                  <Info icon={Package} label="Sexe" value={listing.attributes.sexe === 'male' ? 'Mâle' : 'Femelle'} />
                )}
                {listing.attributes?.poids ? (
                  <Info icon={Scale} label="Poids" value={`${listing.attributes.poids} kg`} />
                ) : null}
                {listing.attributes?.vaccine && (
                  <Info icon={ShieldCheck} label="Vaccination" value="Vacciné" />
                )}
              </dl>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-3">
                {session ? (
                  isBuyer ? (
                    <>
                      <Button size="lg" className="w-full" onClick={() => setRequestOpen(true)}>
                        <Phone className="h-5 w-5" /> Envoyer une demande
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full"
                        onClick={() => toggleFav.mutate({ listingId: listing.id, isFavorite })}
                      >
                        <Heart className={cn('h-5 w-5', isFavorite && 'fill-red-500 text-red-500')} />
                        {isFavorite ? 'Retiré des favoris' : 'Ajouter aux favoris'}
                      </Button>
                    </>
                  ) : (
                    <p className="rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-600">
                      Connectez-vous avec un compte acheteur pour contacter ce producteur.
                    </p>
                  )
                ) : (
                  <Link to="/connexion" state={{ from: `/annonce/${listing.id}` }}>
                    <Button size="lg" className="w-full">
                      Connectez-vous pour contacter le producteur
                    </Button>
                  </Link>
                )}
              </div>

              {/* Confiance */}
              <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm text-gray-600">
                <ShieldCheck className="h-5 w-5 shrink-0 text-primary-600" />
                Annonce vérifiée par l'équipe AgriLien
              </div>
            </div>
          </div>
        </div>

        {/* Description + producteur */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Description</h2>
            {listing.description ? (
              <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-600">{listing.description}</p>
            ) : (
              <p className="mt-3 text-gray-500">Aucune description fournie pour cette annonce.</p>
            )}
          </div>

          {/* Producteur */}
          <aside>
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                <Sprout className="h-4 w-4 text-primary-600" /> Le producteur
              </h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 font-display text-lg font-bold text-primary-700">
                  {initials(farmName)}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate font-semibold text-gray-900">
                    {farmName}
                    <BadgeCheck className="h-4 w-4 shrink-0 text-primary-600" />
                  </p>
                  {listing.producer?.profile?.full_name && (
                    <p className="truncate text-sm text-gray-500">{listing.producer.profile.full_name}</p>
                  )}
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                {listing.producer?.region}
                {listing.producer?.commune ? ` · ${listing.producer.commune}` : ''}
              </p>
              {listing.producer?.description && (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{listing.producer.description}</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {isBuyer && session && (
        <PurchaseRequestModal
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          listingId={listing.id}
          listingTitle={listing.title}
          unit={listing.unit}
          maxQuantity={listing.quantity}
          buyerId={session.user.id}
          onSuccess={() => {
            setRequestOpen(false);
            toast('Demande envoyée au producteur.', 'success');
          }}
        />
      )}
    </>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-3">
      <dt className="flex items-center gap-1.5 text-xs text-gray-500">
        <Icon className="h-3.5 w-3.5 text-primary-600" /> {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function PurchaseRequestModal({
  open,
  onClose,
  listingId,
  listingTitle,
  unit,
  maxQuantity,
  buyerId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  unit: string;
  maxQuantity: number;
  buyerId: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const createRequest = useCreatePurchaseRequest();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PurchaseRequestInput>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: { quantity_requested: 1, message: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createRequest.mutateAsync({ listingId, buyerId, input: values });
      reset();
      onSuccess();
    } catch (err) {
      // Remonte le message réel (ex. quantité demandée > stock disponible).
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : "Échec de l'envoi de la demande. Réessayez.";
      toast(msg, 'error');
    }
  });

  return (
    <Modal open={open} onClose={onClose} title="Demande d'achat">
      <p className="mb-4 text-sm text-gray-600">
        Concernant : <span className="font-medium text-gray-900">{listingTitle}</span>
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label={`Quantité souhaitée (${unit})`}
          htmlFor="quantity_requested"
          error={errors.quantity_requested?.message}
          hint={`Maximum disponible : ${maxQuantity} ${unit}`}
          required
        >
          <Input
            id="quantity_requested"
            type="number"
            step="any"
            min={0}
            {...register('quantity_requested')}
          />
        </Field>
        <Field label="Message au producteur" htmlFor="message" error={errors.message?.message} required>
          <Textarea
            id="message"
            placeholder="Bonjour, je suis intéressé par votre récolte…"
            {...register('message')}
          />
        </Field>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={createRequest.isPending}>
            Envoyer la demande
          </Button>
        </div>
      </form>
    </Modal>
  );
}
