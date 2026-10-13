import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchHistoryItem } from '../types/weather';
import { BACKEND_BASE_URL } from '../constants';

const LOCAL_STORAGE_KEY = '@weathernow_search_history_v1';

const api = axios.create({
  baseURL: BACKEND_BASE_URL,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** False until a real backend URL is configured (placeholder or localhost is skipped). */
export const backendConfigured = !/YOUR_VPS_IP|localhost|127\.0\.0\.1/.test(BACKEND_BASE_URL);

export interface DeviceRegistration {
  token: string;
  lat: number;
  lon: number;
  place: string;
  unit: 'metric' | 'imperial';
  userName: string;
  morningBrief: boolean;
  briefHour: number;
  tzOffset: number;
  alerts: Record<'storm' | 'rain' | 'temperature' | 'wind', boolean>;
}

export const backendService = {
  /** Registers this phone for server-sent alerts and the morning brief. */
  registerDevice: async (reg: DeviceRegistration): Promise<boolean> => {
    if (!backendConfigured) return false;
    try {
      await api.post('/devices', reg, { timeout: 8000 });
      return true;
    } catch {
      return false;
    }
  },

  unregisterDevice: async (token: string) => {
    if (!backendConfigured) return;
    await api.post('/devices/unregister', { token }).catch(() => {});
  },

  /**
   * Save search history to local storage with optional backend sync
   */
  saveSearchHistory: async (item: Omit<SearchHistoryItem, 'id' | 'searchedAt'>) => {
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      city: item.city,
      country: item.country,
      lat: item.lat,
      lon: item.lon,
      searchedAt: new Date().toISOString(),
    };

    // 1. Save to local AsyncStorage immediately
    try {
      const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      const list: SearchHistoryItem[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((i) => i.city.toLowerCase() !== item.city.toLowerCase());
      const updated = [newItem, ...filtered].slice(0, 20);
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore local storage error
    }

    // 2. Opportunistically sync with backend if available
    if (!backendConfigured) return newItem;
    try {
      const response = await api.post('/search-history', item);
      return response.data;
    } catch {
      // Backend optional / offline mode - silent fallback
      return newItem;
    }
  },

  /**
   * Log weather view analytics (silent)
   */
  logWeatherView: async (city: string, country: string) => {
    if (!backendConfigured) return;
    try {
      await api.post('/analytics/view', { city, country });
    } catch {
      // Silent fail
    }
  },
};
