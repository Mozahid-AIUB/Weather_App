import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';

const CHECK_EVERY_MS = 15 * 60 * 1000;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type Kind = 'storm' | 'rain' | 'snow' | 'heat' | 'cold' | 'wind' | 'brief';
type Severity = 'info' | 'warning' | 'severe';

interface Alert {
  id: string;
  kind: Kind;
  severity: Severity;
  title: string;
  body: string;
}

interface Forecast {
  offset: number;
  now: { temp: number; feels: number; code: number; wind: number; gust: number };
  hours: { time: string; temp: number; feels: number; code: number; pop: number; wind: number }[];
  today: { high: number; low: number };
}

// Which user preference governs each alert kind (matches the app's Settings toggles).
const PREF: Record<Exclude<Kind, 'brief'>, string> = { storm: 'storm', rain: 'rain', snow: 'rain', heat: 'temperature', cold: 'temperature', wind: 'wind' };

const isStorm = (c: number) => c >= 95;
const isRain = (c: number) => (c >= 51 && c <= 67) || (c >= 80 && c <= 82);
const isSnow = (c: number) => (c >= 71 && c <= 77) || c === 85 || c === 86;

const hourLabel = (localIso: string) => {
  const h = Number(localIso.slice(11, 13));
  return `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
};

/**
 * Every 15 minutes: fetches each registered phone's local forecast (Open-Meteo, no key),
 * pushes new storm / rain / snow / heat / cold / wind alerts, and the good-morning brief at
 * the user's chosen hour. Alert ids match the app's, so a phone never shows the same event twice.
 */
@Injectable()
export class PushService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(PushService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(@InjectRepository(Device) private readonly devices: Repository<Device>) {}

  onModuleInit() {
    setTimeout(() => this.run(), 60_000);
    this.timer = setInterval(() => this.run(), CHECK_EVERY_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run() {
    if (this.running) return;
    this.running = true;
    try {
      const all = await this.devices.find();
      const cache = new Map<string, Forecast | null>();
      const outgoing: { device: Device; alert: Alert }[] = [];

      for (const device of all) {
        const key = `${device.lat.toFixed(1)},${device.lon.toFixed(1)}`;
        if (!cache.has(key)) cache.set(key, await this.fetchForecast(device.lat, device.lon));
        const forecast = cache.get(key);
        if (!forecast) continue;

        for (const alert of this.alertsFor(device, forecast)) {
          if (!device.sentIds.includes(alert.id)) outgoing.push({ device, alert });
        }
      }

      if (outgoing.length) await this.send(outgoing);
      this.log.log(`Checked ${all.length} devices, sent ${outgoing.length} notifications`);
    } catch (e) {
      this.log.error(`Push run failed: ${(e as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  private async fetchForecast(lat: number, lon: number): Promise<Forecast | null> {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m' +
      '&hourly=temperature_2m,apparent_temperature,weather_code,precipitation_probability,wind_speed_10m' +
      '&daily=temperature_2m_max,temperature_2m_min&forecast_days=2&wind_speed_unit=ms&timezone=auto';
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) return null;
      const d = await res.json();
      const start = Math.max(0, (d.hourly.time as string[]).findIndex((t) => t >= d.current.time.slice(0, 13)));
      return {
        offset: d.utc_offset_seconds,
        now: {
          temp: d.current.temperature_2m,
          feels: d.current.apparent_temperature,
          code: d.current.weather_code,
          wind: d.current.wind_speed_10m,
          gust: d.current.wind_gusts_10m ?? 0,
        },
        hours: (d.hourly.time as string[]).slice(start, start + 18).map((time, i) => ({
          time,
          temp: d.hourly.temperature_2m[start + i],
          feels: d.hourly.apparent_temperature[start + i],
          code: d.hourly.weather_code[start + i],
          pop: d.hourly.precipitation_probability[start + i] ?? 0,
          wind: d.hourly.wind_speed_10m[start + i] ?? 0,
        })),
        today: { high: d.daily.temperature_2m_max[0], low: d.daily.temperature_2m_min[0] },
      };
    } catch {
      return null;
    }
  }

  private alertsFor(device: Device, f: Forecast): Alert[] {
    const place = device.place;
    const cityNow = new Date(Date.now() + f.offset * 1000);
    const day = cityNow.toISOString().slice(0, 10);
    const t = (c: number) => `${Math.round(device.unit === 'imperial' ? (c * 9) / 5 + 32 : c)}°`;
    const out: Alert[] = [];

    const next9 = f.hours.slice(1, 10);
    const next12 = f.hours.slice(1, 13);
    const stormSlot = next12.find((h) => isStorm(h.code));
    if (isStorm(f.now.code) || stormSlot) {
      out.push({
        id: `storm:${place}:${day}`,
        kind: 'storm',
        severity: 'severe',
        title: `Thunderstorm ${isStorm(f.now.code) ? 'over' : 'heading to'} ${place}`,
        body: isStorm(f.now.code)
          ? 'Lightning in the area right now. Stay indoors and away from open ground.'
          : `Storms expected around ${hourLabel(stormSlot!.time)}. Plan to be indoors by then.`,
      });
    } else {
      const rainSlot = next9.find((h) => isRain(h.code) || h.pop >= 60);
      if (isRain(f.now.code)) {
        out.push({ id: `rain:${place}:${day}`, kind: 'rain', severity: 'warning', title: `It's raining in ${place}`, body: 'Rain right now. Keep an umbrella close.' });
      } else if (rainSlot) {
        out.push({
          id: `rain:${place}:${day}`,
          kind: 'rain',
          severity: 'warning',
          title: `Rain likely around ${hourLabel(rainSlot.time)}`,
          body: `${rainSlot.pop > 0 ? `${rainSlot.pop}% chance of rain` : 'Showers expected'} in ${place}. Don't forget your umbrella.`,
        });
      }
    }

    const snowSlot = next9.find((h) => isSnow(h.code));
    if (isSnow(f.now.code) || snowSlot) {
      out.push({
        id: `snow:${place}:${day}`,
        kind: 'snow',
        severity: 'warning',
        title: isSnow(f.now.code) ? `Snowing in ${place}` : `Snow expected around ${hourLabel(snowSlot!.time)}`,
        body: 'Roads may be slippery. Dress warm and allow extra travel time.',
      });
    }

    if (f.now.feels >= 33) {
      const extreme = f.now.feels >= 38;
      out.push({
        id: `heat:${place}:${day}`,
        kind: 'heat',
        severity: extreme ? 'severe' : 'warning',
        title: extreme ? `Extreme heat in ${place}` : `Hot out there in ${place}`,
        body: `Feels like ${t(f.now.feels)}. Drink plenty of water and avoid the midday sun.`,
      });
    } else if (f.now.feels <= 5) {
      out.push({
        id: `cold:${place}:${day}`,
        kind: 'cold',
        severity: f.now.feels <= -5 ? 'severe' : 'warning',
        title: f.now.feels <= 0 ? `Freezing in ${place}` : `Cold day in ${place}`,
        body: `Feels like ${t(f.now.feels)}. Layer up before heading out.`,
      });
    }

    if (f.now.wind >= 9 || f.now.gust >= 14) {
      const strong = f.now.wind >= 14 || f.now.gust >= 20;
      const ms = Math.max(f.now.wind, f.now.gust);
      const speed = device.unit === 'imperial' ? `${Math.round(ms * 2.237)} mph` : `${Math.round(ms * 3.6)} km/h`;
      out.push({
        id: `wind:${place}:${day}`,
        kind: 'wind',
        severity: strong ? 'severe' : 'warning',
        title: strong ? `Strong winds in ${place}` : `Windy in ${place}`,
        body: `Gusts up to ${speed}. Secure loose items outdoors.`,
      });
    }

    // Respect the user's toggles, and keep the night quiet unless it's severe.
    const localHour = new Date(Date.now() + device.tzOffset * 60_000).getUTCHours();
    const quiet = localHour >= 22 || localHour < 7;
    const allowed = out.filter((a) => device.alerts?.[PREF[a.kind as Exclude<Kind, 'brief'>]] !== false && (!quiet || a.severity === 'severe'));

    const brief = this.morningBrief(device, f);
    return brief ? [...allowed, brief] : allowed;
  }

  /** Good-morning note at the user's chosen hour (their phone's local time), once a day. */
  private morningBrief(device: Device, f: Forecast): Alert | null {
    if (!device.morningBrief) return null;
    const local = new Date(Date.now() + device.tzOffset * 60_000);
    const hour = local.getUTCHours();
    const localDate = local.toISOString().slice(0, 10);
    if (hour < device.briefHour || hour >= device.briefHour + 2 || device.lastBriefDate === localDate) return null;

    const t = (c: number) => `${Math.round(device.unit === 'imperial' ? (c * 9) / 5 + 32 : c)}°`;
    const today = f.hours.filter((h) => h.time.slice(0, 10) === f.hours[0]?.time.slice(0, 10));
    const storm = today.find((h) => isStorm(h.code));
    const rain = today.find((h) => isRain(h.code) || h.pop >= 50);
    const snow = today.some((h) => isSnow(h.code));
    const maxFeels = Math.max(f.now.feels, ...today.map((h) => h.feels));
    const maxWind = Math.max(0, ...today.map((h) => h.wind));
    const cloudy = today.filter((h) => h.code >= 2 && h.code <= 3).length > today.length / 2;
    const place = device.place;
    const hi = t(f.today.high);
    const lo = t(f.today.low);

    const seed = [...localDate].reduce((n, c) => (n * 31 + c.charCodeAt(0)) | 0, 0);
    const name = (device.userName || '').trim().split(' ')[0];
    const you = name ? `, ${name}` : '';
    const greetings = [`Good morning${you} ☀️`, `Rise and shine${you} 🌤️`, `Morning${you}! Here's your day ☕`, `Hello${you}, a fresh day awaits 🌅`];
    const title = greetings[Math.abs(seed) % greetings.length];

    const outlook = storm
      ? `Stormy skies expected over ${place} today, up to ${hi}.`
      : snow
        ? `Snow is in the forecast for ${place}, ${lo} to ${hi}.`
        : rain
          ? `Showers are on the way in ${place}, with a high of ${hi}.`
          : cloudy
            ? `A soft, cloudy day in ${place}, between ${lo} and ${hi}.`
            : `A bright day in ${place}: ${hi} high, ${lo} low.`;

    const tips: string[] = [];
    if (storm) tips.push(`Thunderstorms likely around ${hourLabel(storm.time)}, so try to be indoors by then ⛈️`);
    else if (rain) tips.push(`Rain likely around ${hourLabel(rain.time)} (${Math.max(rain.pop, 50)}%), so take your umbrella ☂️`);
    if (maxFeels >= 35) tips.push(`It'll feel like ${t(maxFeels)}, so drink plenty of water 💧`);
    else if (f.today.low <= 8) tips.push('Chilly start, so grab a warm jacket 🧥');
    if (tips.length < 2 && maxWind >= 9) tips.push('Breezy out there today 🍃');
    if (!tips.length) tips.push('No umbrella needed today. Enjoy it 🌿');

    return { id: `brief:${localDate}`, kind: 'brief', severity: 'info', title, body: [outlook, ...tips.slice(0, 2)].join('\n') };
  }

  private async send(items: { device: Device; alert: Alert }[]) {
    for (let i = 0; i < items.length; i += 100) {
      const chunk = items.slice(i, i + 100);
      let tickets: { status: string; details?: { error?: string } }[] = [];
      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(
            chunk.map(({ device, alert }) => ({
              to: device.token,
              title: alert.title,
              body: alert.body,
              sound: 'default',
              channelId: 'weather-alerts',
              priority: alert.severity === 'severe' ? 'high' : 'default',
              data: { id: alert.id, kind: alert.kind, severity: alert.severity, city: device.place },
            })),
          ),
          signal: AbortSignal.timeout(15_000),
        });
        tickets = (await res.json()).data ?? [];
      } catch (e) {
        this.log.warn(`Expo push request failed: ${(e as Error).message}`);
        continue;
      }

      for (let j = 0; j < chunk.length; j++) {
        const { device, alert } = chunk[j];
        const ticket = tickets[j];
        if (ticket?.details?.error === 'DeviceNotRegistered') {
          await this.devices.delete({ id: device.id });
          continue;
        }
        if (ticket?.status !== 'ok') continue;
        device.sentIds = [alert.id, ...device.sentIds].slice(0, 60);
        if (alert.kind === 'brief') device.lastBriefDate = alert.id.slice('brief:'.length);
        await this.devices.update({ id: device.id }, { sentIds: device.sentIds, lastBriefDate: device.lastBriefDate });
      }
    }
  }
}
