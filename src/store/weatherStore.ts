import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CurrentWeather, ForecastData, DailyForecast, SearchHistoryItem } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { backendService } from '../services/backendService';
import { DAYS } from '../constants';

interface WeatherState {
  // Data
  currentWeather: CurrentWeather | null;
  forecast: ForecastData | null;
  dailyForecast: DailyForecast[];
  hourlyForecast: HourlyForecastItem[];
  searchHistory: SearchHistoryItem[];
  recentCities: string[];

  // UI State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  unit: 'metric' | 'imperial';

  // Actions
  fetchWeatherByCity: (city: string) => Promise<void>;
  fetchWeatherByCoords: (lat: number, lon: number) => Promise<void>;
  refreshWeather: () => Promise<void>;
  loadSearchHistory: () => Promise<void>;
  addRecentCity: (city: string) => void;
  clearError: () => void;
  toggleUnit: () => void;
}

export interface HourlyForecastItem {
  time: string;
  temp: number;
  icon: string;
  pop?: number;
  condition: string;
}

const parseDailyForecast = (forecast: ForecastData): DailyForecast[] => {
  const dailyMap: Record<string, ForecastItem[]> = {};

  forecast.list.forEach((item: any) => {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyMap[date]) dailyMap[date] = [];
    dailyMap[date].push(item);
  });

  return Object.entries(dailyMap)
    .slice(0, 7)
    .map(([date, items]) => {
      const temps = items.map((i: any) => i.main.temp);
      const d = new Date(date);
      return {
        date,
        day: DAYS[d.getDay()],
        high: Math.round(Math.max(...temps)),
        low: Math.round(Math.min(...temps)),
        condition: items[Math.floor(items.length / 2)].weather[0],
        humidity: Math.round(items.reduce((sum: number, i: any) => sum + i.main.humidity, 0) / items.length),
      };
    });
};

const parseHourlyForecast = (forecast: ForecastData): HourlyForecastItem[] => {
  return forecast.list.slice(0, 12).map((item) => {
    const d = new Date(item.dt * 1000);
    const hour = d.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return {
      time: `${h12} ${ampm}`,
      temp: Math.round(item.main.temp),
      icon: item.weather[0]?.icon || '01d',
      condition: item.weather[0]?.main || 'Clear',
    };
  });
};

// Fix TS type
type ForecastItem = {
  dt: number;
  main: { temp: number; humidity: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  dt_txt: string;
};

export const useWeatherStore = create<WeatherState>((set, get) => ({
  currentWeather: null,
  forecast: null,
  dailyForecast: [],
  hourlyForecast: [],
  searchHistory: [],
  recentCities: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  unit: 'imperial',

  fetchWeatherByCity: async (city: string) => {
    set({ isLoading: true, error: null });
    try {
      const [current, forecast] = await Promise.all([
        weatherService.getCurrentWeatherByCity(city),
        weatherService.getForecastByCity(city),
      ]);

      const dailyForecast = parseDailyForecast(forecast);
      const hourlyForecast = parseHourlyForecast(forecast);

      set({
        currentWeather: current,
        forecast,
        dailyForecast,
        hourlyForecast,
        isLoading: false,
      });

      // Save to backend (VPS PostgreSQL)
      backendService.saveSearchHistory({
        city: current.name,
        country: current.sys.country,
        lat: current.coord.lat,
        lon: current.coord.lon,
      });

      // Save recent cities to AsyncStorage
      get().addRecentCity(city);

    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'City not found. Please try again.',
      });
    }
  },

  fetchWeatherByCoords: async (lat: number, lon: number) => {
    set({ isLoading: true, error: null });
    try {
      const [current, forecast] = await Promise.all([
        weatherService.getCurrentWeatherByCoords(lat, lon),
        weatherService.getForecastByCoords(lat, lon),
      ]);

      const dailyForecast = parseDailyForecast(forecast);
      const hourlyForecast = parseHourlyForecast(forecast);

      set({
        currentWeather: current,
        forecast,
        dailyForecast,
        hourlyForecast,
        isLoading: false,
      });

      backendService.logWeatherView(current.name, current.sys.country);

    } catch (error: any) {
      set({
        isLoading: false,
        error: 'Failed to fetch weather for your location.',
      });
    }
  },

  refreshWeather: async () => {
    const { currentWeather } = get();
    if (!currentWeather) return;
    set({ isRefreshing: true });
    try {
      await get().fetchWeatherByCoords(currentWeather.coord.lat, currentWeather.coord.lon);
    } finally {
      set({ isRefreshing: false });
    }
  },

  loadSearchHistory: async () => {
    try {
      // Try from VPS first
      const history = await backendService.getSearchHistory();
      if (history.length > 0) {
        set({ searchHistory: history });
        return;
      }

      // Fallback: local AsyncStorage
      const stored = await AsyncStorage.getItem('recent_cities');
      if (stored) {
        set({ recentCities: JSON.parse(stored) });
      }
    } catch {
      // fail silently
    }
  },

  addRecentCity: (city: string) => {
    const current = get().recentCities;
    const updated = [city, ...current.filter((c) => c.toLowerCase() !== city.toLowerCase())].slice(0, 10);
    set({ recentCities: updated });
    AsyncStorage.setItem('recent_cities', JSON.stringify(updated));
  },

  clearError: () => set({ error: null }),

  toggleUnit: () => {
    set((state) => ({ unit: state.unit === 'metric' ? 'imperial' : 'metric' }));
  },
}));
