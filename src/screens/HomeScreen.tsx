import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ThemeFade, useTheme } from '../theme/ThemeProvider';
import { useWeatherStore } from '../store/weatherStore';
import { useLiveWeather } from '../hooks/useLiveWeather';
import { iconGroup } from '../utils/weather';
import { SkyBackground } from '../components/sky/SkyBackground';
import { TabBar, TabKey } from '../components/TabBar';
import { SearchSheet } from '../components/SearchSheet';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { AlertToast } from '../components/notifications/AlertToast';
import { TodayScreen } from './TodayScreen';
import { RadarScreen } from './RadarScreen';
import { PlacesScreen } from './PlacesScreen';
import { SettingsScreen } from './SettingsScreen';

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
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});
