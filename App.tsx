import React, { useEffect, useState } from 'react';
import {
  useFonts,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { useSettingsStore } from './src/store/settingsStore';
import { HomeScreen } from './src/screens/HomeScreen';
import { AnimatedSplash } from './src/components/AnimatedSplash';
import { useWeatherStore } from './src/store/weatherStore';
import { useUiStore } from './src/store/uiStore';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    ...MaterialCommunityIcons.font,
  });

  // Saved appearance and units are read before the first frame, so the theme never flashes.
  const settingsReady = useSettingsStore((s) => s.hydrated);
  useEffect(() => {
    useSettingsStore.getState().hydrate();
  }, []);

  const ready = fontsLoaded && settingsReady;
  // The animated splash (same colour as the native one) takes over as soon as we can draw.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  const [splashDone, setSplashDone] = useState(false);
  const weatherReady = useWeatherStore((s) => s.status === 'ready' || s.status === 'error');

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <HomeScreen />
      </ThemeProvider>
      {/* The app loads underneath while the splash plays, then it lifts away. */}
      {!splashDone && (
        <AnimatedSplash
          ready={weatherReady}
          onDone={() => {
            setSplashDone(true);
            useUiStore.getState().setRevealed();
          }}
        />
      )}
    </SafeAreaProvider>
  );
}
