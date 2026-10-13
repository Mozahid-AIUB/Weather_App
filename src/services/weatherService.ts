import axios from 'axios';
import { CurrentWeather, ForecastData, ForecastItem, Place } from '../types/weather';
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
  if ([51, 53, 55, 56, 57].includes(code)) return { id: 300, main: 'Drizzle', description: 'Drizzle', icon: `09${d}` };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { id: 500, main: 'Rain', description: 'Rain showers', icon: `10${d}` };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { id: 600, main: 'Snow', description: 'Snowfall', icon: `13${d}` };
  if ([95, 96, 99].includes(code)) return { id: 200, main: 'Thunderstorm', description: 'Thunderstorm', icon: `11${d}` };
  return { id: 800, main: 'Clear', description: 'Clear sky', icon: `01${d}` };
};

// Open-Meteo fallback fetcher with automatic reverse-geocoding.
// Open-Meteo returns wall-clock times for the location (timezone=auto), so they are
// converted back to real unix seconds with utc_offset_seconds.
const fetchOpenMeteo = async (lat: number, lon: number, cityName: string = '', country: string = '') => {
  let resolvedCity = cityName;
  let resolvedCountry = country;

  if (!cityName) {
    try {
      const geo = await axios.get(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        { timeout: 3500 }
      );
      if (geo.data) {
        resolvedCity = geo.data.city || geo.data.locality || geo.data.principalSubdivision || 'My Location';
        resolvedCountry = geo.data.countryCode || country;
      }
    } catch {
      resolvedCity = 'My Location';
    }
  }

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility' +
    '&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation_probability,is_day' +
    '&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset' +
    '&wind_speed_unit=ms&forecast_days=7&timezone=auto';
  const res = await axios.get(url, { timeout: 10000 });
  const data = res.data;
  const offset: number = data.utc_offset_seconds ?? 0;
  const toUnix = (local: string) => Math.floor(Date.parse(`${local}Z`) / 1000) - offset;

  const current = data.current;
  const now = Math.floor(Date.now() / 1000);

  const currentWeather: CurrentWeather = {
    name: resolvedCity,
    dt: now,
    timezone: offset,
    main: {
      temp: current.temperature_2m,
      feels_like: current.apparent_temperature,
      temp_min: data.daily?.temperature_2m_min?.[0] ?? current.temperature_2m - 3,
      temp_max: data.daily?.temperature_2m_max?.[0] ?? current.temperature_2m + 4,
      humidity: current.relative_humidity_2m,
      pressure: Math.round(current.surface_pressure),
    },
    weather: [mapWmoToWeather(current.weather_code, current.is_day === 1)],
    wind: {
      speed: current.wind_speed_10m,
      deg: current.wind_direction_10m,
      gust: current.wind_gusts_10m,
    },
    visibility: Math.min(current.visibility ?? 10000, 10000),
    sys: {
      country: resolvedCountry,
      sunrise: data.daily?.sunrise?.[0] ? toUnix(data.daily.sunrise[0]) : now - 20000,
      sunset: data.daily?.sunset?.[0] ? toUnix(data.daily.sunset[0]) : now + 20000,
    },
    coord: { lat, lon },
  };

  // Convert hourly data into the OpenWeather 3-hour forecast list format, starting from now.
  const list: ForecastItem[] = [];
  const times: string[] = data.hourly?.time || [];
  const firstIndex = Math.max(0, times.findIndex((t) => toUnix(t) >= now - 1800));
  for (let i = firstIndex + 3; i < times.length && list.length < 40; i += 3) {
    const temp = data.hourly.temperature_2m[i];
    list.push({
      dt: toUnix(times[i]),
      main: {
        temp,
        feels_like: data.hourly.apparent_temperature?.[i] ?? temp,
        temp_min: temp,
        temp_max: temp,
        humidity: data.hourly.relative_humidity_2m[i],
        pressure: 1013,
      },
      weather: [mapWmoToWeather(data.hourly.weather_code[i], data.hourly.is_day?.[i] !== 0)],
      wind: {
        speed: data.hourly.wind_speed_10m[i] ?? 0,
        deg: data.hourly.wind_direction_10m?.[i] ?? 0,
      },
      pop: (data.hourly.precipitation_probability?.[i] ?? 0) / 100,
      dt_txt: times[i].replace('T', ' ') + ':00',
    });
  }

  const forecast: ForecastData = {
    list,
    city: { name: resolvedCity, country: resolvedCountry, timezone: offset },
  };

  return { currentWeather, forecast };
};

export const weatherService = {
  /**
   * Current conditions + 5-day forecast for a coordinate. Tries OpenWeather first and
   * falls back to Open-Meteo (no key needed) if the key is missing, pending or rate-limited.
   */
  getWeather: async (lat: number, lon: number): Promise<{ current: CurrentWeather; forecast: ForecastData }> => {
    try {
      const params = { lat, lon, appid: OPENWEATHER_API_KEY, units: 'metric' };
      const [current, forecast] = await Promise.all([
        api.get<CurrentWeather>('/weather', { params }),
        api.get<ForecastData>('/forecast', { params: { ...params, cnt: 40 } }),
      ]);
      return { current: current.data, forecast: forecast.data };
    } catch {
      const { currentWeather, forecast } = await fetchOpenMeteo(lat, lon);
      return { current: currentWeather, forecast };
    }
  },

  /** Current conditions only — used for the saved places list. */
  getCurrent: async (lat: number, lon: number): Promise<CurrentWeather> => {
    try {
      const res = await api.get<CurrentWeather>('/weather', {
        params: { lat, lon, appid: OPENWEATHER_API_KEY, units: 'metric' },
        timeout: 6000,
      });
      return res.data;
    } catch {
      const { currentWeather } = await fetchOpenMeteo(lat, lon, ' ');
      return currentWeather;
    }
  },

  /**
   * Search places down to town / upazila / village level. Open-Meteo (GeoNames) covers small
   * populated places and gives district + state; OpenWeather geocoding is the fallback.
   */
  searchPlaces: async (query: string): Promise<Place[]> => {
    const join = (parts: (string | undefined)[], name: string) => {
      const seen = new Set([name.toLowerCase()]);
      return parts
        .filter((p): p is string => !!p && !seen.has(p.toLowerCase()) && !!seen.add(p.toLowerCase()))
        .join(', ');
    };

    try {
      const geoRes = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        params: { name: query, count: 8, language: 'en', format: 'json' },
        timeout: 5000,
      });
      if (geoRes.data?.results?.length) {
        return geoRes.data.results.map((r: any) => ({
          name: r.name,
          lat: r.latitude,
          lon: r.longitude,
          country: r.country_code?.toUpperCase() || '',
          region: join([r.admin2, r.admin1, r.country], r.name),
        }));
      }
    } catch {
      // fall back to OpenWeather geocoding
    }

    try {
      const response = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
        params: { q: query, limit: 6, appid: OPENWEATHER_API_KEY },
        timeout: 4000,
      });
      if (Array.isArray(response.data)) {
        return response.data.map((r: any) => ({
          name: r.name,
          lat: r.lat,
          lon: r.lon,
          country: r.country || '',
          region: join([r.state, r.country], r.name),
        }));
      }
    } catch {
      // ignore
    }
    return [];
  },
};
