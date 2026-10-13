import type { Unit } from '../store/settingsStore';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Follow the device's clock style: 24-hour across most of Europe, 12-hour in the US and Bangladesh.
const USE_24H = (() => {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 === false;
  } catch {
    return false;
  }
})();

export const toTemp = (celsius: number | undefined | null, unit: Unit): number => {
  if (celsius === undefined || celsius === null || Number.isNaN(celsius)) return 0;
  return Math.round(unit === 'imperial' ? (celsius * 9) / 5 + 32 : celsius);
};

export const formatTemp = (celsius: number | undefined | null, unit: Unit) => `${toTemp(celsius, unit)}°`;

export const formatWind = (ms: number = 0, unit: Unit) =>
  unit === 'imperial'
    ? { value: Math.round(ms * 2.237), label: 'mph' }
    : { value: Math.round(ms * 3.6), label: 'km/h' };

export const formatPressure = (hpa: number = 1013, unit: Unit) =>
  unit === 'imperial'
    ? { value: (hpa * 0.02953).toFixed(2), label: 'inHg' }
    : { value: String(Math.round(hpa)), label: 'hPa' };

export const formatVisibility = (meters: number = 10000, unit: Unit) =>
  unit === 'imperial'
    ? { value: (meters / 1609.34).toFixed(meters < 1609 ? 1 : 0), label: 'mi' }
    : { value: (meters / 1000).toFixed(meters < 1000 ? 1 : 0), label: 'km' };

export const compassDir = (deg: number = 0) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
};

/**
 * A Date whose UTC fields hold the wall-clock time at the location.
 * Read it with getUTC* methods. Falls back to device time when the offset is unknown.
 */
export const cityDate = (unixSeconds: number, tzOffset?: number) => {
  if (tzOffset === undefined) {
    const local = new Date(unixSeconds * 1000);
    return new Date(local.getTime() - local.getTimezoneOffset() * 60000);
  }
  return new Date((unixSeconds + tzOffset) * 1000);
};

export const cityDateKey = (unixSeconds: number, tzOffset?: number) => cityDate(unixSeconds, tzOffset).toISOString().slice(0, 10);

export const cityHour = (unixSeconds: number, tzOffset?: number) => cityDate(unixSeconds, tzOffset).getUTCHours();

export const formatHour = (unixSeconds: number, tzOffset?: number) => {
  const h = cityHour(unixSeconds, tzOffset);
  if (USE_24H) return `${h.toString().padStart(2, '0')}:00`;
  return `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const formatClock = (unixSeconds: number, tzOffset?: number) => {
  if (!unixSeconds) return '--:--';
  const d = cityDate(unixSeconds, tzOffset);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  if (USE_24H) return `${h.toString().padStart(2, '0')}:${m}`;
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const formatWeekday = (unixSeconds: number, tzOffset?: number) => DAY_NAMES[cityDate(unixSeconds, tzOffset).getUTCDay()];

export const formatLongDate = (unixSeconds: number, tzOffset?: number) => {
  const d = cityDate(unixSeconds, tzOffset);
  return `${DAY_NAMES[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;
};

export const formatDuration = (seconds: number) => {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const timeAgo = (timestampMs: number | null, nowMs: number = Date.now()) => {
  if (!timestampMs) return 'never';
  const diff = Math.max(0, Math.round((nowMs - timestampMs) / 1000));
  if (diff < 45) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
};

export const capitalize = (text: string = '') =>
  text
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

/** Dew point (°C) via the Magnus formula. */
export const dewPoint = (tempC: number, humidity: number) => {
  const a = 17.62;
  const b = 243.12;
  const gamma = Math.log(Math.max(humidity, 1) / 100) + (a * tempC) / (b + tempC);
  return (b * gamma) / (a - gamma);
};

/** "BD" → "Bangladesh" where the runtime supports it, otherwise the code. */
export const countryName = (code: string = '') => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
};

/** Tidies a typed name: trims, collapses spaces and drops trailing punctuation ("MOZAHID. " → "MOZAHID"). */
export const cleanName = (raw: string = '') => raw.replace(/\s+/g, ' ').trim().replace(/[.,!?;:]+$/, '').trim();

/** First name for greetings; an all-caps name is shown in title case ("MOZAHID" → "Mozahid"). */
export const greetingName = (raw: string = '') => {
  const first = cleanName(raw).split(' ')[0] || '';
  if (first.length > 1 && first === first.toUpperCase() && first !== first.toLowerCase()) {
    return first[0] + first.slice(1).toLowerCase();
  }
  return first;
};

/** Full name for display, with all-caps words in title case ("MOZAHID ISLAM" → "Mozahid Islam"). */
export const prettyName = (raw: string = '') =>
  cleanName(raw)
    .split(' ')
    .map((w) => (w.length > 1 && w === w.toUpperCase() && w !== w.toLowerCase() ? w[0] + w.slice(1).toLowerCase() : w))
    .join(' ');
