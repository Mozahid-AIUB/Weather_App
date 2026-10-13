import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DerivedAlert } from '../services/alertEngine';
import { notificationService, PermissionState } from '../services/notificationService';
import { ALERT_PREF_FOR, useSettingsStore } from './settingsStore';
import type { SkyCondition } from '../utils/weather';

export interface AppNotification extends DerivedAlert {
  createdAt: number;
  read: boolean;
}

interface NotificationState {
  items: AppNotification[];
  /** Ids already delivered, kept after "clear" so the same event doesn't fire again. */
  seen: string[];
  /** Last condition seen per place, for "weather changed" alerts. */
  lastGroup: Record<string, { group: SkyCondition; at: number }>;
  toast: AppNotification | null;
  permission: PermissionState;
  /** True once the backend sends this phone's alerts; local system notifications then stop. */
  serverPush: boolean;

  hydrate: () => Promise<void>;
  ingest: (alerts: DerivedAlert[]) => void;
  ingestServerPush: (push: { id: string; kind: string; severity: string; city: string; title: string; body: string }) => void;
  setServerPush: (on: boolean) => void;
  setLastGroup: (city: string, group: SkyCondition) => void;
  markAllRead: () => void;
  clear: () => void;
  dismissToast: () => void;
  refreshPermission: () => Promise<void>;
  requestPermission: () => Promise<PermissionState>;
}

const KEY = '@weathernow_notifications_v1';
export const PUSH_REG_KEY = '@weathernow_push_reg_v1';
const SEVERITY_RANK = { info: 0, warning: 1, severe: 2 };

export const useNotificationStore = create<NotificationState>((set, get) => {
  const persist = () => {
    const { items, seen, lastGroup } = get();
    AsyncStorage.setItem(KEY, JSON.stringify({ items, seen, lastGroup })).catch(() => {});
  };

  return {
    items: [],
    seen: [],
    lastGroup: {},
    toast: null,
    permission: 'default',
    serverPush: false,

    hydrate: async () => {
      try {
        if (await AsyncStorage.getItem(PUSH_REG_KEY)) set({ serverPush: true });
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          set({ items: saved.items || [], seen: saved.seen || [], lastGroup: saved.lastGroup || {} });
        }
      } catch {
        // start empty
      }
      get().refreshPermission();
    },

    ingest: (alerts) => {
      const { seen, items } = get();
      const prefs = useSettingsStore.getState();
      const fresh = alerts.filter((a) => {
        if (seen.includes(a.id)) return false;
        return a.kind === 'brief' ? prefs.morningBrief : prefs.alerts[ALERT_PREF_FOR[a.kind]];
      });
      if (!fresh.length) return;

      const now = Date.now();
      const added: AppNotification[] = fresh.map((a, i) => ({ ...a, createdAt: now - i, read: false }));
      const top = [...added].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];

      set({
        items: [...added, ...items].slice(0, 60),
        seen: [...fresh.map((a) => a.id), ...seen].slice(0, 300),
        toast: top,
      });
      persist();

      // Mirror to the system tray (unless the server already does): everything except minor
      // condition changes, at most two at once.
      if (get().serverPush) return;
      added
        .filter((a) => a.severity !== 'info' || a.kind === 'brief')
        .slice(0, 2)
        .forEach((a) => notificationService.present(a.title, a.body));
    },

    ingestServerPush: (push) => {
      if (get().seen.includes(push.id)) return;
      const kinds = ['storm', 'rain', 'snow', 'heat', 'cold', 'wind', 'visibility', 'change', 'brief'];
      const severities = ['info', 'warning', 'severe'];
      const item: AppNotification = {
        ...push,
        kind: (kinds.includes(push.kind) ? push.kind : 'brief') as AppNotification['kind'],
        severity: (severities.includes(push.severity) ? push.severity : 'info') as AppNotification['severity'],
        createdAt: Date.now(),
        read: false,
      };
      set({ items: [item, ...get().items].slice(0, 60), seen: [push.id, ...get().seen].slice(0, 300), toast: item });
      persist();
    },

    setServerPush: (on) => set({ serverPush: on }),

    setLastGroup: (city, group) => {
      set({ lastGroup: { ...get().lastGroup, [city]: { group, at: Date.now() } } });
      persist();
    },

    markAllRead: () => {
      if (!get().items.some((i) => !i.read)) return;
      set({ items: get().items.map((i) => ({ ...i, read: true })) });
      persist();
    },

    clear: () => {
      set({ items: [] });
      persist();
    },

    dismissToast: () => set({ toast: null }),

    refreshPermission: async () => set({ permission: await notificationService.getPermission() }),

    requestPermission: async () => {
      const permission = await notificationService.requestPermission();
      set({ permission });
      return permission;
    },
  };
});

export const selectUnreadCount = (s: NotificationState) => s.items.reduce((n, i) => n + (i.read ? 0 : 1), 0);
