import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FONTS } from '../theme/tokens';

interface Props {
  /** Data is ready; the splash may leave once its intro has played. */
  ready: boolean;
  onDone: () => void;
}

// Matches the native splash colour so the hand-off is invisible.
export const SPLASH_BG = '#0A1124';
const MIN_SHOW_MS = 1700;
const MAX_WAIT_MS = 4000;
const EXIT_MS = 480;

const Star: React.FC<{ x: number; y: number; size: number; delay: number }> = ({ x, y, size, delay }) => {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.25, { duration: 900 })), -1, true));
    return () => cancelAnimation(o);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size, backgroundColor: '#FFFFFF' }, style]} />;
};

/**
 * Launch moment: a dawn sky where the sun rises behind a drifting cloud and the name fades in,
 * then the whole scene lifts away to reveal the app once the first weather has loaded.
 */
export const AnimatedSplash: React.FC<Props> = ({ ready, onDone }) => {
  const { width, height } = useWindowDimensions();
  const sunY = useSharedValue(60);
  const glow = useSharedValue(1);
  const cloudX = useSharedValue(-40);
  const cloudO = useSharedValue(0);
  const title = useSharedValue(0);
  const exit = useSharedValue(0);
  const [minDone, setMinDone] = React.useState(false);
  const [timedOut, setTimedOut] = React.useState(false);
  const leaving = React.useRef(false);

  const stars = useMemo(
    () => Array.from({ length: 22 }, () => ({ x: Math.random() * width, y: Math.random() * height * 0.45, size: 1.4 + Math.random() * 2, delay: Math.random() * 900 })),
    [width, height]
  );

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    // The sun rises from behind the cloud.
    sunY.value = withTiming(0, { duration: 1200, easing: ease });
    glow.value = withDelay(500, withRepeat(withTiming(1.15, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true));
    cloudX.value = withDelay(250, withSpring(0, { damping: 14, stiffness: 70 }));
    cloudO.value = withDelay(250, withTiming(1, { duration: 600 }));
    title.value = withDelay(650, withTiming(1, { duration: 700, easing: ease }));

    const min = setTimeout(() => setMinDone(true), MIN_SHOW_MS);
    const max = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => {
      clearTimeout(min);
      clearTimeout(max);
      [sunY, glow, cloudX, cloudO, title, exit].forEach(cancelAnimation);
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
  const sun = useAnimatedStyle(() => ({ transform: [{ translateY: sunY.value }] }));
  // Breathes between 1 and 1.15: brighter as it swells.
  const halo = useAnimatedStyle(() => ({ opacity: 0.6 + (glow.value - 1) * 2.5, transform: [{ translateY: sunY.value }, { scale: glow.value }] }));
  const cloud = useAnimatedStyle(() => ({ opacity: cloudO.value, transform: [{ translateX: cloudX.value }] }));
  const wordmark = useAnimatedStyle(() => ({ opacity: title.value, transform: [{ translateY: (1 - title.value) * 14 }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, root]}>
      <LinearGradient colors={[SPLASH_BG, '#1A2252', '#3B3F86', '#8E557E']} locations={[0, 0.45, 0.8, 1]} style={StyleSheet.absoluteFill} />
      {stars.map((s, i) => (
        <Star key={i} {...s} />
      ))}

      <View style={styles.center}>
        <View style={styles.scene}>
          <Animated.View style={[styles.halo, halo]}>
            <Svg width={200} height={200}>
              <Defs>
                <RadialGradient id="splashGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#FFD86B" stopOpacity="0.75" />
                  <Stop offset="0.5" stopColor="#FFB547" stopOpacity="0.25" />
                  <Stop offset="1" stopColor="#FFB547" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx={100} cy={100} r={100} fill="url(#splashGlow)" />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.sun, sun]}>
            <MaterialCommunityIcons name="white-balance-sunny" size={92} color="#FFC947" />
          </Animated.View>
          <Animated.View style={[styles.cloud, cloud]}>
            <MaterialCommunityIcons name="cloud" size={150} color="#FFFFFF" />
          </Animated.View>
        </View>

        <Animated.View style={[styles.textBlock, wordmark]}>
          <Text style={styles.title}>WeatherNow</Text>
          <Text style={styles.tagline}>Live weather, smart alerts</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    zIndex: 2000,
    backgroundColor: SPLASH_BG,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scene: {
    width: 220,
    height: 170,
  },
  halo: {
    position: 'absolute',
    left: 26,
    top: -54,
  },
  sun: {
    position: 'absolute',
    left: 80,
    top: 0,
  },
  cloud: {
    position: 'absolute',
    left: 24,
    top: 34,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 18,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: 'rgba(232, 234, 246, 0.85)',
    marginTop: 4,
  },
});
