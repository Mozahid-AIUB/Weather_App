import type { CurrentWeather } from '../types/weather';

export type SkyCondition = 'clear' | 'partly' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';

/** Groups an OpenWeather condition id (https://openweathermap.org/weather-conditions). */
export const conditionGroup = (id: number = 800): SkyCondition => {
  if (id >= 200 && id < 300) return 'storm';
  if (id >= 300 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'fog';
  if (id === 800) return 'clear';
  if (id === 801 || id === 802) return 'partly';
  return 'cloudy';
};

/** Same grouping from an icon code such as "10d". */
export const iconGroup = (icon: string = '01d'): SkyCondition => {
  const code = icon.slice(0, 2);
  switch (code) {
    case '01':
      return 'clear';
    case '02':
      return 'partly';
    case '03':
    case '04':
      return 'cloudy';
    case '09':
    case '10':
      return 'rain';
    case '11':
      return 'storm';
    case '13':
      return 'snow';
    case '50':
      return 'fog';
    default:
      return 'clear';
  }
};

export const isNightIcon = (icon: string = '01d') => icon.endsWith('n');

/** True when the sun is up at the location right now. */
export const isDaytime = (weather: CurrentWeather | null, nowMs: number = Date.now()) => {
  const now = nowMs / 1000;
  if (weather?.sys?.sunrise && weather.sys.sunset) {
    return now >= weather.sys.sunrise && now < weather.sys.sunset;
  }
  if (weather?.weather?.[0]?.icon) return !isNightIcon(weather.weather[0].icon);
  const hour = new Date(nowMs).getHours();
  return hour >= 6 && hour < 18;
};
