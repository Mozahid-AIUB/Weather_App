export interface WeatherMain {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  pressure: number;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface Wind {
  speed: number;
  deg: number;
  gust?: number;
}

export interface CurrentWeather {
  name: string;
  dt: number;
  /** Shift in seconds from UTC for the location. */
  timezone?: number;
  main: WeatherMain;
  weather: WeatherCondition[];
  wind: Wind;
  visibility: number;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  coord: {
    lat: number;
    lon: number;
  };
}

export interface ForecastItem {
  dt: number;
  main: WeatherMain;
  weather: WeatherCondition[];
  wind: Wind;
  /** Probability of precipitation, 0–1. */
  pop?: number;
  dt_txt: string;
}

export interface ForecastData {
  list: ForecastItem[];
  city: {
    name: string;
    country: string;
    timezone?: number;
  };
}

export interface Place {
  name: string;
  country: string;
  /** Wider context under the name, e.g. "Dhaka, Bangladesh". */
  region?: string;
  lat: number;
  lon: number;
  /** How many times the user picked this place, and when last (saved places only). */
  count?: number;
  lastUsed?: number;
}

export interface HourlyItem {
  dt: number;
  temp: number;
  icon: string;
  pop: number;
  isNow: boolean;
}

export interface DailyItem {
  dateKey: string;
  dt: number;
  high: number;
  low: number;
  icon: string;
  conditionId: number;
  description: string;
  pop: number;
}

export interface SearchHistoryItem {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  searchedAt: string;
}
