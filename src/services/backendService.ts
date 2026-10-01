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

export const backendService = {
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
    try {
      const response = await api.post('/search-history', item);
      return response.data;
    } catch {
      // Backend optional / offline mode - silent fallback
      return newItem;
    }
  },

  /**
   * Get search history from local storage with fallback
   */
  getSearchHistory: async (): Promise<SearchHistoryItem[]> => {
    // 1. Try local storage first for instant response
    let localItems: SearchHistoryItem[] = [];
    try {
      const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        localItems = JSON.parse(stored);
      }
    } catch {
      localItems = [];
    }

    // 2. Try remote sync if backend is active
    try {
      const response = await api.get('/search-history');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // Backend not running / offline - return local items smoothly
    }

    return localItems;
  },

  /**
   * Delete a search history item
   */
  deleteSearchHistory: async (id: string) => {
    try {
      const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const list: SearchHistoryItem[] = JSON.parse(stored);
        const updated = list.filter((i) => i.id !== id);
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {
      // Ignore
    }

    try {
      await api.delete(`/search-history/${id}`);
    } catch {
      // Ignore
    }
  },

  /**
   * Log weather view analytics (silent)
   */
  logWeatherView: async (city: string, country: string) => {
    try {
      await api.post('/analytics/view', { city, country });
    } catch {
      // Silent fail
    }
  },
};
