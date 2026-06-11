import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Page introuvable" />
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Sprout className="h-16 w-16 text-primary-200" />
        <p className="mt-6 text-6xl font-extrabold text-primary-700">404</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Page introuvable</h1>
        <p className="mt-2 max-w-md text-gray-600">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="mt-6">
          <Button size="lg">Retour à l'accueil</Button>
        </Link>
      </div>
    </>
  );
}
