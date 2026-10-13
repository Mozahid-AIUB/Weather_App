import type { CurrentWeather, ForecastItem, Place } from '../types/weather';
import type { AlertKind, Unit } from '../store/settingsStore';
import { cityDateKey, formatHour, formatWind, toTemp, capitalize, greetingName } from '../utils/format';
import { conditionGroup, SkyCondition } from '../utils/weather';

export type Severity = 'info' | 'warning' | 'severe';

export interface DerivedAlert {
  /** Stable id — the same event on the same day never notifies twice. */
  id: string;
  kind: AlertKind;
  severity: Severity;
  title: string;
  body: string;
  city: string;
}

interface AlertInput {
  place: Place;
  current: CurrentWeather;
  forecast: ForecastItem[];
  unit: Unit;
  /** Condition group seen on the previous update for this place, for "weather changed" alerts. */
  previousGroup?: SkyCondition;
}

const isRain = (id: number) => id >= 300 && id < 600;
const isStorm = (id: number) => id >= 200 && id < 300;
const isSnow = (id: number) => id >= 600 && id < 700;

const GROUP_LABEL: Record<SkyCondition, string> = {
  clear: 'clear skies',
  partly: 'partly cloudy',
  cloudy: 'cloudy',
  rain: 'rain',
  storm: 'a thunderstorm',
  snow: 'snow',
  fog: 'fog',
};

/** Turns live conditions + the next hours of forecast into notification-worthy events. */
export const deriveAlerts = ({ place, current, forecast, unit, previousGroup }: AlertInput): DerivedAlert[] => {
  const city = place.name;
  const tz = current.timezone;
  const day = cityDateKey(current.dt, tz);
  const t = (c: number) => `${toTemp(c, unit)}°`;
  const nowId = current.weather[0]?.id ?? 800;
  const nowGroup = conditionGroup(nowId);
  const next12h = forecast.slice(0, 4);
  const next9h = forecast.slice(0, 3);
  const alerts: DerivedAlert[] = [];

  // Thunderstorms take priority over plain rain.
  const stormSlot = next12h.find((i) => isStorm(i.weather[0]?.id ?? 0));
  if (isStorm(nowId) || stormSlot) {
    alerts.push({
      id: `storm:${city}:${day}`,
      kind: 'storm',
      severity: 'severe',
      title: `Thunderstorm ${isStorm(nowId) ? 'over' : 'heading to'} ${city}`,
      body: isStorm(nowId)
        ? 'Lightning in the area right now. Stay indoors and away from open ground.'
        : `Storms expected around ${formatHour(stormSlot!.dt, tz)}. Plan to be indoors by then.`,
      city,
    });
  } else {
    const rainSlot = next9h.find((i) => isRain(i.weather[0]?.id ?? 0) || (i.pop ?? 0) >= 0.6);
    if (isRain(nowId)) {
      alerts.push({
        id: `rain:${city}:${day}`,
        kind: 'rain',
        severity: 'warning',
        title: `It's raining in ${city}`,
        body: `${capitalize(current.weather[0]?.description || 'Rain')} right now. Keep an umbrella close.`,
        city,
      });
    } else if (rainSlot) {
      const pct = Math.round((rainSlot.pop ?? 0) * 100);
      alerts.push({
        id: `rain:${city}:${day}`,
        kind: 'rain',
        severity: 'warning',
        title: `Rain likely around ${formatHour(rainSlot.dt, tz)}`,
        body: `${pct > 0 ? `${pct}% chance of rain` : 'Showers expected'} in ${city}. Don't forget your umbrella.`,
        city,
      });
    }
  }

  const snowSlot = next9h.find((i) => isSnow(i.weather[0]?.id ?? 0));
  if (isSnow(nowId) || snowSlot) {
    alerts.push({
      id: `snow:${city}:${day}`,
      kind: 'snow',
      severity: 'warning',
      title: isSnow(nowId) ? `Snowing in ${city}` : `Snow expected around ${formatHour(snowSlot!.dt, tz)}`,
      body: 'Roads may be slippery. Dress warm and allow extra travel time.',
      city,
    });
  }

  const feels = current.main.feels_like;
  if (feels >= 33) {
    const extreme = feels >= 38;
    alerts.push({
      id: `heat:${city}:${day}`,
      kind: 'heat',
      severity: extreme ? 'severe' : 'warning',
      title: extreme ? `Extreme heat in ${city}` : `Hot out there in ${city}`,
      body: `Feels like ${t(feels)}. Drink plenty of water and avoid the midday sun.`,
      city,
    });
  } else if (feels <= 5) {
    alerts.push({
      id: `cold:${city}:${day}`,
      kind: 'cold',
      severity: feels <= -5 ? 'severe' : 'warning',
      title: feels <= 0 ? `Freezing in ${city}` : `Cold day in ${city}`,
      body: `Feels like ${t(feels)}. Layer up before heading out.`,
      city,
    });
  }

  const gust = current.wind.gust ?? 0;
  const speed = current.wind.speed;
  if (speed >= 9 || gust >= 14) {
    const strong = speed >= 14 || gust >= 20;
    const w = formatWind(Math.max(speed, gust), unit);
    alerts.push({
      id: `wind:${city}:${day}`,
      kind: 'wind',
      severity: strong ? 'severe' : 'warning',
      title: strong ? `Strong winds in ${city}` : `Windy in ${city}`,
      body: `Gusts up to ${w.value} ${w.label}. Secure loose items outdoors.`,
      city,
    });
  }

  if (current.visibility < 1000 && nowGroup === 'fog') {
    alerts.push({
      id: `visibility:${city}:${day}`,
      kind: 'visibility',
      severity: 'warning',
      title: `Dense fog in ${city}`,
      body: `Visibility is under 1 km. Drive slowly and use low-beam headlights.`,
      city,
    });
  }

  if (previousGroup && previousGroup !== nowGroup) {
    alerts.push({
      id: `change:${city}:${current.dt}`,
      kind: 'change',
      severity: 'info',
      title: `Now ${GROUP_LABEL[nowGroup]} in ${city}`,
      body: `Conditions changed from ${GROUP_LABEL[previousGroup]}. It's ${t(current.main.temp)} right now.`,
      city,
    });
  }

  return alerts;
};

// ─── Morning brief ────────────────────────────────────────────────────────────

interface DayOutlook {
  high: number;
  low: number;
  feelsMax: number;
  windMax: number;
  group: SkyCondition;
  rainSlot?: ForecastItem;
  stormSlot?: ForecastItem;
  popMax: number;
}

const summarizeDay = (current: CurrentWeather | null, forecast: ForecastItem[], dateKey: string, tz?: number): DayOutlook | null => {
  const items = forecast.filter((i) => cityDateKey(i.dt, tz) === dateKey);
  if (!items.length && !current) return null;
  const temps = items.map((i) => i.main.temp);
  const feels = items.map((i) => i.main.feels_like);
  if (current && cityDateKey(current.dt, tz) === dateKey) {
    temps.push(current.main.temp);
    feels.push(current.main.feels_like);
  }

  // The most "significant" condition of the day wins: storm > snow > rain > clouds > clear.
  const rank: SkyCondition[] = ['clear', 'partly', 'fog', 'cloudy', 'rain', 'snow', 'storm'];
  const groups = items.map((i) => conditionGroup(i.weather[0]?.id));
  if (current) groups.push(conditionGroup(current.weather[0]?.id));
  const counts = groups.reduce<Record<string, number>>((acc, g) => ({ ...acc, [g]: (acc[g] || 0) + 1 }), {});
  const wet = (['storm', 'snow', 'rain'] as SkyCondition[]).find((g) => counts[g]);
  const dry = (Object.keys(counts) as SkyCondition[]).sort((a, b) => counts[b] - counts[a] || rank.indexOf(b) - rank.indexOf(a))[0];

  return {
    high: Math.max(...temps),
    low: Math.min(...temps),
    feelsMax: Math.max(...feels),
    windMax: Math.max(0, ...items.map((i) => i.wind.speed)),
    group: wet || dry || 'clear',
    rainSlot: items.find((i) => isRain(i.weather[0]?.id ?? 0) || (i.pop ?? 0) >= 0.5),
    stormSlot: items.find((i) => isStorm(i.weather[0]?.id ?? 0)),
    popMax: Math.max(0, ...items.map((i) => i.pop ?? 0)),
  };
};

const pick = <T,>(options: T[], seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return options[Math.abs(h) % options.length];
};

export interface MorningBriefInput {
  place: Place;
  current: CurrentWeather | null;
  forecast: ForecastItem[];
  unit: Unit;
  userName: string;
  /** City-local date (YYYY-MM-DD) the brief describes. */
  dateKey: string;
  tz?: number;
}

/**
 * Writes a short, friendly good-morning note from the day's real forecast: what the sky will
 * do, when rain is likely, and the one or two things worth carrying. Phrasing rotates by date.
 */
export const buildMorningBrief = ({ place, current, forecast, unit, userName, dateKey, tz }: MorningBriefInput) => {
  const o = summarizeDay(current, forecast, dateKey, tz);
  if (!o) return null;
  const name = greetingName(userName);
  const you = name ? `, ${name}` : '';
  const city = place.name;
  const hi = `${toTemp(o.high, unit)}°`;
  const lo = `${toTemp(o.low, unit)}°`;

  const title = pick(
    [`Good morning${you} ☀️`, `Rise and shine${you} 🌤️`, `Morning${you}! Here's your day ☕`, `Hello${you}, a fresh day awaits 🌅`],
    dateKey
  );

  const outlook: Record<SkyCondition, string> = {
    clear: `A bright, sunny day in ${city}: ${hi} high, ${lo} low.`,
    partly: `Sun and clouds share the sky over ${city} today, peaking at ${hi}.`,
    cloudy: `A soft, cloudy day in ${city}, between ${lo} and ${hi}.`,
    rain: `Showers are on the way in ${city}, with a high of ${hi}.`,
    storm: `Stormy skies expected over ${city} today, up to ${hi}.`,
    snow: `Snow is in the forecast for ${city}, ${lo} to ${hi}.`,
    fog: `A misty start in ${city}, warming up to ${hi}.`,
  };

  const tips: string[] = [];
  if (o.stormSlot) tips.push(`Thunderstorms likely around ${formatHour(o.stormSlot.dt, tz)}, so try to be indoors by then ⛈️`);
  else if (o.rainSlot) tips.push(`Rain likely around ${formatHour(o.rainSlot.dt, tz)} (${Math.round(Math.max(o.popMax, 0.5) * 100)}%), so take your umbrella ☂️`);
  if (o.feelsMax >= 35) tips.push(`It'll feel like ${toTemp(o.feelsMax, unit)}°, so drink plenty of water 💧`);
  else if (o.low <= 8) tips.push('Chilly start, so grab a warm jacket 🧥');
  if (tips.length < 2 && o.windMax >= 9) {
    const w = formatWind(o.windMax, unit);
    tips.push(`Breezy out there, up to ${w.value} ${w.label} 🍃`);
  }
  if (tips.length < 2 && (o.group === 'clear' || o.group === 'partly') && o.high >= 26) tips.push('Sunscreen is a good idea today 🧴');
  if (!tips.length) {
    tips.push(pick(['No umbrella needed today. Enjoy it 🌿', 'A lovely day to get outside 😊', 'Easy weather for whatever you have planned ✨'], dateKey + city));
  }

  return { title, body: [outlook[o.group], ...tips.slice(0, 2)].join('\n') };
};
