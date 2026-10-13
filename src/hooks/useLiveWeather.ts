import { useEffect } from 'react';
import { AppState } from 'react-native';
import { loadLastPlace, useWeatherStore } from '../store/weatherStore';
import { useSettingsStore } from '../store/settingsStore';
import { useNotificationStore } from '../store/notificationStore';
import { buildMorningBrief, DerivedAlert, deriveAlerts } from '../services/alertEngine';
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

  // Opened during the morning and today's brief hasn't been shown yet.
  const hour = new Date().getHours();
  if (settings.morningBrief && hour >= settings.briefHour && hour < 12) {
    const dateKey = cityDateKey(current.dt, tz);
    const brief = buildMorningBrief({ place, current, forecast, unit: settings.unit, userName: settings.userName, dateKey, tz });
    if (brief) alerts.push({ id: `brief:${dateKey}`, kind: 'brief', severity: 'info', ...brief, city: place.name });
  }

  notifications.ingest(alerts);
  notifications.setLastGroup(place.name, conditionGroup(current.weather[0]?.id));

  // Keep the next morning's push up to date with the newest forecast, so the OS can deliver
  // it at the chosen hour even if the app is closed.
  if (!notificationService.canSchedule()) return;
  if (!settings.morningBrief) {
    notificationService.cancelMorningBrief();
    return;
  }
  const at = nextBriefTime(settings.briefHour);
  const brief = buildMorningBrief({
    place,
    current: null,
    forecast,
    unit: settings.unit,
    userName: settings.userName,
    dateKey: cityDateKey(Math.floor(at.getTime() / 1000), tz),
    tz,
  });
  if (brief) notificationService.scheduleMorningBrief(at, brief.title, brief.body);
};

/**
 * Boots the app (settings, saved data, GPS with fallbacks), keeps weather live with a
 * 10-minute refresh plus a refresh on return to the app, and raises alerts on every update.
 */
export const useLiveWeather = () => {
  const lastUpdated = useWeatherStore((s) => s.lastUpdated);
  const morningBrief = useSettingsStore((s) => s.morningBrief);
  const briefHour = useSettingsStore((s) => s.briefHour);

  useEffect(() => {
    (async () => {
      // Settings are already loaded by App before the first render.
      await Promise.all([useNotificationStore.getState().hydrate(), useWeatherStore.getState().hydratePlaces()]);
      const weather = useWeatherStore.getState();
      const last = await loadLastPlace();
      // Show the last place instantly; a GPS fix replaces it when it arrives.
      if (last) weather.loadPlace(last, { isGps: last.isGps });
      const located = await weather.locate();
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
  }, [lastUpdated, morningBrief, briefHour]);
};
