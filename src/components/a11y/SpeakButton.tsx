import { useEffect, useState } from 'react';
import { Square, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Texte lu à voix haute (en français). */
  text: string;
  /** Libellé visible. Absent → « Écouter ». Chaîne vide → icône seule. */
  label?: string;
  className?: string;
}

/**
 * Bouton « Écouter » — lit un texte à voix haute via la synthèse vocale du
 * navigateur (Web Speech API, gratuite, sans clé). Pensé pour les utilisateurs
 * qui ne lisent pas : prix, région, notifications… Ne s'affiche pas si le
 * navigateur ne sait pas parler.
 */
export function SpeakButton({ text, label, className }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Coupe la lecture si le composant disparaît.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  if (!supported) return null;

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const textToShow = label === '' ? null : label ?? 'Écouter';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={speaking ? 'Arrêter la lecture' : label || 'Écouter à voix haute'}
      aria-pressed={speaking}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border font-medium transition-colors',
        textToShow ? 'px-3 py-1.5 text-sm' : 'p-2',
        speaking ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-muted hover:text-gray-900',
        className,
      )}
    >
      {speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      {textToShow}
    </button>
  );
}
