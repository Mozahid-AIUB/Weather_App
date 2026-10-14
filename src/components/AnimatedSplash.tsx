import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FONTS } from '../theme/tokens';
import { useSettingsStore } from '../store/settingsStore';
import { greetingName } from '../utils/format';

interface Props {
  /** Data is ready; the splash may leave once its intro has played. */
  ready: boolean;
  onDone: () => void;
}

// Matches the native splash colour so the hand-off is invisible.
export const SPLASH_BG = '#0A1124';
const MIN_SHOW_MS = 2300;
const MAX_WAIT_MS = 4500;
const EXIT_MS = 520;
const WORDMARK = 'WeatherNow';

type Period = 'morning' | 'afternoon' | 'evening' | 'night';

const SCENES: Record<
  Period,
  { sky: [string, string, string, string]; greeting: string; emoji: string; line: string; celestial: 'sun' | 'moon'; sun: string; glow: string; particle: string }
> = {
  morning: {
    sky: ['#0A1124', '#2A2A6B', '#B35A7A', '#F59A4A'],
    greeting: 'Good morning',
    emoji: '☀️',
    line: "Let's see what today brings",
    celestial: 'sun',
    sun: '#FFC947',
    glow: '#FFD86B',
    particle: '#FFD9A0',
  },
  afternoon: {
    sky: ['#0A1124', '#1E4E9A', '#4C8FE0', '#9CCBF6'],
    greeting: 'Good afternoon',
    emoji: '🌤️',
    line: 'Here is your weather, right now',
    celestial: 'sun',
    sun: '#FFD34D',
    glow: '#FFF0A8',
    particle: '#FFFFFF',
  },
  evening: {
    sky: ['#0A1124', '#3A2766', '#C24E6A', '#F28C3A'],
    greeting: 'Good evening',
    emoji: '🌇',
    line: "Here's tonight and tomorrow",
    celestial: 'sun',
    sun: '#FF9A3D',
    glow: '#FFB067',
    particle: '#FFC48A',
  },
  night: {
    sky: ['#05080F', '#0A1124', '#17204A', '#2B2F6B'],
    greeting: 'Good night',
    emoji: '🌙',
    line: "Here's how the night looks",
    celestial: 'moon',
    sun: '#EEF1FA',
    glow: '#B8C7FF',
    particle: '#DCE3FF',
  },
};

const periodFor = (hour: number): Period =>
  hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : hour >= 17 && hour < 21 ? 'evening' : 'night';

const Star: React.FC<{ x: number; y: number; size: number; delay: number }> = ({ x, y, size, delay }) => {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 800 }), withTiming(0.2, { duration: 800 })), -1, true));
    return () => cancelAnimation(o);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: 0.6 + o.value * 0.6 }] }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size, backgroundColor: '#FFFFFF' }, style]} />;
};

/** Warm light motes drifting up from the horizon. */
const Mote: React.FC<{ x: number; size: number; delay: number; duration: number; height: number; color: string }> = ({ x, size, delay, duration, height, color }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false));
    return () => cancelAnimation(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.2 ? t.value * 4 : (1 - t.value) * 1.1,
    transform: [{ translateY: -t.value * height * 0.45 }, { translateX: Math.sin(t.value * 6) * 8 }],
  }));
  return <Animated.View style={[{ position: 'absolute', left: x, bottom: 40, width: size, height: size, borderRadius: size, backgroundColor: color }, style]} />;
};

/**
 * Launch moment that greets the user: a sky painted for the time of day, the sun (or moon) rising
 * behind a drifting cloud, the name assembling letter by letter, then a personal "Good morning".
 * It lifts away to reveal the app once the first weather has loaded.
 */
export const AnimatedSplash: React.FC<Props> = ({ ready, onDone }) => {
  const { width, height } = useWindowDimensions();
  const userName = useSettingsStore((s) => s.userName);
  const scene = SCENES[periodFor(new Date().getHours())];
  const name = greetingName(userName);

  const veil = useSharedValue(1);
  const logo = useSharedValue(1);
  const rise = useSharedValue(70);
  const pop = useSharedValue(0.4);
  const spin = useSharedValue(0);
  const glow = useSharedValue(1);
  const cloudX = useSharedValue(-50);
  const cloudO = useSharedValue(0);
  const exit = useSharedValue(0);
  const [minDone, setMinDone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const leaving = useRef(false);

  const stars = useMemo(
    () =>
      Array.from({ length: scene.celestial === 'moon' ? 40 : 18 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.5,
        size: 1.3 + Math.random() * 2.2,
        delay: Math.random() * 1200,
      })),
    [width, height]
  );
  const motes = useMemo(
    () => Array.from({ length: 12 }, () => ({ x: Math.random() * width, size: 3 + Math.random() * 4, delay: Math.random() * 1800, duration: 2600 + Math.random() * 1800 })),
    [width]
  );

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    veil.value = withTiming(0, { duration: 600 });
    // Hand-off: the native splash logo lingers a beat, then gives way to the animated scene.
    logo.value = withDelay(150, withTiming(0, { duration: 450, easing: Easing.in(Easing.quad) }));
    rise.value = withTiming(0, { duration: 1300, easing: ease });
    pop.value = withSpring(1, { damping: 9, stiffness: 90 });
    spin.value = withRepeat(withTiming(360, { duration: 14000, easing: Easing.linear }), -1, false);
    glow.value = withDelay(600, withRepeat(withTiming(1.18, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true));
    cloudX.value = withDelay(300, withSpring(0, { damping: 13, stiffness: 60 }));
    cloudO.value = withDelay(300, withTiming(1, { duration: 700 }));

    const min = setTimeout(() => setMinDone(true), MIN_SHOW_MS);
    const max = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => {
      clearTimeout(min);
      clearTimeout(max);
      [veil, logo, rise, pop, spin, glow, cloudX, cloudO, exit].forEach(cancelAnimation);
    };
  }, []);

  useEffect(() => {
    if (leaving.current || !minDone || !(ready || timedOut)) return;
    leaving.current = true;
    exit.value = withTiming(1, { duration: EXIT_MS, easing: Easing.inOut(Easing.cubic) });
    const t = setTimeout(onDone, EXIT_MS + 20);
    return () => clearTimeout(t);
  }, [minDone, ready, timedOut]);

  const root = useAnimatedStyle(() => ({ opacity: 1 - exit.value, transform: [{ scale: 1 + exit.value * 0.08 }] }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));
  const logoStyle = useAnimatedStyle(() => ({ opacity: logo.value, transform: [{ scale: 0.9 + logo.value * 0.1 }] }));
  const celestial = useAnimatedStyle(() => ({ transform: [{ translateY: rise.value }, { scale: pop.value }] }));
  const rays = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const halo = useAnimatedStyle(() => ({ opacity: 0.6 + (glow.value - 1) * 2.2, transform: [{ translateY: rise.value }, { scale: glow.value }] }));
  const cloud = useAnimatedStyle(() => ({ opacity: cloudO.value, transform: [{ translateX: cloudX.value }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, root]}>
      <LinearGradient colors={scene.sky} locations={[0, 0.45, 0.8, 1]} style={StyleSheet.absoluteFill} />
      {/* Starts as the native splash colour, then the time-of-day sky fades in beneath. */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: SPLASH_BG }, veilStyle]} />
      {/* Same image and size as the native splash, so the switch is seamless. */}
      <View style={styles.logoWrap}>
        <Animated.Image source={require('../../assets/splash-icon.png')} style={[styles.logo, logoStyle]} />
      </View>

      {stars.map((s, i) => (
        <Star key={`s${i}`} {...s} />
      ))}
      {motes.map((m, i) => (
        <Mote key={`m${i}`} {...m} height={height} color={scene.particle} />
      ))}

      <View style={styles.center}>
        <View style={styles.scene}>
          <Animated.View style={[styles.halo, halo]}>
            <Svg width={220} height={220}>
              <Defs>
                <RadialGradient id="splashGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={scene.glow} stopOpacity="0.8" />
                  <Stop offset="0.5" stopColor={scene.glow} stopOpacity="0.25" />
                  <Stop offset="1" stopColor={scene.glow} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx={110} cy={110} r={110} fill="url(#splashGlow)" />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.celestial, celestial]}>
            <Animated.View style={scene.celestial === 'sun' ? rays : undefined}>
              <MaterialCommunityIcons name={scene.celestial === 'sun' ? 'white-balance-sunny' : 'moon-waning-crescent'} size={96} color={scene.sun} />
            </Animated.View>
          </Animated.View>
          <Animated.View style={[styles.cloud, cloud]}>
            <MaterialCommunityIcons name="cloud" size={156} color="#FFFFFF" />
          </Animated.View>
        </View>

        <View style={styles.wordmark}>
          {WORDMARK.split('').map((ch, i) => (
            <Animated.Text key={i} entering={FadeInDown.delay(550 + i * 55).springify().damping(11)} style={styles.letter}>
              {ch}
            </Animated.Text>
          ))}
        </View>

        <Animated.Text entering={FadeInDown.delay(1250).duration(650)} style={styles.greeting}>
          {scene.greeting}
          {name ? `, ${name}` : ''} {scene.emoji}
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(1550).duration(650)} style={styles.line}>
          {scene.line}
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    zIndex: 2000,
    backgroundColor: SPLASH_BG,
  },
  logoWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scene: {
    width: 230,
    height: 176,
  },
  halo: {
    position: 'absolute',
    left: 24,
    top: -60,
  },
  celestial: {
    position: 'absolute',
    left: 86,
    top: 0,
  },
  cloud: {
    position: 'absolute',
    left: 24,
    top: 34,
  },
  wordmark: {
    flexDirection: 'row',
    marginTop: 14,
  },
  letter: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  greeting: {
    fontFamily: FONTS.semiBold,
    fontSize: 19,
    color: '#FFFFFF',
    marginTop: 14,
    textAlign: 'center',
  },
  line: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: 'rgba(240, 242, 252, 0.85)',
    marginTop: 4,
    textAlign: 'center',
  },
});
