import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PALETTES } from '../../theme/tokens';
import { useSkyMode, useTheme } from '../../theme/ThemeProvider';
import type { SkyCondition } from '../../utils/weather';

interface Props {
  condition: SkyCondition;
  /** Fade the sun / moon behind content-heavy screens so cards stay readable. */
  subdued?: boolean;
}

const loop = (to: number, duration: number, reverse = true) =>
  withRepeat(withTiming(to, { duration, easing: reverse ? Easing.inOut(Easing.sin) : Easing.linear }), -1, reverse);

// ─── Sun & moon ───────────────────────────────────────────────────────────────

const Sun: React.FC = () => {
  const colors = PALETTES.day;
  const pulse = useSharedValue(1);
  const spin = useSharedValue(0);
  useEffect(() => {
    pulse.value = loop(1.08, 4200);
    spin.value = loop(360, 90000, false);
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(spin);
    };
  }, []);
  const glow = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const rays = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  return (
    <View style={[styles.celestial, { top: -110, right: -90 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, glow]}>
        <Svg width={380} height={380}>
          <Defs>
            <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.sky.celestial} stopOpacity="0.55" />
              <Stop offset="0.45" stopColor={colors.sky.celestial} stopOpacity="0.18" />
              <Stop offset="1" stopColor={colors.sky.celestial} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={190} cy={190} r={190} fill="url(#sunGlow)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, rays]}>
        <Svg width={380} height={380}>
          <Circle cx={190} cy={190} r={118} stroke={colors.sky.celestial} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="2 14" fill="none" />
          <Circle cx={190} cy={190} r={146} stroke={colors.sky.celestial} strokeOpacity={0.18} strokeWidth={1} strokeDasharray="1 18" fill="none" />
        </Svg>
      </Animated.View>
      <Svg width={380} height={380} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="sunCore" cx="45%" cy="40%" r="60%">
            <Stop offset="0" stopColor="#FFF4D6" />
            <Stop offset="1" stopColor={colors.sky.celestial} />
          </RadialGradient>
        </Defs>
        <Circle cx={190} cy={190} r={62} fill="url(#sunCore)" />
      </Svg>
    </View>
  );
};

const Moon: React.FC = () => {
  const colors = PALETTES.night;
  const float = useSharedValue(0);
  const halo = useSharedValue(1);
  useEffect(() => {
    float.value = loop(-6, 5200);
    halo.value = loop(1.1, 3800);
    return () => {
      cancelAnimation(float);
      cancelAnimation(halo);
    };
  }, []);
  const body = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const glow = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }, { scale: halo.value }] }));

  return (
    <View style={[styles.celestial, { width: 300, height: 300, top: -40, right: -50 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, glow]}>
        <Svg width={300} height={300}>
          <Defs>
            <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0.2" stopColor={colors.accent} stopOpacity="0.32" />
              <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={150} cy={150} r={150} fill="url(#moonGlow)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, body]}>
        <Svg width={300} height={300}>
          <Defs>
            <RadialGradient id="moonCore" cx="40%" cy="38%" r="65%">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="1" stopColor={colors.sky.celestial} />
            </RadialGradient>
          </Defs>
          <Circle cx={150} cy={150} r={44} fill="url(#moonCore)" />
          <Circle cx={136} cy={140} r={8} fill="#C9CFE0" opacity={0.45} />
          <Circle cx={162} cy={162} r={11} fill="#C9CFE0" opacity={0.35} />
          <Circle cx={160} cy={132} r={4.5} fill="#C9CFE0" opacity={0.4} />
          <Circle cx={140} cy={168} r={3.5} fill="#C9CFE0" opacity={0.35} />
        </Svg>
      </Animated.View>
    </View>
  );
};

// ─── Particles ────────────────────────────────────────────────────────────────

const Star: React.FC<{ x: number; y: number; size: number; delay: number; color: string }> = ({ x, y, size, delay, color }) => {
  const o = useSharedValue(0.15);
  useEffect(() => {
    o.value = withDelay(delay, loop(0.95, 1400 + delay / 2));
    return () => cancelAnimation(o);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: 0.7 + o.value * 0.4 }] }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size, backgroundColor: color }, style]} />;
};

const Cloud: React.FC<{ y: number; size: number; duration: number; offset: number; width: number; color: string }> = ({
  y,
  size,
  duration,
  offset,
  width,
  color,
}) => {
  const x = useSharedValue(-size + offset * (width + size));
  useEffect(() => {
    // Finish the first pass from the staggered start, then loop edge to edge.
    const first = duration * (1 - offset);
    x.value = withSequence(
      withTiming(width + 20, { duration: first, easing: Easing.linear }),
      withRepeat(withSequence(withTiming(-size, { duration: 0 }), withTiming(width + 20, { duration, easing: Easing.linear })), -1, false)
    );
    return () => cancelAnimation(x);
  }, [width]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View style={[{ position: 'absolute', top: y, left: 0 }, style]}>
      <MaterialCommunityIcons name="cloud" size={size} color={color} />
    </Animated.View>
  );
};

const Drop: React.FC<{ x: number; length: number; duration: number; delay: number; height: number; color: string }> = ({
  x,
  length,
  duration,
  delay,
  height,
  color,
}) => {
  const y = useSharedValue(-40);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withTiming(height + 40, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(y);
  }, [height]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: '14deg' }] }));
  return <Animated.View style={[{ position: 'absolute', top: 0, left: x, width: 1.6, height: length, borderRadius: 1, backgroundColor: color }, style]} />;
};

const Flake: React.FC<{ x: number; size: number; duration: number; delay: number; height: number; color: string }> = ({
  x,
  size,
  duration,
  delay,
  height,
  color,
}) => {
  const y = useSharedValue(-20);
  const sway = useSharedValue(-12);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withTiming(height + 20, { duration, easing: Easing.linear }), -1, false));
    sway.value = loop(12, 1800 + delay / 3);
    return () => {
      cancelAnimation(y);
      cancelAnimation(sway);
    };
  }, [height]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { translateX: sway.value }] }));
  return <Animated.View style={[{ position: 'absolute', top: 0, left: x, width: size, height: size, borderRadius: size, backgroundColor: color }, style]} />;
};

const Lightning: React.FC = () => {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withDelay(7000, withTiming(0.55, { duration: 60 })),
        withTiming(0, { duration: 110 }),
        withTiming(0.35, { duration: 50 }),
        withTiming(0, { duration: 320 })
      ),
      -1,
      false
    );
    return () => cancelAnimation(o);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }, style]} />;
};

// ─── Sky ──────────────────────────────────────────────────────────────────────

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const OVERCAST: SkyCondition[] = ['cloudy', 'rain', 'storm', 'snow', 'fog'];
const CELESTIAL_DIM: Record<SkyCondition, number> = { clear: 1, partly: 0.85, cloudy: 0.45, fog: 0.45, rain: 0.22, storm: 0.22, snow: 0.22 };
const SLOW = { duration: 1600, easing: Easing.inOut(Easing.cubic) };
// Day ↔ night runs alongside the content fade, so it is quicker than weather changes.
const NIGHTFALL = { duration: 900, easing: Easing.inOut(Easing.cubic) };

/**
 * Full-screen living sky: cream daylight with a glowing sun, or a moonlit night with stars.
 * Every change cross-fades — day ↔ night, clear ↔ overcast, rain / snow / lightning starting
 * and stopping — so switching places or a live weather change never jumps.
 */
export const SkyBackground: React.FC<Props> = ({ condition, subdued = false }) => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isNight = useSkyMode() === 'night';
  const overcast = OVERCAST.includes(condition);
  const wet = condition === 'rain' || condition === 'storm' || condition === 'snow';

  const night = useSharedValue(isNight ? 1 : 0);
  const cloudy = useSharedValue(overcast ? 1 : 0);
  const glow = useSharedValue(CELESTIAL_DIM[condition]);
  const quiet = useSharedValue(subdued ? 0.1 : 1);

  useEffect(() => {
    night.value = withTiming(isNight ? 1 : 0, NIGHTFALL);
  }, [isNight]);
  useEffect(() => {
    cloudy.value = withTiming(overcast ? 1 : 0, SLOW);
    glow.value = withTiming(CELESTIAL_DIM[condition], SLOW);
  }, [condition]);
  useEffect(() => {
    quiet.value = withTiming(subdued ? 0.1 : 1, { duration: 500 });
  }, [subdued]);

  const dayOvercast = useAnimatedStyle(() => ({ opacity: cloudy.value }));
  const nightLayer = useAnimatedStyle(() => ({ opacity: night.value }));
  const nightOvercast = useAnimatedStyle(() => ({ opacity: cloudy.value }));
  // The sun sinks as night falls and the moon rises in its place.
  const sunStyle = useAnimatedStyle(() => ({
    opacity: glow.value * quiet.value * (1 - night.value),
    transform: [{ translateY: night.value * 70 }],
  }));
  const moonStyle = useAnimatedStyle(() => ({
    opacity: glow.value * quiet.value * night.value,
    transform: [{ translateY: (1 - night.value) * 70 }],
  }));
  const quietStyle = useAnimatedStyle(() => ({ opacity: quiet.value }));

  const stars = useMemo(
    () => Array.from({ length: 38 }, () => ({ x: rand(0, width), y: rand(0, height * 0.55), size: rand(1.2, 2.8), delay: rand(0, 3000) })),
    [width, height]
  );
  const clouds = useMemo(() => {
    const count = condition === 'partly' ? 2 : overcast ? 4 : 0;
    return Array.from({ length: count }, (_, i) => ({
      y: 40 + i * 70 + rand(-15, 15),
      size: rand(150, 250),
      duration: rand(55000, 90000),
      offset: (i * 0.37 + 0.15) % 1,
    }));
  }, [condition, overcast]);
  const drops = useMemo(
    () => Array.from({ length: condition === 'storm' ? 55 : 40 }, () => ({ x: rand(-20, width), length: rand(14, 26), duration: rand(650, 1050), delay: rand(0, 1200) })),
    [width, condition]
  );
  const flakes = useMemo(
    () => Array.from({ length: 34 }, () => ({ x: rand(0, width), size: rand(3, 7), duration: rand(6000, 10000), delay: rand(0, 6000) })),
    [width]
  );

  const fadeIn = FadeIn.duration(1400);
  const fadeOut = FadeOut.duration(1400);

  return (
    <View style={styles.sky}>
      {/* Four gradients blended by two values: night (0–1) and overcast (0–1). */}
      <LinearGradient colors={PALETTES.day.sky.clear} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      <Animated.View style={[StyleSheet.absoluteFill, dayOvercast]}>
        <LinearGradient colors={PALETTES.day.sky.overcast} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, nightLayer]}>
        <LinearGradient colors={PALETTES.night.sky.clear} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
        <Animated.View style={[StyleSheet.absoluteFill, nightOvercast]}>
          <LinearGradient colors={PALETTES.night.sky.overcast} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
        </Animated.View>
      </Animated.View>

      {isNight && !wet && (
        <Animated.View entering={fadeIn} exiting={fadeOut} style={StyleSheet.absoluteFill}>
          {stars.map((st, i) => (
            <Star key={i} {...st} color={PALETTES.night.sky.star} />
          ))}
        </Animated.View>
      )}

      <Animated.View style={[StyleSheet.absoluteFill, sunStyle]}>
        <Sun />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, moonStyle]}>
        <Moon />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, quietStyle]}>
        {clouds.length > 0 && (
          <Animated.View key={`clouds-${condition}`} entering={fadeIn} exiting={fadeOut} style={StyleSheet.absoluteFill}>
            {clouds.map((c, i) => (
              <Cloud key={i} {...c} width={width} color={colors.sky.cloud} />
            ))}
          </Animated.View>
        )}
      </Animated.View>

      {(condition === 'rain' || condition === 'storm') && (
        <Animated.View entering={fadeIn} exiting={fadeOut} style={StyleSheet.absoluteFill}>
          {drops.map((d, i) => (
            <Drop key={i} {...d} height={height} color={colors.sky.rain} />
          ))}
        </Animated.View>
      )}

      {condition === 'snow' && (
        <Animated.View entering={fadeIn} exiting={fadeOut} style={StyleSheet.absoluteFill}>
          {flakes.map((f, i) => (
            <Flake key={i} {...f} height={height} color={colors.sky.snow} />
          ))}
        </Animated.View>
      )}

      {condition === 'storm' && (
        <Animated.View entering={fadeIn} exiting={fadeOut} style={StyleSheet.absoluteFill}>
          <Lightning />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Clip the sun, moon and drifting clouds so they never widen the page.
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  celestial: {
    position: 'absolute',
    width: 380,
    height: 380,
  },
});
