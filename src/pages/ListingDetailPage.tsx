import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CalendarDays,
  Heart,
  MapPin,
  Package,
  Phone,
  Sprout,
  Truck,
  User,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner, ErrorState } from '@/components/ui/States';
import { useListing } from '@/hooks/useListings';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { useCreatePurchaseRequest } from '@/hooks/useRequests';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { purchaseRequestSchema, type PurchaseRequestInput } from '@/lib/validations';
import { cn, formatDate, formatPrice, formatQuantity } from '@/lib/utils';
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

  return (
    <>
      <Seo title={listing.title} description={listing.description ?? `${listing.title} disponible à ${listing.region}.`} />

      <div className="container py-8">
        <Link to="/catalogue" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4" /> Retour au catalogue
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Galerie */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-surface">
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
                      'h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2',
                      i === activeImage ? 'border-primary-600' : 'border-transparent',
                    )}
                    aria-label={`Image ${i + 1}`}
                  >
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Infos */}
          <div>
            {listing.category && (
              <Badge className="bg-primary-50 text-primary-700">{listing.category.name}</Badge>
            )}
            <h1 className="mt-3 text-3xl font-bold text-gray-900">{listing.title}</h1>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary-700">{formatPrice(listing.price)}</span>
              <span className="text-gray-500">/ {listing.unit}</span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4">
              <Info icon={Package} label="Quantité disponible" value={formatQuantity(listing.quantity, listing.unit)} />
              <Info icon={MapPin} label="Localisation" value={`${listing.region}${listing.locality ? ` · ${listing.locality}` : ''}`} />
              <Info icon={CalendarDays} label="Disponible le" value={formatDate(listing.availability_date)} />
              <Info icon={Truck} label="Livraison" value={listing.delivery_option ?? 'À convenir'} />
            </dl>

            {listing.description && (
              <div className="mt-6">
                <h2 className="font-semibold text-gray-900">Description</h2>
                <p className="mt-2 whitespace-pre-line text-gray-600">{listing.description}</p>
              </div>
            )}

            {/* Producteur */}
            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <Sprout className="h-5 w-5 text-primary-600" /> Producteur
              </h2>
              <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{listing.producer?.farm_name}</span>
                  {listing.producer?.profile?.full_name && <span>· {listing.producer.profile.full_name}</span>}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" /> {listing.producer?.region}
                  {listing.producer?.commune ? ` · ${listing.producer.commune}` : ''}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {session ? (
                isBuyer ? (
                  <>
                    <Button size="lg" className="flex-1" onClick={() => setRequestOpen(true)}>
                      <Phone className="h-5 w-5" /> Envoyer une demande
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => toggleFav.mutate({ listingId: listing.id, isFavorite })}
                    >
                      <Heart className={cn('h-5 w-5', isFavorite && 'fill-red-500 text-red-500')} />
                      {isFavorite ? 'Sauvegardé' : 'Favori'}
                    </Button>
                  </>
                ) : (
                  <p className="rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-600">
                    Connectez-vous avec un compte acheteur pour contacter ce producteur.
                  </p>
                )
              ) : (
                <Link to="/connexion" state={{ from: `/annonce/${listing.id}` }} className="flex-1">
                  <Button size="lg" className="w-full">
                    Connectez-vous pour contacter le producteur
                  </Button>
                </Link>
              )}
            </div>
          </div>
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
    <div className="rounded-xl border border-gray-100 bg-surface p-3">
      <dt className="flex items-center gap-1.5 text-xs text-gray-500">
        <Icon className="h-3.5 w-3.5" /> {label}
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
    } catch {
      toast("Échec de l'envoi de la demande. Réessayez.", 'error');
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
