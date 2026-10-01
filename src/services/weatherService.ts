import axios from 'axios';
import { CurrentWeather, ForecastData } from '../types/weather';
import { OPENWEATHER_API_KEY, OPENWEATHER_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: OPENWEATHER_BASE_URL,
  timeout: 10000,
});

// Weather code mapping for Open-Meteo fallback
const mapWmoToWeather = (code: number, isDay: boolean = true) => {
  const d = isDay ? 'd' : 'n';
  if (code === 0) return { id: 800, main: 'Clear', description: 'Clear sky', icon: `01${d}` };
  if (code === 1) return { id: 801, main: 'Mainly Clear', description: 'Mainly clear', icon: `02${d}` };
  if (code === 2) return { id: 802, main: 'Partly Cloudy', description: 'Partly cloudy', icon: `03${d}` };
  if (code === 3) return { id: 804, main: 'Overcast', description: 'Overcast', icon: `04${d}` };
  if ([45, 48].includes(code)) return { id: 741, main: 'Fog', description: 'Foggy', icon: `50${d}` };
  if ([51, 53, 55].includes(code)) return { id: 300, main: 'Drizzle', description: 'Drizzle', icon: `09${d}` };
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { id: 500, main: 'Rain', description: 'Rain showers', icon: `10${d}` };
  if ([71, 73, 75, 85, 86].includes(code)) return { id: 600, main: 'Snow', description: 'Snowfall', icon: `13${d}` };
  if ([95, 96, 99].includes(code)) return { id: 200, main: 'Thunderstorm', description: 'Thunderstorm', icon: `11${d}` };
  return { id: 800, main: 'Clear', description: 'Clear sky', icon: `01${d}` };
};

// Open-Meteo fallback fetcher
const fetchOpenMeteo = async (lat: number, lon: number, cityName: string = 'Current Location', country: string = 'BD') => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
  const res = await axios.get(url);
  const data = res.data;

  const current = data.current;
  const isDay = current.is_day === 1;
  const weatherCond = mapWmoToWeather(current.weather_code, isDay);

  const currentWeather: CurrentWeather = {
    name: cityName,
    dt: Math.floor(Date.now() / 1000),
    main: {
      temp: current.temperature_2m,
      feels_like: current.apparent_temperature,
      temp_min: data.daily?.temperature_2m_min?.[0] ?? current.temperature_2m - 3,
      temp_max: data.daily?.temperature_2m_max?.[0] ?? current.temperature_2m + 4,
      humidity: current.relative_humidity_2m,
      pressure: Math.round(current.surface_pressure),
    },
    weather: [weatherCond],
    wind: {
      speed: current.wind_speed_10m,
      deg: current.wind_direction_10m,
    },
    visibility: 10000,
    sys: {
      country: country,
      sunrise: data.daily?.sunrise?.[0] ? Math.floor(new Date(data.daily.sunrise[0]).getTime() / 1000) : Math.floor(Date.now() / 1000) - 20000,
      sunset: data.daily?.sunset?.[0] ? Math.floor(new Date(data.daily.sunset[0]).getTime() / 1000) : Math.floor(Date.now() / 1000) + 20000,
    },
    coord: { lat, lon },
  };

  // Convert hourly / daily into 5-day forecast list format
  const list = [];
  const times = data.hourly?.time || [];
  for (let i = 0; i < Math.min(times.length, 40); i += 3) {
    const timeStr = times[i];
    const wCode = data.hourly.weather_code[i];
    const itemWeather = mapWmoToWeather(wCode, true);
    list.push({
      dt: Math.floor(new Date(timeStr).getTime() / 1000),
      main: {
        temp: data.hourly.temperature_2m[i],
        feels_like: data.hourly.temperature_2m[i],
        temp_min: data.hourly.temperature_2m[i] - 1,
        temp_max: data.hourly.temperature_2m[i] + 1,
        humidity: data.hourly.relative_humidity_2m[i],
        pressure: 1013,
      },
      weather: [itemWeather],
      wind: {
        speed: data.hourly.wind_speed_10m[i] || 3,
        deg: 180,
      },
      dt_txt: timeStr.replace('T', ' ') + ':00',
    });
  }

  const forecast: ForecastData = {
    list,
    city: {
      name: cityName,
      country: country,
    },
  };

  return { currentWeather, forecast };
};

export const weatherService = {
  /**
   * Get current weather by city name
   */
  getCurrentWeatherByCity: async (city: string): Promise<CurrentWeather> => {
    try {
      const response = await api.get('/weather', {
        params: {
          q: city,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
        },
      });
      return response.data;
    } catch (err: any) {
      // If 401 (API key pending activation) or other error, fallback to geocoding + Open-Meteo
      const geo = await weatherService.searchCities(city);
      if (geo && geo.length > 0) {
        const item = geo[0];
        const { currentWeather } = await fetchOpenMeteo(item.lat, item.lon, item.name, item.country);
        return currentWeather;
      }
      throw err;
    }
  },

  /**
   * Get current weather by coordinates
   */
  getCurrentWeatherByCoords: async (lat: number, lon: number): Promise<CurrentWeather> => {
    try {
      const response = await api.get('/weather', {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
        },
      });
      return response.data;
    } catch (err: any) {
      const { currentWeather } = await fetchOpenMeteo(lat, lon, 'Your Location', 'BD');
      return currentWeather;
    }
  },

  /**
   * Get 5-day forecast by city name
   */
  getForecastByCity: async (city: string): Promise<ForecastData> => {
    try {
      const response = await api.get('/forecast', {
        params: {
          q: city,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
          cnt: 40,
        },
      });
      return response.data;
    } catch (err: any) {
      const geo = await weatherService.searchCities(city);
      if (geo && geo.length > 0) {
        const item = geo[0];
        const { forecast } = await fetchOpenMeteo(item.lat, item.lon, item.name, item.country);
        return forecast;
      }
      throw err;
    }
  },

  /**
   * Get 5-day forecast by coordinates
   */
  getForecastByCoords: async (lat: number, lon: number): Promise<ForecastData> => {
    try {
      const response = await api.get('/forecast', {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
          cnt: 40,
        },
      });
      return response.data;
    } catch (err: any) {
      const { forecast } = await fetchOpenMeteo(lat, lon, 'Your Location', 'BD');
      return forecast;
    }
  },

  /**
   * Search cities (geocoding API with fallback)
   */
  searchCities: async (query: string) => {
    try {
      const response = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
        params: {
          q: query,
          limit: 6,
          appid: OPENWEATHER_API_KEY,
        },
        timeout: 4000,
      });
      if (response.data && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // fallback to open-meteo geocoding
    }

    try {
      const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
      if (geoRes.data?.results) {
        return geoRes.data.results.map((r: any) => ({
          name: r.name,
          lat: r.latitude,
          lon: r.longitude,
          country: r.country_code?.toUpperCase() || r.country || '',
          state: r.admin1 || '',
        }));
      }
    } catch {
      // ignore
    }
    return [];
  },
};
