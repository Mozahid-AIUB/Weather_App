import axios from 'axios';
import { SearchHistoryItem } from '../types/weather';
import { BACKEND_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: BACKEND_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const backendService = {
  /**
   * Save search history to PostgreSQL on VPS
   */
  saveSearchHistory: async (item: Omit<SearchHistoryItem, 'id' | 'searchedAt'>) => {
    try {
      const response = await api.post('/search-history', item);
      return response.data;
    } catch (error) {
      // Silent fail - don't block app if VPS is unreachable
      console.warn('Could not save search history to backend:', error);
      return null;
    }
  },

  /**
   * Get search history from PostgreSQL
   */
  getSearchHistory: async (): Promise<SearchHistoryItem[]> => {
    try {
      const response = await api.get('/search-history');
      return response.data;
    } catch (error) {
      console.warn('Could not fetch search history from backend:', error);
      return [];
    }
  },

  /**
   * Delete a search history item
   */
  deleteSearchHistory: async (id: string) => {
    try {
      await api.delete(`/search-history/${id}`);
    } catch (error) {
      console.warn('Could not delete search history:', error);
    }
  },

  /**
   * Log weather view analytics
   */
  logWeatherView: async (city: string, country: string) => {
    try {
      await api.post('/analytics/view', { city, country });
    } catch (error) {
      // Silent fail
    }
  },
};
