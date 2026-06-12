import { useEffect, useState, type ComponentType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, ImagePlus, Loader2, MapPin, Scale, X } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useCreateListing, useListing, useUpdateListing } from '@/hooks/useListings';
import { useCategories } from '@/hooks/useCatalog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { addListingImage, uploadListingImage } from '@/services/catalog.service';
import { ensureProducerProfile } from '@/services/profiles.service';
import { listingSchema, type ListingInput } from '@/lib/validations';
import { DELIVERY_OPTIONS, SENEGAL_REGIONS, UNITS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface PendingImage {
  file: File;
  preview: string;
}

export default function ListingFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { producerId, session, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { data: categories } = useCategories();
  const { data: existing, isLoading: loadingExisting } = useListing(isEdit ? id : undefined);

  const createListing = useCreateListing();
  const updateListing = useUpdateListing();

  const [images, setImages] = useState<PendingImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: { unit: 'kg', quantity: 1, price: 0 },
  });

  // Pré-remplissage en mode édition.
  useEffect(() => {
    if (isEdit && existing) {
      reset({
        title: existing.title,
        description: existing.description ?? '',
        category_id: existing.category_id ?? '',
        quantity: existing.quantity,
        unit: existing.unit as ListingInput['unit'],
        price: existing.price,
        region: existing.region as ListingInput['region'],
        locality: existing.locality ?? '',
        availability_date: existing.availability_date ?? '',
        delivery_option: existing.delivery_option ?? '',
      });
    }
  }, [isEdit, existing, reset]);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 5 - images.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...next]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      let listingId = id;

      if (isEdit && id) {
        await updateListing.mutateAsync({ id, input: values });
      } else {
        if (!session) throw new Error('Session expirée. Reconnectez-vous.');
        // Auto-répare un profil producteur manquant (sinon producer_id NULL + RLS).
        let resolvedProducerId = producerId;
        if (!resolvedProducerId) {
          const prof = await ensureProducerProfile(session.user.id, {
            farm_name: profile?.full_name?.trim() || 'Mon exploitation',
            region: values.region,
          });
          resolvedProducerId = prof.id;
          await refreshProfile();
        }
        const created = await createListing.mutateAsync({
          producerId: resolvedProducerId,
          input: values,
        });
        listingId = created.id;
      }

      // Upload des images (non bloquant : l'annonce est déjà enregistrée).
      if (listingId && images.length > 0 && session) {
        setUploading(true);
        try {
          for (let i = 0; i < images.length; i++) {
            const url = await uploadListingImage(session.user.id, listingId, images[i].file);
            await addListingImage(listingId, url, i === 0);
          }
        } catch (imgErr) {
          console.error('Erreur upload images :', imgErr);
          toast(
            "Annonce enregistrée, mais l'envoi des photos a échoué. Vérifiez que le bucket Storage existe, puis réessayez depuis la modification.",
            'info',
          );
        } finally {
          setUploading(false);
        }
      }

      toast(
        isEdit ? 'Annonce mise à jour.' : 'Annonce créée ! Elle sera publiée après validation.',
        'success',
      );
      navigate('/producteur/annonces');
    } catch (err) {
      setUploading(false);
      // Affiche le message Supabase réel pour faciliter le diagnostic.
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : "Échec de l'enregistrement. Vérifiez les champs et réessayez.";
      console.error('Erreur enregistrement annonce :', err);
      toast(message, 'error');
    }
  });

  if (isEdit && loadingExisting) return <Spinner />;

  const busy = isSubmitting || uploading || createListing.isPending || updateListing.isPending;

  return (
    <>
      <Seo title={isEdit ? "Modifier l'annonce" : 'Nouvelle annonce'} />
      <PageHeader
        title={isEdit ? "Modifier l'annonce" : 'Nouvelle annonce'}
        description="Renseignez les informations de votre récolte. Les champs marqués d'une * sont obligatoires."
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody className="space-y-4">
              <SectionHeader num="1" icon={FileText} title="Informations" subtitle="Le produit et sa description" />
              <Field label="Titre de l'annonce" htmlFor="title" error={errors.title?.message} required>
                <Input id="title" placeholder="Mangues Kent fraîches" {...register('title')} />
              </Field>

              <Field label="Catégorie" htmlFor="category_id" error={errors.category_id?.message} required>
                <Select id="category_id" defaultValue="" {...register('category_id')}>
                  <option value="" disabled>
                    Sélectionner une catégorie
                  </option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Description" htmlFor="description" error={errors.description?.message} hint="Décrivez la qualité, la variété, les conditions de récolte…">
                <Textarea id="description" rows={5} {...register('description')} />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <SectionHeader num="2" icon={Scale} title="Quantité & prix" subtitle="Ce que vous proposez et à quel tarif" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Quantité" htmlFor="quantity" error={errors.quantity?.message} required>
                  <Input id="quantity" type="number" step="any" min={0} {...register('quantity')} />
                </Field>
                <Field label="Unité" htmlFor="unit" error={errors.unit?.message} required>
                  <Select id="unit" {...register('unit')}>
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Prix / unité (FCFA)" htmlFor="price" error={errors.price?.message} required>
                  <Input id="price" type="number" step="any" min={0} {...register('price')} />
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <SectionHeader num="3" icon={MapPin} title="Localisation & livraison" subtitle="Où et quand récupérer le produit" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Région" htmlFor="region" error={errors.region?.message} required>
                  <Select id="region" defaultValue="" {...register('region')}>
                    <option value="" disabled>
                      Sélectionner
                    </option>
                    {SENEGAL_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Localité / commune" htmlFor="locality" error={errors.locality?.message}>
                  <Input id="locality" {...register('locality')} />
                </Field>
                <Field label="Date de disponibilité" htmlFor="availability_date" error={errors.availability_date?.message}>
                  <Input id="availability_date" type="date" {...register('availability_date')} />
                </Field>
                <Field label="Option de livraison" htmlFor="delivery_option">
                  <Select id="delivery_option" defaultValue="" {...register('delivery_option')}>
                    <option value="">Non précisé</option>
                    {DELIVERY_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Colonne images + actions (sticky desktop) */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-gray-900">Photos</h2>
                <span className="text-xs font-medium text-gray-500">{images.length}/5</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Glissez vos images ici. La première sera la photo principale.
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addImages(e.dataTransfer.files);
                }}
                className={cn(
                  'mt-4 grid grid-cols-3 gap-2 rounded-xl p-1 transition-colors',
                  dragOver && 'bg-primary-50 ring-2 ring-primary-300',
                )}
              >
                {images.map((img, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-transform hover:scale-110"
                      aria-label="Retirer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-primary-600 px-1.5 text-[10px] font-medium text-white">
                        Principale
                      </span>
                    )}
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-gray-400 transition-colors hover:border-primary-400 hover:text-primary-600">
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-[10px]">Ajouter</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => addImages(e.target.files)}
                    />
                  </label>
                )}
              </div>
              {isEdit && existing && existing.images.length > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                  Cette annonce possède déjà {existing.images.length} image(s). Les nouvelles seront ajoutées.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3">
              <Button type="submit" size="lg" className="w-full" loading={busy}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Envoi des images…
                  </>
                ) : isEdit ? (
                  'Enregistrer les modifications'
                ) : (
                  "Publier l'annonce"
                )}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate(-1)}>
                Annuler
              </Button>
              <p className="text-center text-xs text-gray-400">
                Les annonces sont vérifiées par un administrateur avant publication.
              </p>
            </CardBody>
          </Card>
        </div>
      </form>
    </>
  );
}

function SectionHeader({
  num,
  icon: Icon,
  title,
  subtitle,
}: {
  num: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border pb-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 font-display text-sm font-bold text-primary-700">
        {num}
      </span>
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 font-display font-semibold text-gray-900">
          <Icon className="h-4 w-4 text-primary-600" /> {title}
        </h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
