import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PUSH_REG_KEY, useNotificationStore } from '../store/notificationStore';
import { useSettingsStore } from '../store/settingsStore';
import { useWeatherStore } from '../store/weatherStore';
import { notificationService } from '../services/notificationService';
import { backendConfigured, backendService, DeviceRegistration } from '../services/backendService';

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Keeps this phone registered with the backend so alerts and the morning brief arrive even when
 * the app is closed. Re-registers only when something the server needs actually changed.
 */
export const usePushRegistration = () => {
  const permission = useNotificationStore((s) => s.permission);
  const place = useWeatherStore((s) => s.place);
  const isGps = useWeatherStore((s) => s.isGps);
  const { unit, userName, morningBrief, briefHour, eveningBrief, eveningHour, alerts } = useSettingsStore();

  useEffect(() => {
    if (permission !== 'granted' || !backendConfigured || notificationService.support() !== 'native' || !place) return;
    let cancelled = false;

    const t = setTimeout(async () => {
      const token = await notificationService.getPushToken();
      if (!token || cancelled) return;
      const prevRaw = await AsyncStorage.getItem(PUSH_REG_KEY);
      const prev: DeviceRegistration | null = prevRaw ? JSON.parse(prevRaw) : null;

      // Alerts follow where you are: the GPS place, or the first place seen if location is off.
      // Browsing other cities doesn't move them.
      const loc = isGps || !prev ? { lat: round(place.lat), lon: round(place.lon), place: place.name } : { lat: prev.lat, lon: prev.lon, place: prev.place };
      const reg: DeviceRegistration = {
        token,
        ...loc,
        unit,
        userName,
        morningBrief,
        briefHour,
        eveningBrief,
        eveningHour,
        tzOffset: -new Date().getTimezoneOffset(),
        alerts: { storm: alerts.storm, rain: alerts.rain, temperature: alerts.temperature, wind: alerts.wind },
      };
      const raw = JSON.stringify(reg);
      if (raw === prevRaw) {
        useNotificationStore.getState().setServerPush(true);
        return;
      }
      if (await backendService.registerDevice(reg)) {
        await AsyncStorage.setItem(PUSH_REG_KEY, raw);
        useNotificationStore.getState().setServerPush(true);
        notificationService.cancelDaily('morning-brief');
        notificationService.cancelDaily('evening-brief');
      }
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [permission, place?.lat, place?.lon, place?.name, isGps, unit, userName, morningBrief, briefHour, eveningBrief, eveningHour, alerts]);

  // Server pushes that land while the app is open become an in-app toast.
  useEffect(() => notificationService.onServerPush((push) => useNotificationStore.getState().ingestServerPush(push)), []);
};
