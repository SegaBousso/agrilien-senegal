import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronDown,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sprout,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { contactSchema, type ContactInput } from '@/lib/validations';

const CONTACTS = [
  { icon: MapPin, label: 'Adresse', value: 'Dakar, Sénégal', href: undefined },
  { icon: Phone, label: 'Téléphone', value: '+221 77 000 00 00', href: 'tel:+22177000000' },
  { icon: Mail, label: 'Email', value: 'contact@agrilien.sn', href: 'mailto:contact@agrilien.sn' },
];

const SOCIALS = [
  { icon: Facebook, label: 'Facebook' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Linkedin, label: 'LinkedIn' },
];

const FAQ = [
  {
    q: 'AgriLien prend-il une commission ?',
    a: "Non. L'inscription et la mise en relation entre producteurs et acheteurs sont entièrement gratuites.",
  },
  {
    q: 'Comment publier une annonce ?',
    a: 'Créez un compte producteur, puis cliquez sur « Nouvelle annonce » depuis votre tableau de bord. Cela prend quelques minutes.',
  },
  {
    q: 'Les annonces sont-elles vérifiées ?',
    a: 'Oui, chaque annonce est contrôlée par notre équipe avant sa publication au catalogue.',
  },
  {
    q: 'Dans quelles régions êtes-vous présents ?',
    a: 'AgriLien couvre les 14 régions du Sénégal, de Dakar à Ziguinchor.',
  },
];

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

      <div className="container py-12 lg:py-16">
        {/* En-tête */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
            <MessageSquare className="h-3.5 w-3.5" /> Contact
          </span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">Parlons-en</h1>
          <p className="mt-3 text-gray-600">
            Une question, une suggestion ou besoin d'aide ? Notre équipe vous répond.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-[0.85fr_1.15fr]">
          {/* Panneau coordonnées */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 p-8 text-white shadow-soft-lg">
            <Sprout
              aria-hidden
              className="pointer-events-none absolute -bottom-6 -right-6 h-44 w-44 text-white/10"
            />
            <h2 className="relative font-display text-2xl font-bold">Coordonnées</h2>
            <p className="relative mt-2 text-sm text-primary-50/90">
              Écrivez-nous, appelez-nous ou passez nous voir.
            </p>

            <ul className="relative mt-8 space-y-5">
              {CONTACTS.map((c) => (
                <li key={c.label} className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                    <c.icon className="h-5 w-5 text-accent-300" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-primary-50/70">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} className="font-medium transition-colors hover:text-accent-300">
                        {c.value}
                      </a>
                    ) : (
                      <p className="font-medium">{c.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium ring-1 ring-white/20">
              <Clock className="h-4 w-4 text-accent-300" /> Réponse sous 24&nbsp;h
            </div>

            <div className="relative mt-8 flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 transition-colors hover:bg-white/25"
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Formulaire */}
          <div className="rounded-3xl border border-border bg-surface p-7 shadow-soft md:p-8">
            <h2 className="font-display text-xl font-bold text-gray-900">Envoyez un message</h2>
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom" htmlFor="name" error={errors.name?.message} required>
                  <Input id="name" autoComplete="name" {...register('name')} />
                </Field>
                <Field label="Email" htmlFor="email" error={errors.email?.message} required>
                  <Input id="email" type="email" autoComplete="email" {...register('email')} />
                </Field>
              </div>
              <Field label="Sujet" htmlFor="subject" error={errors.subject?.message} required>
                <Input id="subject" {...register('subject')} />
              </Field>
              <Field label="Message" htmlFor="message" error={errors.message?.message} required>
                <Textarea id="message" rows={5} {...register('message')} />
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                <Send className="h-4 w-4" /> Envoyer le message
              </Button>
            </form>
          </div>
        </div>

        {/* FAQ */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-gray-900">Questions fréquentes</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-border bg-surface px-5 shadow-soft transition-shadow open:shadow-soft-lg"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-primary-600 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
