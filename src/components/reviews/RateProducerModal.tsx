import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { StarInput } from './Stars';
import { useSubmitReview } from '@/hooks/useReviews';
import { useToast } from '@/context/ToastContext';

interface Props {
  open: boolean;
  onClose: () => void;
  buyerId: string;
  transactionId: string;
  listingTitle?: string;
  /** Note existante (édition d'un avis déjà déposé). */
  initialRating?: number;
  initialComment?: string;
}

export function RateProducerModal({
  open,
  onClose,
  buyerId,
  transactionId,
  listingTitle,
  initialRating = 0,
  initialComment = '',
}: Props) {
  const submit = useSubmitReview(buyerId);
  const { toast } = useToast();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);

  // Réinitialise à chaque ouverture (édition vs nouvel avis).
  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setComment(initialComment);
    }
  }, [open, initialRating, initialComment]);

  const send = async () => {
    if (rating < 1) {
      toast('Touchez les étoiles pour donner une note.', 'info');
      return;
    }
    try {
      await submit.mutateAsync({ transactionId, rating, comment: comment.trim() || undefined });
      toast('Merci pour votre avis !', 'success');
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Impossible d'envoyer l'avis.", 'error');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Noter le producteur">
      {listingTitle && (
        <p className="mb-4 text-sm text-gray-600">
          Concernant : <span className="font-medium text-gray-900">{listingTitle}</span>
        </p>
      )}

      <div className="flex flex-col items-center gap-1 rounded-2xl bg-muted/50 py-5">
        <StarInput value={rating} onChange={setRating} />
      </div>

      <div className="mt-4">
        <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium text-gray-700">
          Un mot (facultatif)
        </label>
        <Textarea
          id="review-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Qualité, ponctualité, contact…"
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button onClick={send} loading={submit.isPending}>
          Envoyer mon avis
        </Button>
      </div>
    </Modal>
  );
}
