import { useEffect, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { useUserRegion } from '@/hooks/useWeather';
import { useToast } from '@/context/ToastContext';
import { nearestRegion } from '@/lib/weather';
import { SENEGAL_REGIONS } from '@/lib/constants';

/**
 * Météo « de votre région » : choisit automatiquement la région du profil
 * connecté, laisse changer via le sélecteur, et propose la géolocalisation
 * (« Ma position ») qui bascule sur la région sénégalaise la plus proche.
 */
export function RegionWeather() {
  const userRegion = useUserRegion();
  const { toast } = useToast();
  const [region, setRegion] = useState<string>('Dakar');
  const [pinned, setPinned] = useState(false); // l'utilisateur a choisi manuellement / géolocalisé
  const [locating, setLocating] = useState(false);

  // Tant que l'utilisateur n'a pas choisi, on suit la région de son profil.
  useEffect(() => {
    if (userRegion && !pinned && SENEGAL_REGIONS.includes(userRegion as (typeof SENEGAL_REGIONS)[number])) {
      setRegion(userRegion);
    }
  }, [userRegion, pinned]);

  const locate = () => {
    if (!('geolocation' in navigator)) {
      toast('La géolocalisation n’est pas disponible sur cet appareil.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRegion(nearestRegion(pos.coords.latitude, pos.coords.longitude));
        setPinned(true);
        setLocating(false);
      },
      () => {
        toast('Position non autorisée. Choisissez votre région dans la liste.', 'info');
        setLocating(false);
      },
      { timeout: 8000 },
    );
  };

  return (
    <div className="grid items-center gap-6 lg:grid-cols-[1fr_minmax(0,28rem)]">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
          <LocateFixed className="h-3.5 w-3.5" /> Météo locale
        </span>
        <h2 className="mt-4 text-3xl font-bold text-gray-900">La météo de votre région</h2>
        <p className="mt-3 max-w-md text-gray-600">
          Anticipez récolte, séchage et livraison. La région de votre compte est sélectionnée
          automatiquement — vous pouvez la changer ou utiliser votre position.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setPinned(true);
            }}
            aria-label="Région"
            className="w-auto"
          >
            {SENEGAL_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={locate} loading={locating}>
            <LocateFixed className="h-4 w-4" /> Ma position
          </Button>
        </div>
      </div>

      <WeatherWidget region={region} />
    </div>
  );
}
