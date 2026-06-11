import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-gray-50">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-gray-600">
            La plateforme qui connecte producteurs agricoles et acheteurs partout au Sénégal.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Navigation</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link to="/catalogue" className="hover:text-primary-700">Catalogue</Link></li>
            <li><Link to="/a-propos" className="hover:text-primary-700">À propos</Link></li>
            <li><Link to="/contact" className="hover:text-primary-700">Contact</Link></li>
            <li><Link to="/inscription" className="hover:text-primary-700">Devenir producteur</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Compte</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link to="/connexion" className="hover:text-primary-700">Connexion</Link></li>
            <li><Link to="/inscription" className="hover:text-primary-700">Inscription</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-600" /> Dakar, Sénégal</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary-600" /> +221 77 000 00 00</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary-600" /> contact@agrilien.sn</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-sm text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} AgriLien Sénégal. Tous droits réservés.</p>
          <p>Conçu pour l'agriculture sénégalaise 🌱</p>
        </div>
      </div>
    </footer>
  );
}
