import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CurrentWeather, DailyItem, ForecastItem, HourlyItem, Place } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { locationService } from '../services/locationService';
import { backendService } from '../services/backendService';
import { cityDateKey, cityHour, countryName } from '../utils/format';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface WeatherState {
  place: Place | null;
  /** Place being loaded when switching, so the UI can name it and show a skeleton. */
  pending: Place | null;
  isGps: boolean;
  current: CurrentWeather | null;
  forecast: ForecastItem[];
  hourly: HourlyItem[];
  daily: DailyItem[];
  status: Status;
  error: string | null;
  isRefreshing: boolean;
  lastUpdated: number | null;
  places: Place[];
  /** Country of the last GPS fix — drives "Popular in …" suggestions. */
  homeCountry: string | null;

  /** Load weather for a place. Pass `isGps` for the device location (name is reverse-geocoded). */
  loadPlace: (place: Place, opts?: { isGps?: boolean; save?: boolean }) => Promise<boolean>;
  locate: () => Promise<boolean>;
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
  hydratePlaces: () => Promise<void>;
  savePlace: (place: Place) => void;
  removePlace: (place: Place) => void;
}

const PLACES_KEY = '@weathernow_places_v1';
const LAST_PLACE_KEY = '@weathernow_last_place_v1';
const HOME_KEY = '@weathernow_home_country_v1';

// Only the newest request may write to the store, so a slow response can't overwrite a newer place.
let requestSeq = 0;

export const samePlace = (a?: Place | null, b?: Place | null) =>
  !!a && !!b && Math.abs(a.lat - b.lat) < 0.02 && Math.abs(a.lon - b.lon) < 0.02;

const buildHourly = (current: CurrentWeather, list: ForecastItem[]): HourlyItem[] => [
  {
    dt: current.dt,
    temp: current.main.temp,
    icon: current.weather[0]?.icon || '01d',
    pop: list[0]?.pop ?? 0,
    isNow: true,
  },
  ...list.slice(0, 8).map((item) => ({
    dt: item.dt,
    temp: item.main.temp,
    icon: item.weather[0]?.icon || '01d',
    pop: item.pop ?? 0,
    isNow: false,
  })),
];

const buildDaily = (current: CurrentWeather, list: ForecastItem[]): DailyItem[] => {
  const tz = current.timezone;
  const groups = new Map<string, ForecastItem[]>();
  list.forEach((item) => {
    const key = cityDateKey(item.dt, tz);
    groups.set(key, [...(groups.get(key) || []), item]);
  });

  const todayKey = cityDateKey(current.dt, tz);
  return Array.from(groups.entries())
    .slice(0, 6)
    .map(([dateKey, items]) => {
      const temps = items.map((i) => i.main.temp);
      if (dateKey === todayKey) temps.push(current.main.temp);
      // Represent the day by its midday slot rather than a night-time one.
      const midday = items.reduce((best, i) =>
        Math.abs(cityHour(i.dt, tz) - 13) < Math.abs(cityHour(best.dt, tz) - 13) ? i : best
      );
      const cond = midday.weather[0];
      return {
        dateKey,
        dt: items[0].dt,
        high: Math.max(...temps),
        low: Math.min(...temps),
        icon: (cond?.icon || '01d').replace('n', 'd'),
        conditionId: cond?.id ?? 800,
        description: cond?.description || '',
        pop: Math.max(...items.map((i) => i.pop ?? 0)),
      };
    });
};

export const useWeatherStore = create<WeatherState>((set, get) => ({
  place: null,
  pending: null,
  isGps: false,
  current: null,
  forecast: [],
  hourly: [],
  daily: [],
  status: 'idle',
  error: null,
  isRefreshing: false,
  lastUpdated: null,
  places: [],
  homeCountry: null,

  loadPlace: async (place, opts = {}) => {
    const isGps = !!opts.isGps;
    const seq = ++requestSeq;
    const switching = !samePlace(place, get().place);
    set({ status: switching || !get().current ? 'loading' : get().status, error: null, pending: switching ? place : null });

    try {
      const [{ current, forecast }, geo] = await Promise.all([
        weatherService.getWeather(place.lat, place.lon),
        isGps && !place.name ? locationService.reverseGeocode(place.lat, place.lon) : Promise.resolve(null),
      ]);
      if (seq !== requestSeq) return false;

      const resolved: Place = {
        ...place,
        name: geo?.name || place.name || current.name,
        region: geo?.region || place.region || countryName(place.country || current.sys.country),
        country: geo?.country || place.country || current.sys.country,
      };
      if (current.timezone === undefined) current.timezone = forecast.city?.timezone;

      set({
        place: resolved,
        pending: null,
        isGps,
        current,
        forecast: forecast.list,
        hourly: buildHourly(current, forecast.list),
        daily: buildDaily(current, forecast.list),
        status: 'ready',
        lastUpdated: Date.now(),
      });

      AsyncStorage.setItem(LAST_PLACE_KEY, JSON.stringify({ ...resolved, isGps })).catch(() => {});
      if (isGps && resolved.country && resolved.country !== get().homeCountry) {
        set({ homeCountry: resolved.country });
        AsyncStorage.setItem(HOME_KEY, resolved.country).catch(() => {});
      }
      if (opts.save) {
        get().savePlace(resolved);
        backendService.saveSearchHistory({ city: resolved.name, country: resolved.country, lat: resolved.lat, lon: resolved.lon });
      }
      if (switching) backendService.logWeatherView(resolved.name, resolved.country);
      return true;
    } catch {
      if (seq !== requestSeq) return false;
      set({
        pending: null,
        status: get().current ? 'ready' : 'error',
        error: "Couldn't reach the weather service. Check your connection and try again.",
      });
      return false;
    }
  },

  locate: async () => {
    const coords = await locationService.getCurrentCoords();
    if (!coords) return false;
    return get().loadPlace({ name: '', country: '', lat: coords.lat, lon: coords.lon }, { isGps: true });
  },

  refresh: async ({ silent = false } = {}) => {
    const { place, isGps, status } = get();
    if (!place || status === 'loading') return;
    if (!silent) set({ isRefreshing: true });
    try {
      await get().loadPlace(place, { isGps });
    } finally {
      if (!silent) set({ isRefreshing: false });
    }
  },

  hydratePlaces: async () => {
    try {
      const [raw, home] = await Promise.all([AsyncStorage.getItem(PLACES_KEY), AsyncStorage.getItem(HOME_KEY)]);
      if (raw) set({ places: JSON.parse(raw) });
      if (home) set({ homeCountry: home });
    } catch {
      // keep empty list
    }
  },

  savePlace: (place) => {
    const existing = get().places.find((p) => samePlace(p, place));
    const entry: Place = { ...place, count: (existing?.count ?? 0) + 1, lastUsed: Date.now() };
    const updated = [entry, ...get().places.filter((p) => !samePlace(p, place))].slice(0, 12);
    set({ places: updated });
    AsyncStorage.setItem(PLACES_KEY, JSON.stringify(updated)).catch(() => {});
  },

  removePlace: (place) => {
    const updated = get().places.filter((p) => !samePlace(p, place));
    set({ places: updated });
    AsyncStorage.setItem(PLACES_KEY, JSON.stringify(updated)).catch(() => {});
  },
}));

/** The place that was showing when the app was last closed. */
export const loadLastPlace = async (): Promise<(Place & { isGps?: boolean }) | null> => {
  try {
    const raw = await AsyncStorage.getItem(LAST_PLACE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
