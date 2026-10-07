/* Forecast from Open-Meteo (free, no key). Temperatures are in °F. */

export type Sky = 'sun' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm';

export interface Day {
  date: string;
  high: number;
  low: number;
  sky: Sky;
}

export interface Forecast {
  now: number;
  sky: Sky;
  summary: string;
  days: Day[];
}

/** WMO weather codes → a small set of skies. */
function skyOf(code: number): Sky {
  if (code === 0 || code === 1) return 'sun';
  if (code === 2 || code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([95, 96, 99].includes(code)) return 'storm';
  if (code >= 51) return 'rain';
  return 'cloud';
}

const WORDS: Record<Sky, string> = { sun: 'clear', cloud: 'cloudy', fog: 'foggy', rain: 'rainy', snow: 'snowy', storm: 'stormy' };
export const skyWord = (s: Sky) => WORDS[s];

export async function geocode(city: string): Promise<{ name: string; lat: number; lon: number } | null> {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`);
  if (!res.ok) return null;
  const data = await res.json();
  const hit = data.results?.[0];
  return hit ? { name: hit.name, lat: hit.latitude, lon: hit.longitude } : null;
}

export async function forecast(lat: number, lon: number): Promise<Forecast | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code' +
    '&temperature_unit=fahrenheit&timezone=auto&forecast_days=7';
  const res = await fetch(url);
  if (!res.ok) return null;
  const d = await res.json();
  const days: Day[] = d.daily.time.map((date: string, i: number) => ({
    date,
    high: Math.round(d.daily.temperature_2m_max[i]),
    low: Math.round(d.daily.temperature_2m_min[i]),
    sky: skyOf(d.daily.weather_code[i]),
  }));
  const sky = skyOf(d.current.weather_code);
  const now = Math.round(d.current.temperature_2m);
  return { now, sky, summary: `${now}° and ${WORDS[sky]} · High ${days[0].high}°`, days };
}
