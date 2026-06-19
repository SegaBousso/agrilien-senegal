import { BadgeCheck, Clock, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { useMyProducerProfile, useRequestVerification } from '@/hooks/useVerification';
import { useToast } from '@/context/ToastContext';
import type { VerificationStatus } from '@/types/database';

const META: Record<
  VerificationStatus,
  { icon: typeof ShieldCheck; tone: string; title: string; body: string; cta?: string }
> = {
  non_verifie: {
    icon: ShieldCheck,
    tone: 'text-gray-500 bg-gray-100',
    title: 'Compte non vérifié',
    body: 'Faites vérifier votre compte pour gagner la confiance des acheteurs : un badge « Vérifié » apparaîtra sur vos annonces.',
    cta: 'Demander la vérification',
  },
  en_attente: {
    icon: Clock,
    tone: 'text-accent-600 bg-accent-100',
    title: 'Vérification en cours',
    body: "Votre demande a été transmise. Un administrateur l'examine, vous serez notifié de la décision.",
  },
  verifie: {
    icon: BadgeCheck,
    tone: 'text-primary-700 bg-primary-100',
    title: 'Producteur vérifié ✓',
    body: 'Votre compte est vérifié. Le badge de confiance est affiché sur vos annonces et votre profil.',
  },
  rejete: {
    icon: ShieldX,
    tone: 'text-red-600 bg-red-100',
    title: 'Vérification refusée',
    body: 'Votre demande a été refusée. Complétez/corrigez les informations de votre exploitation puis renouvelez la demande.',
    cta: 'Renouveler la demande',
  },
};

export function VerificationCard({ userId }: { userId: string | undefined }) {
  const { data: producer, isLoading } = useMyProducerProfile(userId);
  const request = useRequestVerification(userId);
  const { toast } = useToast();

  if (isLoading || !producer) return null;

  const status = producer.verification_status;
  const meta = META[status];
  const Icon = meta.icon;

  const onRequest = async () => {
    try {
      await request.mutateAsync();
      toast('Demande de vérification envoyée.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible.', 'error');
    }
  };

  return (
    <Card>
      <CardBody className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-gray-900">{meta.title}</p>
            <p className="mt-0.5 max-w-xl text-sm text-gray-500">{meta.body}</p>
            {status === 'rejete' && producer.verification_notes && (
              <p className="mt-1 text-sm text-red-600">Motif : {producer.verification_notes}</p>
            )}
          </div>
        </div>
        {meta.cta && (
          <Button onClick={onRequest} loading={request.isPending} className="shrink-0">
            {meta.cta}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
