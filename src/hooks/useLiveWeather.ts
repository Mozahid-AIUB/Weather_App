import { useEffect } from 'react';
import { AppState } from 'react-native';
import { loadLastPlace, useWeatherStore } from '../store/weatherStore';
import { useSettingsStore } from '../store/settingsStore';
import { useNotificationStore } from '../store/notificationStore';
import { buildEveningBrief, buildMorningBrief, DerivedAlert, deriveAlerts } from '../services/alertEngine';
import { notificationService } from '../services/notificationService';
import { conditionGroup } from '../utils/weather';
import { cityDateKey } from '../utils/format';
import { defaultPlace } from '../constants';

const REFRESH_EVERY_MS = 10 * 60 * 1000;
const STALE_AFTER_MS = 5 * 60 * 1000;
const CHANGE_WINDOW_MS = 3 * 60 * 60 * 1000;

/** Device-local Date for the next `hour`:00 (today if still ahead, otherwise tomorrow). */
const nextBriefTime = (hour: number) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
};

/** Turns the latest weather into alerts, the in-app morning brief and the scheduled one. */
const processUpdate = () => {
  const { place, current, forecast } = useWeatherStore.getState();
  if (!place || !current) return;
  const settings = useSettingsStore.getState();
  const notifications = useNotificationStore.getState();
  const tz = current.timezone;

  const prev = notifications.lastGroup[place.name];
  const alerts: DerivedAlert[] = deriveAlerts({
    place,
    current,
    forecast,
    unit: settings.unit,
    previousGroup: prev && Date.now() - prev.at < CHANGE_WINDOW_MS ? prev.group : undefined,
  });

  // Opened during the morning / evening and that message hasn't been shown yet.
  const hour = new Date().getHours();
  const todayKey = cityDateKey(current.dt, tz);
  const tomorrowKey = cityDateKey(current.dt + 86400, tz);
  const base = { place, forecast, unit: settings.unit, userName: settings.userName, tz };
  if (settings.morningBrief && hour >= settings.briefHour && hour < 12) {
    const brief = buildMorningBrief({ ...base, current, dateKey: todayKey });
    if (brief) alerts.push({ id: `brief:${todayKey}`, kind: 'brief', severity: 'info', ...brief, city: place.name });
  }
  if (settings.eveningBrief && hour >= settings.eveningHour && hour < 23) {
    const evening = buildEveningBrief({ ...base, tomorrowKey });
    if (evening) alerts.push({ id: `evening:${todayKey}`, kind: 'evening', severity: 'info', ...evening, city: place.name });
  }

  notifications.ingest(alerts);
  notifications.setLastGroup(place.name, conditionGroup(current.weather[0]?.id));

  // Keep the next morning and evening messages up to date with the newest forecast, so the OS
  // delivers them at the chosen hours even if the app is closed. Once this phone is registered,
  // the server sends them instead.
  if (!notificationService.canSchedule()) return;
  const keyAt = (at: Date, plusDays = 0) => cityDateKey(Math.floor(at.getTime() / 1000) + plusDays * 86400, tz);

  if (settings.morningBrief && !notifications.serverPush) {
    const at = nextBriefTime(settings.briefHour);
    const brief = buildMorningBrief({ ...base, current: null, dateKey: keyAt(at) });
    if (brief) notificationService.scheduleDaily('morning-brief', at, brief.title, brief.body);
  } else notificationService.cancelDaily('morning-brief');

  if (settings.eveningBrief && !notifications.serverPush) {
    const at = nextBriefTime(settings.eveningHour);
    const evening = buildEveningBrief({ ...base, tomorrowKey: keyAt(at, 1) });
    if (evening) notificationService.scheduleDaily('evening-brief', at, evening.title, evening.body);
  } else notificationService.cancelDaily('evening-brief');
};

/**
 * Boots the app (settings, saved data, GPS with fallbacks), keeps weather live with a
 * 10-minute refresh plus a refresh on return to the app, and raises alerts on every update.
 */
export const useLiveWeather = () => {
  const lastUpdated = useWeatherStore((s) => s.lastUpdated);
  const morningBrief = useSettingsStore((s) => s.morningBrief);
  const briefHour = useSettingsStore((s) => s.briefHour);
  const eveningBrief = useSettingsStore((s) => s.eveningBrief);
  const eveningHour = useSettingsStore((s) => s.eveningHour);

  useEffect(() => {
    (async () => {
      // Settings are already loaded by App before the first render.
      await Promise.all([useNotificationStore.getState().hydrate(), useWeatherStore.getState().hydratePlaces()]);
      const weather = useWeatherStore.getState();
      const last = await loadLastPlace();
      // Show the last place instantly; a GPS fix replaces it when it arrives.
      if (last) weather.loadPlace(last, { isGps: last.isGps });
      // The system location prompt appears only on the very first launch.
      const located = (await weather.locate('first-time')) === 'ok';
      if (!located && !last) await weather.loadPlace(defaultPlace());
    })();

    const timer = setInterval(() => useWeatherStore.getState().refresh({ silent: true }), REFRESH_EVERY_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const { lastUpdated: at } = useWeatherStore.getState();
      if (!at || Date.now() - at > STALE_AFTER_MS) useWeatherStore.getState().refresh({ silent: true });
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (lastUpdated) processUpdate();
  }, [lastUpdated, morningBrief, briefHour, eveningBrief, eveningHour]);
};
