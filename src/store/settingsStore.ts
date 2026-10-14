import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanName } from '../utils/format';

export type Appearance = 'auto' | 'light' | 'dark';
export type Unit = 'metric' | 'imperial';
export type AlertKind = 'storm' | 'rain' | 'snow' | 'heat' | 'cold' | 'wind' | 'visibility' | 'change' | 'brief' | 'evening';

export type AlertPrefs = Record<'storm' | 'rain' | 'temperature' | 'wind' | 'change', boolean>;

interface SettingsState {
  hydrated: boolean;
  appearance: Appearance;
  unit: Unit;
  userName: string;
  morningBrief: boolean;
  briefHour: number;
  eveningBrief: boolean;
  eveningHour: number;
  alerts: AlertPrefs;

  hydrate: () => Promise<void>;
  setAppearance: (a: Appearance) => void;
  setUnit: (u: Unit) => void;
  setUserName: (name: string) => void;
  setMorningBrief: (on: boolean) => void;
  setBriefHour: (hour: number) => void;
  setEveningBrief: (on: boolean) => void;
  setEveningHour: (hour: number) => void;
  setAlert: (key: keyof AlertPrefs, on: boolean) => void;
}

const STORAGE_KEY = '@weathernow_settings_v2';

type Persisted = Pick<SettingsState, 'appearance' | 'unit' | 'userName' | 'morningBrief' | 'briefHour' | 'eveningBrief' | 'eveningHour' | 'alerts'>;

// US (and the two other countries on Fahrenheit) default to imperial; everyone else to metric.
const detectUnit = (): Unit => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || '';
    const region = locale.match(/[-_]([A-Z]{2})(?:[-_]|$)/)?.[1];
    return region && ['US', 'LR', 'MM'].includes(region) ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
};

const DEFAULTS: Persisted = {
  appearance: 'auto',
  unit: detectUnit(),
  userName: '',
  morningBrief: true,
  briefHour: 7,
  eveningBrief: true,
  eveningHour: 19,
  alerts: { storm: true, rain: true, temperature: true, wind: true, change: true },
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  const persist = () => {
    const { appearance, unit, userName, morningBrief, briefHour, eveningBrief, eveningHour, alerts } = get();
    const data: Persisted = { appearance, unit, userName, morningBrief, briefHour, eveningBrief, eveningHour, alerts };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  };

  const update = (patch: Partial<Persisted>) => {
    set(patch);
    persist();
  };

  return {
    hydrated: false,
    ...DEFAULTS,

    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<Persisted>;
          set({ ...DEFAULTS, ...saved, alerts: { ...DEFAULTS.alerts, ...saved.alerts } });
        }
      } catch {
        // fall back to defaults
      }
      set({ hydrated: true });
    },

    setAppearance: (appearance) => update({ appearance }),
    setUnit: (unit) => update({ unit }),
    setUserName: (userName) => update({ userName: cleanName(userName).slice(0, 30) }),
    setMorningBrief: (morningBrief) => update({ morningBrief }),
    setBriefHour: (briefHour) => update({ briefHour }),
    setEveningBrief: (eveningBrief) => update({ eveningBrief }),
    setEveningHour: (eveningHour) => update({ eveningHour }),
    setAlert: (key, on) => update({ alerts: { ...get().alerts, [key]: on } }),
  };
});

/** Which preference toggle governs each alert kind. Daily messages use morningBrief / eveningBrief. */
export const ALERT_PREF_FOR: Record<Exclude<AlertKind, 'brief' | 'evening'>, keyof AlertPrefs> = {
  storm: 'storm',
  rain: 'rain',
  snow: 'rain',
  heat: 'temperature',
  cold: 'temperature',
  wind: 'wind',
  visibility: 'change',
  change: 'change',
};
