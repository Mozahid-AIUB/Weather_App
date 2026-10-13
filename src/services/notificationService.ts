import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';

// expo-notifications is only loaded outside Expo Go — Android Expo Go dropped notification
// support in SDK 53. In Expo Go the app falls back to in-app alerts only.
let Notifications: typeof import('expo-notifications') | null = null;

const inExpoGo = () => {
  try {
    return typeof isRunningInExpoGo === 'function' ? isRunningInExpoGo() : false;
  } catch {
    return false;
  }
};

if (Platform.OS !== 'web' && !inExpoGo()) {
  try {
    Notifications = require('expo-notifications');
    Notifications!.setNotificationHandler({
      // Server pushes carry an alert id. While the app is open they become an in-app toast
      // instead (see onServerPush), so the system banner is suppressed to avoid doubles.
      handleNotification: async (n) => {
        const fromServer = !!(n.request.content.data as { id?: string } | undefined)?.id;
        return { shouldPlaySound: !fromServer, shouldSetBadge: false, shouldShowBanner: !fromServer, shouldShowList: !fromServer };
      },
    });
  } catch {
    Notifications = null;
  }
}

const CHANNEL_ID = 'weather-alerts';
const BRIEF_ID = 'morning-brief';

export type DeviceSupport = 'native' | 'web' | 'none';
export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

const webNotification = (): typeof window.Notification | null =>
  Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window ? window.Notification : null;

let channelReady = false;
const ensureChannel = async () => {
  if (!Notifications || Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Weather alerts & morning brief',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#E5762F',
  });
  channelReady = true;
};

export const notificationService = {
  support: (): DeviceSupport => (Notifications ? 'native' : webNotification() ? 'web' : 'none'),

  /** True when the morning brief can be delivered while the app is closed. */
  canSchedule: () => !!Notifications,

  getPermission: async (): Promise<PermissionState> => {
    const web = webNotification();
    if (web) return web.permission as PermissionState;
    if (!Notifications) return 'unsupported';
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'default';
    } catch {
      return 'unsupported';
    }
  },

  requestPermission: async (): Promise<PermissionState> => {
    const web = webNotification();
    if (web) {
      try {
        return (await web.requestPermission()) as PermissionState;
      } catch {
        return 'denied';
      }
    }
    if (!Notifications) return 'unsupported';
    try {
      await ensureChannel();
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  },

  /** Shows a system notification right away (no-op without permission). */
  present: async (title: string, body: string) => {
    const web = webNotification();
    if (web) {
      if (web.permission === 'granted') {
        try {
          new web(title, { body, icon: '/favicon.ico', tag: title });
        } catch {
          // some mobile browsers only allow notifications from a service worker
        }
      }
      return;
    }
    if (!Notifications) return;
    try {
      await ensureChannel();
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
      });
    } catch {
      // permission missing — in-app alert still shows
    }
  },

  /** Replaces the pending morning brief so the OS delivers it even if the app stays closed. */
  scheduleMorningBrief: async (date: Date, title: string, body: string) => {
    if (!Notifications) return;
    try {
      await ensureChannel();
      await Notifications.cancelScheduledNotificationAsync(BRIEF_ID).catch(() => {});
      await Notifications.scheduleNotificationAsync({
        identifier: BRIEF_ID,
        content: { title, body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: CHANNEL_ID,
        },
      });
    } catch {
      // permission missing
    }
  },

  cancelMorningBrief: async () => {
    if (!Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(BRIEF_ID).catch(() => {});
  },

  /** Expo push token for server-sent alerts; null in Expo Go, on web or without permission. */
  getPushToken: async (): Promise<string | null> => {
    if (!Notifications) return null;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return null;
      await ensureChannel();
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      return data;
    } catch {
      // e.g. Android build without Firebase (FCM) credentials
      return null;
    }
  },

  /** Calls `handler` for each server push that arrives while the app is open. */
  onServerPush: (handler: (push: { id: string; kind: string; severity: string; city: string; title: string; body: string }) => void) => {
    if (!Notifications) return () => {};
    const sub = Notifications.addNotificationReceivedListener((n) => {
      const data = n.request.content.data as { id?: string; kind?: string; severity?: string; city?: string } | undefined;
      if (!data?.id) return;
      handler({
        id: data.id,
        kind: data.kind || 'brief',
        severity: data.severity || 'info',
        city: data.city || '',
        title: n.request.content.title || '',
        body: n.request.content.body || '',
      });
    });
    return () => sub.remove();
  },
};
