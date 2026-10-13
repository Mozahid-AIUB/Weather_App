import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { FONTS, PALETTES, Palette, RADIUS, SPACING, ThemeMode } from './tokens';
import { useSettingsStore } from '../store/settingsStore';
import { useWeatherStore } from '../store/weatherStore';
import { useNow } from '../hooks/useNow';
import { isDaytime } from '../utils/weather';

export interface Theme {
  mode: ThemeMode;
  colors: Palette;
  fonts: typeof FONTS;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
}

const build = (mode: ThemeMode): Theme => ({ mode, colors: PALETTES[mode], fonts: FONTS, spacing: SPACING, radius: RADIUS });
const THEMES: Record<ThemeMode, Theme> = { day: build('day'), night: build('night') };

const ThemeContext = createContext<Theme>(THEMES.night);
const TransitionContext = createContext<{ fade: SharedValue<number>; target: ThemeMode } | null>(null);

const FADE_OUT_MS = 340;
const FADE_IN_MS = 450;

/**
 * "Auto" follows the sun at the place being viewed: cream daylight theme between sunrise and
 * sunset, moonlit dark theme otherwise. Light / Dark in Settings pin one of them.
 *
 * Switching is choreographed so text never sits on the wrong background: the sky starts
 * morphing at once, content fades out, the colours swap while it's hidden, then it fades back.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appearance = useSettingsStore((s) => s.appearance);
  const current = useWeatherStore((s) => s.current);
  const now = useNow(60000);

  const target: ThemeMode =
    appearance === 'light' ? 'day' : appearance === 'dark' ? 'night' : isDaytime(current, now) ? 'day' : 'night';

  const [mode, setMode] = useState<ThemeMode>(target);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (target === mode) {
      fade.value = withTiming(1, { duration: 200 });
      return;
    }
    fade.value = withTiming(0, { duration: FADE_OUT_MS, easing: Easing.out(Easing.quad) });
    const t = setTimeout(() => {
      setMode(target);
      fade.value = withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.cubic) });
    }, FADE_OUT_MS + 10);
    return () => clearTimeout(t);
  }, [target]);

  const transition = useMemo(() => ({ fade, target }), [target]);

  return (
    <TransitionContext.Provider value={transition}>
      <ThemeContext.Provider value={THEMES[mode]}>{children}</ThemeContext.Provider>
    </TransitionContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

/** The mode the sky should already be heading towards (leads the content colours). */
export const useSkyMode = (): ThemeMode => {
  const transition = useContext(TransitionContext);
  const theme = useContext(ThemeContext);
  return transition?.target ?? theme.mode;
};

/** Wraps app content so it dips out and back in around a day ↔ night colour swap. */
export const ThemeFade: React.FC<{ style?: StyleProp<ViewStyle>; children: React.ReactNode }> = ({ style, children }) => {
  const ctx = useContext(TransitionContext);
  const fallback = useSharedValue(1);
  const fade = ctx?.fade ?? fallback;
  const animated = useAnimatedStyle(() => ({ opacity: fade.value }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
};

/** Memoised theme-aware styles. Define `factory` at module scope and return StyleSheet.create(...). */
export const useStyles = <T,>(factory: (t: Theme) => T): T => {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
};
