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
  dt_txt: string;
}

export interface ForecastData {
  list: ForecastItem[];
  city: {
    name: string;
    country: string;
  };
}

export interface DailyForecast {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: WeatherCondition;
  humidity: number;
}

export interface SearchHistoryItem {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  searchedAt: string;
}
