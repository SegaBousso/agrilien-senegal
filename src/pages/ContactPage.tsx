import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/context/ToastContext';
import { contactSchema, type ContactInput } from '@/lib/validations';

export default function ContactPage() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  const onSubmit = handleSubmit(async () => {
    // V1 : envoi simulé. À brancher sur une Edge Function / service email en production.
    await new Promise((r) => setTimeout(r, 600));
    toast('Message envoyé ! Nous vous répondrons rapidement.', 'success');
    reset();
  });

  return (
    <>
      <Seo title="Contact" description="Contactez l'équipe AgriLien Sénégal pour toute question ou suggestion." />

      <div className="container py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-gray-900">Contactez-nous</h1>
          <p className="mt-3 text-gray-600">
            Une question, une suggestion ou besoin d'aide ? Écrivez-nous.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-[1fr_1.3fr]">
          <div className="space-y-4">
            {[
              { icon: MapPin, label: 'Adresse', value: 'Dakar, Sénégal' },
              { icon: Phone, label: 'Téléphone', value: '+221 77 000 00 00' },
              { icon: Mail, label: 'Email', value: 'contact@agrilien.sn' },
            ].map((c) => (
              <Card key={c.label}>
                <CardBody className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-gray-500">{c.label}</p>
                    <p className="font-medium text-gray-900">{c.value}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <Card>
            <CardBody>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nom" htmlFor="name" error={errors.name?.message} required>
                    <Input id="name" {...register('name')} />
                  </Field>
                  <Field label="Email" htmlFor="email" error={errors.email?.message} required>
                    <Input id="email" type="email" {...register('email')} />
                  </Field>
                </div>
                <Field label="Sujet" htmlFor="subject" error={errors.subject?.message} required>
                  <Input id="subject" {...register('subject')} />
                </Field>
                <Field label="Message" htmlFor="message" error={errors.message?.message} required>
                  <Textarea id="message" rows={5} {...register('message')} />
                </Field>
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  Envoyer le message
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
