import axios from 'axios';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface ResolvedLocation {
  /** Most specific named place: neighbourhood, thana/upazila, village, town or city. */
  name: string;
  /** Wider context shown under the name, e.g. "Dhaka, Bangladesh" or "Brooklyn, New York". */
  region: string;
  country: string;
}

const uniqueParts = (parts: (string | null | undefined)[], exclude: string) => {
  const seen = new Set([exclude.trim().toLowerCase()]);
  return parts.filter((p): p is string => {
    const key = (p || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Strips generic suffixes so "Dhaka District" / "Dhaka Division" read as just "Dhaka".
const tidy = (s?: string | null) => (s || '').replace(/\s+(District|Division|Zila|Upazila|Thana|County)$/i, '').trim();

/** On-device geocoder (Android Geocoder / Apple CLGeocoder). `precise` = it named a sub-city area. */
const reverseNative = async (lat: number, lon: number): Promise<(ResolvedLocation & { precise: boolean }) | null> => {
  const [a] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
  if (!a) return null;
  const name = a.district || a.city || a.subregion || a.region;
  if (!name) return null;
  const parts = uniqueParts([tidy(a.city), tidy(a.subregion), tidy(a.region)], name).slice(0, 1);
  return {
    name,
    region: [...parts, a.country].filter(Boolean).join(', '),
    country: a.isoCountryCode || a.country || '',
    precise: !!a.district,
  };
};

/**
 * OpenStreetMap Nominatim: names neighbourhoods, thanas, villages and quarters worldwide
 * (Mirpur, Dhanmondi, Brooklyn…). Used once per GPS fix, well within its usage policy.
 */
const reverseNominatim = async (lat: number, lon: number): Promise<ResolvedLocation | null> => {
  const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
    params: { format: 'jsonv2', lat, lon, zoom: 16, addressdetails: 1, 'accept-language': 'en' },
    // Browsers send their own User-Agent and refuse to override it.
    headers: Platform.OS === 'web' ? undefined : { 'User-Agent': 'WeatherNow/2.0 (com.weathernow.app)' },
    timeout: 6000,
  });
  const a = res.data?.address;
  if (!a) return null;

  const name = a.suburb || a.village || a.hamlet || a.town || a.neighbourhood || a.quarter || a.city_district || a.city || a.municipality || a.county;
  if (!name) return null;
  // In a city: "Dhaka, Bangladesh". Outside one: upazila / county and district, e.g. "Tangail Sadar, Tangail".
  const context = a.city || a.municipality ? [a.city || a.municipality] : [tidy(a.county), tidy(a.state_district), tidy(a.state)];
  const parts = uniqueParts(context, name).slice(0, 2);
  return {
    name,
    region: [...parts, a.country].filter(Boolean).join(', '),
    country: (a.country_code || '').toUpperCase(),
  };
};

/** BigDataCloud client geocoder — last-resort fallback, no API key needed. */
const reverseWeb = async (lat: number, lon: number): Promise<ResolvedLocation | null> => {
  const res = await axios.get('https://api.bigdatacloud.net/data/reverse-geocode-client', {
    params: { latitude: lat, longitude: lon, localityLanguage: 'en' },
    timeout: 5000,
  });
  const d = res.data;
  if (!d) return null;

  // The finest administrative unit (union / upazila / borough) when no locality is named.
  const admin: { name: string; adminLevel?: number; order?: number }[] = d.localityInfo?.administrative || [];
  const finestAdmin = [...admin].filter((x) => (x.adminLevel ?? 0) >= 6).sort((x, y) => (y.order ?? 0) - (x.order ?? 0))[0];

  const name = d.locality || finestAdmin?.name || d.city || d.principalSubdivision;
  if (!name) return null;
  const parts = uniqueParts([tidy(d.city), tidy(d.principalSubdivision)], name).slice(0, 1);
  return {
    name: tidy(name) || name,
    region: [...parts, d.countryName].filter(Boolean).join(', '),
    country: d.countryCode || '',
  };
};

export const locationService = {
  /** Asks for permission and returns the device position, or null if unavailable. */
  getCurrentCoords: async (): Promise<{ lat: number; lon: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: pos.coords.latitude, lon: pos.coords.longitude };
    } catch {
      return null;
    }
  },

  /** Most precise available name: device geocoder → Nominatim → BigDataCloud. */
  reverseGeocode: async (lat: number, lon: number): Promise<ResolvedLocation | null> => {
    let coarse: ResolvedLocation | null = null;
    if (Platform.OS !== 'web') {
      try {
        const native = await reverseNative(lat, lon);
        if (native?.precise) return native;
        coarse = native;
      } catch {
        // try the online geocoders
      }
    }
    for (const lookup of [reverseNominatim, reverseWeb]) {
      try {
        const found = await lookup(lat, lon);
        if (found) return found;
      } catch {
        // next geocoder
      }
    }
    return coarse;
  },
};
