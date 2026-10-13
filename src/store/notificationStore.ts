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

  hydrate: () => Promise<void>;
  ingest: (alerts: DerivedAlert[]) => void;
  setLastGroup: (city: string, group: SkyCondition) => void;
  markAllRead: () => void;
  clear: () => void;
  dismissToast: () => void;
  refreshPermission: () => Promise<void>;
  requestPermission: () => Promise<PermissionState>;
}

const KEY = '@weathernow_notifications_v1';
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

    hydrate: async () => {
      try {
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

      // Mirror to the system tray: everything except minor condition changes, at most two at once.
      added
        .filter((a) => a.severity !== 'info' || a.kind === 'brief')
        .slice(0, 2)
        .forEach((a) => notificationService.present(a.title, a.body));
    },

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
