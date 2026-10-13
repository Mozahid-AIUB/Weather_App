import React, { useEffect } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { iconGroup, isNightIcon } from '../../utils/weather';
import type { GlyphName } from '../ui/AnimatedGlyph';

interface Props {
  /** OpenWeather icon code, e.g. "10d". */
  icon: string;
  size: number;
  animated?: boolean;
}

interface LayerProps {
  name: GlyphName;
  size: number;
  color: string;
  left: number;
  top: number;
  animated: boolean;
}

const sine = Easing.inOut(Easing.sin);

const useLoop = (animated: boolean, start: () => number, deps: unknown[] = []) => {
  const v = useSharedValue(0);
  useEffect(() => {
    if (animated) v.value = start();
    return () => cancelAnimation(v);
  }, [animated, ...deps]);
  return v;
};

const SunLayer: React.FC<LayerProps> = ({ size, color, left, top, animated }) => {
  const spin = useLoop(animated, () => withRepeat(withTiming(360, { duration: 24000, easing: Easing.linear }), -1, false));
  const glow = useLoop(animated, () => withRepeat(withTiming(1, { duration: 2200, easing: sine }), -1, true));
  const rays = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const halo = useAnimatedStyle(() => ({ opacity: 0.35 + glow.value * 0.35, transform: [{ scale: 0.85 + glow.value * 0.2 }] }));
  return (
    <View style={{ position: 'absolute', left, top, width: size, height: size }}>
      <Animated.View
        style={[{ position: 'absolute', left: size * 0.2, top: size * 0.2, width: size * 0.6, height: size * 0.6, borderRadius: size, backgroundColor: `${color}55` }, halo]}
      />
      <Animated.View style={rays}>
        <MaterialCommunityIcons name="white-balance-sunny" size={size} color={color} />
      </Animated.View>
    </View>
  );
};

const MoonLayer: React.FC<LayerProps> = ({ size, color, left, top, animated }) => {
  const tilt = useLoop(animated, () => withRepeat(withTiming(1, { duration: 3200, easing: sine }), -1, true));
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${-8 + tilt.value * 16}deg` }, { translateY: -tilt.value * size * 0.03 }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left, top }, style]}>
      <MaterialCommunityIcons name="moon-waning-crescent" size={size} color={color} />
    </Animated.View>
  );
};

const Twinkle: React.FC<{ size: number; color: string; left: number; top: number; animated: boolean; delay: number }> = ({
  size,
  color,
  left,
  top,
  animated,
  delay,
}) => {
  const v = useLoop(animated, () => withDelay(delay, withRepeat(withTiming(1, { duration: 1300, easing: sine }), -1, true)));
  const style = useAnimatedStyle(() => ({ opacity: animated ? 0.3 + v.value * 0.7 : 0.8, transform: [{ scale: animated ? 0.6 + v.value * 0.5 : 1 }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left, top }, style]}>
      <MaterialCommunityIcons name="star-four-points" size={size} color={color} />
    </Animated.View>
  );
};

const CloudLayer: React.FC<LayerProps & { phase?: number }> = ({ size, color, left, top, animated, phase = 0 }) => {
  const v = useLoop(animated, () => withDelay(phase, withRepeat(withTiming(1, { duration: 2800, easing: sine }), -1, true)));
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: (v.value - 0.5) * size * 0.08 }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left, top }, style]}>
      <MaterialCommunityIcons name="cloud" size={size} color={color} />
    </Animated.View>
  );
};

const RainDrop: React.FC<{ x: number; y: number; w: number; h: number; color: string; animated: boolean; delay: number; fall: number }> = ({
  x,
  y,
  w,
  h,
  color,
  animated,
  delay,
  fall,
}) => {
  const v = useLoop(animated, () =>
    withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 750, easing: Easing.in(Easing.quad) }), withTiming(0, { duration: 0 })), -1, false))
  );
  const style = useAnimatedStyle(() => ({
    opacity: animated ? (v.value < 0.75 ? 1 : 1 - (v.value - 0.75) / 0.25) : 1,
    transform: [{ translateY: v.value * fall }, { rotate: '12deg' }],
  }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: w, backgroundColor: color }, style]} />;
};

const Bolt: React.FC<LayerProps> = ({ size, color, left, top, animated }) => {
  const v = useLoop(animated, () =>
    withRepeat(
      withSequence(withTiming(0.25, { duration: 1600 }), withTiming(1, { duration: 70 }), withTiming(0.4, { duration: 90 }), withTiming(1, { duration: 70 })),
      -1,
      false
    )
  );
  const style = useAnimatedStyle(() => ({ opacity: animated ? v.value : 1 }));
  return (
    <Animated.View style={[{ position: 'absolute', left, top }, style]}>
      <MaterialCommunityIcons name="lightning-bolt" size={size} color={color} />
    </Animated.View>
  );
};

const SnowFlake: React.FC<{ x: number; y: number; size: number; color: string; animated: boolean; delay: number; fall: number }> = ({
  x,
  y,
  size,
  color,
  animated,
  delay,
  fall,
}) => {
  const v = useLoop(animated, () =>
    withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 1800, easing: Easing.linear }), withTiming(0, { duration: 0 })), -1, false))
  );
  const style = useAnimatedStyle(() => ({
    opacity: animated ? (v.value < 0.7 ? 1 : 1 - (v.value - 0.7) / 0.3) : 1,
    transform: [{ translateY: v.value * fall }, { rotate: `${v.value * 180}deg` }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y }, style]}>
      <MaterialCommunityIcons name="snowflake" size={size} color={color} />
    </Animated.View>
  );
};

const FogLayer: React.FC<LayerProps> = ({ size, color, left, top, animated }) => {
  const v = useLoop(animated, () => withRepeat(withTiming(1, { duration: 2600, easing: sine }), -1, true));
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: (v.value - 0.5) * size * 0.1 }], opacity: 0.75 + v.value * 0.25 }));
  return (
    <Animated.View style={[{ position: 'absolute', left, top }, style]}>
      <MaterialCommunityIcons name="weather-fog" size={size} color={color} />
    </Animated.View>
  );
};

/**
 * Layered condition icon: sun / moon, clouds and precipitation are separate glyphs so each
 * can move on its own — rays turn, clouds drift, drops fall, lightning flickers.
 */
export const WeatherIcon: React.FC<Props> = ({ icon, size, animated = false }) => {
  const { colors } = useTheme();
  const c = colors.icon;
  const group = iconGroup(icon);
  const night = isNightIcon(icon);
  const s = size;

  const celestial = (sz: number, left: number, top: number) =>
    night ? <MoonLayer name="moon-waning-crescent" size={sz} color={c.moon} left={left} top={top} animated={animated} /> : <SunLayer name="white-balance-sunny" size={sz} color={c.sun} left={left} top={top} animated={animated} />;

  const precipCloud = <CloudLayer name="cloud" size={s * 0.82} color={group === 'storm' ? c.cloudDark : c.cloud} left={s * 0.09} top={s * 0.02} animated={animated} />;

  let layers: React.ReactNode;
  switch (group) {
    case 'clear':
      layers = night ? (
        <>
          {celestial(s * 0.78, s * 0.08, s * 0.12)}
          <Twinkle size={s * 0.16} color={c.moon} left={s * 0.7} top={s * 0.08} animated={animated} delay={0} />
          <Twinkle size={s * 0.11} color={c.moon} left={s * 0.82} top={s * 0.36} animated={animated} delay={600} />
        </>
      ) : (
        celestial(s * 0.92, s * 0.04, s * 0.04)
      );
      break;
    case 'partly':
      layers = (
        <>
          {celestial(s * 0.6, s * 0.04, s * 0.04)}
          <CloudLayer name="cloud" size={s * 0.74} color={c.cloud} left={s * 0.22} top={s * 0.3} animated={animated} />
        </>
      );
      break;
    case 'cloudy':
      layers = (
        <>
          <CloudLayer name="cloud" size={s * 0.6} color={c.cloudDark} left={s * 0.36} top={s * 0.1} animated={animated} phase={900} />
          <CloudLayer name="cloud" size={s * 0.78} color={c.cloud} left={s * 0.06} top={s * 0.26} animated={animated} />
        </>
      );
      break;
    case 'rain':
      layers = (
        <>
          {precipCloud}
          {[0.3, 0.5, 0.7].map((x, i) => (
            <RainDrop key={i} x={s * x} y={s * 0.64} w={Math.max(2, s * 0.045)} h={s * 0.14} color={c.rain} animated={animated} delay={i * 250} fall={s * 0.16} />
          ))}
        </>
      );
      break;
    case 'storm':
      layers = (
        <>
          {precipCloud}
          <Bolt name="lightning-bolt" size={s * 0.42} color={c.bolt} left={s * 0.32} top={s * 0.5} animated={animated} />
          <RainDrop x={s * 0.24} y={s * 0.66} w={Math.max(2, s * 0.04)} h={s * 0.12} color={c.rain} animated={animated} delay={200} fall={s * 0.14} />
          <RainDrop x={s * 0.74} y={s * 0.66} w={Math.max(2, s * 0.04)} h={s * 0.12} color={c.rain} animated={animated} delay={500} fall={s * 0.14} />
        </>
      );
      break;
    case 'snow':
      layers = (
        <>
          {precipCloud}
          {[0.24, 0.46, 0.68].map((x, i) => (
            <SnowFlake key={i} x={s * x} y={s * 0.62} size={s * 0.16} color={c.snow} animated={animated} delay={i * 500} fall={s * 0.14} />
          ))}
        </>
      );
      break;
    case 'fog':
      layers = <FogLayer name="weather-fog" size={s * 0.86} color={c.fog} left={s * 0.07} top={s * 0.07} animated={animated} />;
      break;
  }

  return <View style={{ width: s, height: s }}>{layers}</View>;
};
