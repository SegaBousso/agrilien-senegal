import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Remonte en haut de page à chaque changement de route. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}
