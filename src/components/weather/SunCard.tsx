import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { Card } from '../ui/Card';
import { formatClock, formatDuration } from '../../utils/format';

interface Props {
  sunrise: number;
  sunset: number;
  tz?: number;
  now: number;
  delay?: number;
}

const W = 300;
const H = 128;
const CX = W / 2;
const CY = H - 14;
const RX = 126;
const RY = 98;
const SUN = 22;

/** Sunrise → sunset arc; the sun glides to its current spot when the card appears. */
export const SunCard: React.FC<Props> = ({ sunrise, sunset, tz, now, delay = 0 }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const t = now / 1000;
  const isDay = t >= sunrise && t < sunset;
  const daylight = sunset - sunrise;
  const p = isDay ? (t - sunrise) / daylight : t >= sunset ? 1 : 0;

  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withDelay(delay + 300, withTiming(p, { duration: 1600, easing: Easing.inOut(Easing.cubic) }));
  }, [p]);

  const sunStyle = useAnimatedStyle(() => {
    const a = Math.PI * (1 - prog.value);
    return {
      transform: [{ translateX: CX + RX * Math.cos(a) - SUN / 2 }, { translateY: CY - RY * Math.sin(a) - SUN / 2 }],
    };
  });

  const a = Math.PI * (1 - p);
  const endX = CX + RX * Math.cos(a);
  const endY = CY - RY * Math.sin(a);
  const arc = `M ${CX - RX} ${CY} A ${RX} ${RY} 0 0 1 ${CX + RX} ${CY}`;
  const done = `M ${CX - RX} ${CY} A ${RX} ${RY} 0 0 1 ${endX} ${endY}`;

  const untilSunrise = t < sunrise ? sunrise - t : sunrise + 86400 - t;
  const status = isDay ? `${formatDuration(sunset - t)} of daylight left` : `Sunrise in ${formatDuration(untilSunrise)}`;

  return (
    <Card title={isDay ? 'Sunset' : 'Sunrise'} icon={isDay ? 'weather-sunset-down' : 'weather-sunset-up'} iconMotion="float" tint={colors.icon.sun} delay={delay}>
      <Text style={styles.big}>{formatClock(isDay ? sunset : sunrise, tz)}</Text>
      <Text style={styles.status}>{status}</Text>

      <View style={styles.arcWrap}>
        <View style={{ width: W, height: H }}>
          <Svg width={W} height={H}>
            <Defs>
              <LinearGradient id="sunArc" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.icon.sun} stopOpacity="0.6" />
                <Stop offset="1" stopColor={colors.tempWarm} />
              </LinearGradient>
            </Defs>
            <Line x1={8} y1={CY} x2={W - 8} y2={CY} stroke={colors.divider} strokeWidth={1} strokeDasharray="4 5" />
            <Path d={arc} stroke={colors.divider} strokeWidth={2} fill="none" strokeDasharray="2 6" strokeLinecap="round" />
            {p > 0.01 && <Path d={done} stroke="url(#sunArc)" strokeWidth={3} fill="none" strokeLinecap="round" />}
          </Svg>
          <Animated.View style={[styles.sun, sunStyle]}>
            <View style={[styles.sunGlow, { backgroundColor: `${colors.icon.sun}40` }]} />
            <View style={[styles.sunCore, { backgroundColor: isDay ? colors.icon.sun : colors.textMuted }]} />
          </Animated.View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footItem}>
          <MaterialCommunityIcons name="weather-sunset-up" size={16} color={colors.icon.sun} />
          <Text style={styles.footText}>{formatClock(sunrise, tz)}</Text>
        </View>
        <Text style={styles.footMuted}>Daylight {formatDuration(daylight)}</Text>
        <View style={styles.footItem}>
          <MaterialCommunityIcons name="weather-sunset-down" size={16} color={colors.tempWarm} />
          <Text style={styles.footText}>{formatClock(sunset, tz)}</Text>
        </View>
      </View>
    </Card>
  );
};

const makeStyles = ({ colors, fonts, spacing }: Theme) =>
  StyleSheet.create({
    big: {
      fontFamily: fonts.medium,
      fontSize: 30,
      color: colors.text,
      letterSpacing: -0.6,
    },
    status: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    arcWrap: {
      alignItems: 'center',
      marginTop: spacing.md,
    },
    sun: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: SUN,
      height: SUN,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sunGlow: {
      position: 'absolute',
      width: SUN * 1.9,
      height: SUN * 1.9,
      borderRadius: SUN,
    },
    sunCore: {
      width: SUN * 0.62,
      height: SUN * 0.62,
      borderRadius: SUN,
      borderWidth: 2,
      borderColor: colors.surfaceStrong,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    footItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    footText: {
      fontFamily: fonts.semiBold,
      fontSize: 13,
      color: colors.text,
    },
    footMuted: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      color: colors.textMuted,
    },
  });
