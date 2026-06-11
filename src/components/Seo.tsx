import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description?: string;
}

/**
 * Met à jour le titre et la meta description côté client.
 * Léger remplacement de react-helmet pour le SEO de base d'une SPA.
 */
export function Seo({ title, description }: SeoProps) {
  useEffect(() => {
    document.title = `${title} | AgriLien Sénégal`;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
  }, [title, description]);

  return null;
}
