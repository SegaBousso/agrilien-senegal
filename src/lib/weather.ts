// =============================================================================
// Météo — via Open-Meteo (gratuit, sans clé API, CORS ouvert).
// Utile pour planifier récoltes, séchage (arachide/mil) et livraisons.
// =============================================================================

/** Coordonnées des chefs-lieux des 14 régions du Sénégal. */
export const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  Dakar: { lat: 14.69, lon: -17.44 },
  Thiès: { lat: 14.79, lon: -16.93 },
  'Saint-Louis': { lat: 16.02, lon: -16.49 },
  Diourbel: { lat: 14.65, lon: -16.23 },
  Louga: { lat: 15.61, lon: -16.23 },
  Fatick: { lat: 14.34, lon: -16.41 },
  Kaolack: { lat: 14.15, lon: -16.07 },
  Kaffrine: { lat: 14.11, lon: -15.55 },
  Tambacounda: { lat: 13.77, lon: -13.67 },
  Kédougou: { lat: 12.56, lon: -12.18 },
  Kolda: { lat: 12.91, lon: -14.95 },
  Sédhiou: { lat: 12.7, lon: -15.56 },
  Ziguinchor: { lat: 12.58, lon: -16.27 },
  Matam: { lat: 15.66, lon: -13.25 },
};

/** Région du Sénégal la plus proche de coordonnées données (pour la géoloc). */
export function nearestRegion(lat: number, lon: number): string {
  let best = 'Dakar';
  let bestDist = Infinity;
  for (const [region, c] of Object.entries(REGION_COORDS)) {
    // Distance euclidienne approchée (suffisante pour départager 14 points).
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = region;
    }
  }
  return best;
}

export interface WeatherDay {
  date: string;
  code: number;
  max: number;
  min: number;
}

export interface Weather {
  temp: number;
  code: number;
  wind: number;
  humidity: number;
  daily: WeatherDay[];
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

/** Récupère la météo courante + prévisions 4 jours pour une région. */
export async function fetchWeather(region: string): Promise<Weather | null> {
  const c = REGION_COORDS[region];
  if (!c) return null;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=Africa%2FDakar&forecast_days=4`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Météo indisponible');
  const j = (await res.json()) as OpenMeteoResponse;

  return {
    temp: Math.round(j.current.temperature_2m),
    code: j.current.weather_code,
    wind: Math.round(j.current.wind_speed_10m),
    humidity: Math.round(j.current.relative_humidity_2m),
    daily: j.daily.time.map((t, i) => ({
      date: t,
      code: j.daily.weather_code[i],
      max: Math.round(j.daily.temperature_2m_max[i]),
      min: Math.round(j.daily.temperature_2m_min[i]),
    })),
  };
}

/** Libellé français d'un code WMO (Open-Meteo). */
export function weatherLabel(code: number): string {
  if (code === 0) return 'Ciel dégagé';
  if (code <= 2) return 'Peu nuageux';
  if (code === 3) return 'Couvert';
  if (code === 45 || code === 48) return 'Brouillard';
  if (code >= 51 && code <= 57) return 'Bruine';
  if (code >= 61 && code <= 67) return 'Pluie';
  if (code >= 71 && code <= 77) return 'Neige';
  if (code >= 80 && code <= 82) return 'Averses';
  if (code >= 85 && code <= 86) return 'Averses de neige';
  if (code >= 95) return 'Orage';
  return 'Variable';
}
