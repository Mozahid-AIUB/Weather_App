import { Platform } from 'react-native';
import type { Place } from '../types/weather';

// ============================================
// WEATHER API
// ============================================
export const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';
export const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// ============================================
// BACKEND API (NestJS on your VPS — optional)
// ============================================
export const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://YOUR_VPS_IP:3001/api';

// ============================================
// POPULAR PLACES — ordered by population / how often people look them up
// ============================================
const P = (name: string, country: string, region: string, lat: number, lon: number): Place => ({ name, country, region, lat, lon });

const BANGLADESH: Place[] = [
  P('Dhaka', 'BD', 'Bangladesh', 23.8103, 90.4125),
  P('Chattogram', 'BD', 'Bangladesh', 22.3569, 91.7832),
  P('Sylhet', 'BD', 'Bangladesh', 24.8949, 91.8687),
  P("Cox's Bazar", 'BD', 'Chattogram, Bangladesh', 21.4272, 92.0058),
  P('Khulna', 'BD', 'Bangladesh', 22.8456, 89.5403),
  P('Rajshahi', 'BD', 'Bangladesh', 24.3745, 88.6042),
  P('Gazipur', 'BD', 'Dhaka, Bangladesh', 23.9999, 90.4203),
  P('Cumilla', 'BD', 'Chattogram, Bangladesh', 23.4607, 91.1809),
  P('Mymensingh', 'BD', 'Bangladesh', 24.7471, 90.4203),
  P('Rangpur', 'BD', 'Bangladesh', 25.7439, 89.2752),
  P('Barishal', 'BD', 'Bangladesh', 22.701, 90.3535),
];

const UNITED_STATES: Place[] = [
  P('New York', 'US', 'New York, United States', 40.7128, -74.006),
  P('Los Angeles', 'US', 'California, United States', 34.0522, -118.2437),
  P('Chicago', 'US', 'Illinois, United States', 41.8781, -87.6298),
  P('Houston', 'US', 'Texas, United States', 29.7604, -95.3698),
  P('Miami', 'US', 'Florida, United States', 25.7617, -80.1918),
  P('Dallas', 'US', 'Texas, United States', 32.7767, -96.797),
  P('San Francisco', 'US', 'California, United States', 37.7749, -122.4194),
  P('Seattle', 'US', 'Washington, United States', 47.6062, -122.3321),
  P('Atlanta', 'US', 'Georgia, United States', 33.749, -84.388),
  P('Las Vegas', 'US', 'Nevada, United States', 36.1699, -115.1398),
];

const UNITED_KINGDOM: Place[] = [
  P('London', 'GB', 'England, United Kingdom', 51.5072, -0.1276),
  P('Manchester', 'GB', 'England, United Kingdom', 53.4808, -2.2426),
  P('Birmingham', 'GB', 'England, United Kingdom', 52.4862, -1.8904),
  P('Edinburgh', 'GB', 'Scotland, United Kingdom', 55.9533, -3.1883),
  P('Glasgow', 'GB', 'Scotland, United Kingdom', 55.8642, -4.2518),
  P('Liverpool', 'GB', 'England, United Kingdom', 53.4084, -2.9916),
];

const EUROPE_CITIES: Place[] = [
  P('London', 'GB', 'England, United Kingdom', 51.5072, -0.1276),
  P('Paris', 'FR', 'Île-de-France, France', 48.8566, 2.3522),
  P('Berlin', 'DE', 'Germany', 52.52, 13.405),
  P('Madrid', 'ES', 'Spain', 40.4168, -3.7038),
  P('Rome', 'IT', 'Lazio, Italy', 41.9028, 12.4964),
  P('Amsterdam', 'NL', 'Netherlands', 52.3676, 4.9041),
  P('Barcelona', 'ES', 'Catalonia, Spain', 41.3874, 2.1686),
  P('Vienna', 'AT', 'Austria', 48.2082, 16.3738),
  P('Lisbon', 'PT', 'Portugal', 38.7223, -9.1393),
  P('Prague', 'CZ', 'Czechia', 50.0755, 14.4378),
];

const WORLD: Place[] = [
  P('New York', 'US', 'New York, United States', 40.7128, -74.006),
  P('London', 'GB', 'England, United Kingdom', 51.5072, -0.1276),
  P('Dubai', 'AE', 'United Arab Emirates', 25.2048, 55.2708),
  P('Tokyo', 'JP', 'Japan', 35.6762, 139.6503),
  P('Paris', 'FR', 'Île-de-France, France', 48.8566, 2.3522),
  P('Singapore', 'SG', 'Singapore', 1.3521, 103.8198),
  P('Istanbul', 'TR', 'Türkiye', 41.0082, 28.9784),
  P('Toronto', 'CA', 'Ontario, Canada', 43.6532, -79.3832),
  P('Sydney', 'AU', 'New South Wales, Australia', -33.8688, 151.2093),
];

const EUROPE = new Set(['AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK']);

/** Device region from the locale, e.g. "en-US" → "US". */
export const localeRegion = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.match(/[-_]([A-Z]{2})(?:[-_]|$)/)?.[1] || '';
  } catch {
    return '';
  }
};

/** The most-looked-up places for someone in `country`, most popular first. */
export const popularFor = (country: string): { label: string; places: Place[] } => {
  const code = country.toUpperCase();
  if (code === 'BD') return { label: 'Popular in Bangladesh', places: BANGLADESH };
  if (code === 'US') return { label: 'Popular in the US', places: UNITED_STATES };
  if (code === 'GB') return { label: 'Popular in the UK', places: UNITED_KINGDOM };
  if (EUROPE.has(code)) {
    const local = EUROPE_CITIES.filter((p) => p.country === code);
    return { label: 'Popular in Europe', places: [...local, ...EUROPE_CITIES.filter((p) => p.country !== code)] };
  }
  return { label: 'Popular cities', places: WORLD };
};

export const POPULAR_WORLD = WORLD;

/** Starting place when GPS is unavailable — the top city for the device region. */
export const defaultPlace = (): Place => popularFor(localeRegion() || 'BD').places[0];

// Windows has no flag emoji glyphs (they render as letter pairs), so skip flags there.
const NO_FLAG_EMOJI = Platform.OS === 'web' && typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);

/** "BD" → 🇧🇩 ('' where flags can't be drawn). */
export const countryFlag = (code?: string) =>
  !NO_FLAG_EMOJI && code && /^[A-Za-z]{2}$/.test(code)
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : '';

// ============================================
// DEVELOPER
// ============================================
export const DEVELOPER = {
  name: 'Mozahid Software',
  role: 'Software, App & AI Solutions',
  email: 'mozahidul.islam.ai@gmail.com',
};
