import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ThemeFade, useTheme } from '../theme/ThemeProvider';
import { useWeatherStore } from '../store/weatherStore';
import { useLiveWeather } from '../hooks/useLiveWeather';
import { usePushRegistration } from '../hooks/usePushRegistration';
import { iconGroup } from '../utils/weather';
import { SkyBackground } from '../components/sky/SkyBackground';
import { TabBar, TabKey } from '../components/TabBar';
import { SearchSheet } from '../components/SearchSheet';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { AlertToast } from '../components/notifications/AlertToast';
import { NotificationPrompt } from '../components/notifications/NotificationPrompt';
import { useNotificationStore } from '../store/notificationStore';
import { useUiStore } from '../store/uiStore';
import { notificationService } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { TodayScreen } from './TodayScreen';
import { RadarScreen } from './RadarScreen';
import { PlacesScreen } from './PlacesScreen';
import { SettingsScreen } from './SettingsScreen';

const PROMPT_KEY = '@weathernow_notification_prompt_v1';
const ACTIVE_ALERT_MS = 6 * 60 * 60 * 1000;
let introShown = false;

/**
 * Cross-fades a tab in with a small lift. Visited tabs stay mounted (scroll position and state
 * survive) and are hidden once faded out; `keepAlive={false}` unmounts instead (the radar's WebView).
 */
const TabScene: React.FC<{ active: boolean; keepAlive?: boolean; children: React.ReactNode }> = ({ active, keepAlive = true, children }) => {
  const v = useSharedValue(active ? 1 : 0);
  const [shown, setShown] = useState(active);

  useEffect(() => {
    if (active) {
      setShown(true);
      v.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
      return;
    }
    v.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) });
    const t = setTimeout(() => setShown(false), 190);
    return () => clearTimeout(t);
  }, [active]);

  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: (1 - v.value) * 12 }] }));

  if (!shown && !keepAlive) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style, { zIndex: active ? 1 : 0, display: shown ? 'flex' : 'none', pointerEvents: active ? 'auto' : 'none' }]}>
      {children}
    </Animated.View>
  );
};

/** App shell: living sky, the four tabs, global sheets and the live alert toast. */
export const HomeScreen: React.FC = () => {
  useLiveWeather();
  usePushRegistration();
  const { mode } = useTheme();
  const [tab, setTab] = useState<TabKey>('today');
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set<TabKey>(['today']));
  const selectTab = (next: TabKey) => {
    setVisited((v) => (v.has(next) ? v : new Set(v).add(next)));
    setTab(next);
  };
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const current = useWeatherStore((s) => s.current);
  const placeName = useWeatherStore((s) => s.place?.name);
  const weatherReady = useWeatherStore((s) => s.status === 'ready');
  const revealed = useUiStore((s) => s.revealed);
  const permission = useNotificationStore((s) => s.permission);
  const [promptOpen, setPromptOpen] = useState(false);

  // First run only: once the weather is on screen, explain notifications, then ask.
  useEffect(() => {
    if (!revealed || !weatherReady || permission !== 'default' || notificationService.support() === 'none') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    AsyncStorage.getItem(PROMPT_KEY).then((seen) => {
      if (!seen) timer = setTimeout(() => setPromptOpen(true), 1500);
    });
    return () => clearTimeout(timer);
  }, [revealed, weatherReady, permission]);

  // First impression: if a real weather warning is active for this place, let it drop in once
  // per app session — after the hero settles, and never for routine messages.
  useEffect(() => {
    if (!revealed || !weatherReady || introShown) return;
    const t = setTimeout(() => {
      introShown = true;
      const { items, toast, showToast } = useNotificationStore.getState();
      const city = useWeatherStore.getState().place?.name;
      if (toast || !city) return;
      const active = items.find(
        (n) => n.city === city && n.severity !== 'info' && n.kind !== 'brief' && n.kind !== 'evening' && Date.now() - n.createdAt < ACTIVE_ALERT_MS
      );
      if (active) showToast(active);
    }, 600);
    return () => clearTimeout(t);
  }, [revealed, weatherReady]);

  // Back from the phone's Settings: pick up a newly allowed (or revoked) permission.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') useNotificationStore.getState().refreshPermission();
    });
    return () => sub.remove();
  }, []);

  const closePrompt = () => {
    setPromptOpen(false);
    AsyncStorage.setItem(PROMPT_KEY, '1').catch(() => {});
  };

  const openSearch = () => setSearchOpen(true);
  const openAlerts = () => setAlertsOpen(true);

  return (
    <View style={styles.root}>
      <SkyBackground condition={iconGroup(current?.weather[0]?.icon)} subdued={tab !== 'today'} />
      <StatusBar style={mode === 'day' ? 'dark' : 'light'} />

      <ThemeFade style={styles.root}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
          <View style={styles.root}>
            {visited.has('today') && (
              <TabScene active={tab === 'today'}>
                <TodayScreen onOpenSearch={openSearch} onOpenNotifications={openAlerts} />
              </TabScene>
            )}
            {visited.has('radar') && (
              <TabScene active={tab === 'radar'} keepAlive={false}>
                <RadarScreen onOpenNotifications={openAlerts} />
              </TabScene>
            )}
            {visited.has('places') && (
              <TabScene active={tab === 'places'}>
                <PlacesScreen onOpenSearch={openSearch} onOpenNotifications={openAlerts} onSelect={() => selectTab('today')} />
              </TabScene>
            )}
            {visited.has('settings') && (
              <TabScene active={tab === 'settings'}>
                <SettingsScreen onOpenNotifications={openAlerts} />
              </TabScene>
            )}
          </View>
        </SafeAreaView>

        <TabBar active={tab} onChange={selectTab} />
        <AlertToast onOpen={openAlerts} />
      </ThemeFade>

      <SearchSheet visible={searchOpen} onClose={() => setSearchOpen(false)} onPicked={() => selectTab('today')} />
      <NotificationCenter visible={alertsOpen} onClose={() => setAlertsOpen(false)} placeName={placeName} />
      <NotificationPrompt visible={promptOpen} onClose={closePrompt} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});
