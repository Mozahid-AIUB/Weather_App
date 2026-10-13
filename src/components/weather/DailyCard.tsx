import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { Card } from '../ui/Card';
import { WeatherIcon } from './WeatherIcon';
import type { DailyItem } from '../../types/weather';
import type { Unit } from '../../store/settingsStore';
import { formatWeekday, toTemp } from '../../utils/format';

interface Props {
  days: DailyItem[];
  currentTemp: number;
  unit: Unit;
  tz?: number;
  delay?: number;
}

/** Range bar that grows into place; position is relative to the week's coldest and warmest. */
const RangeBar: React.FC<{ start: number; end: number; dot?: number; delay: number }> = ({ start, end, dot, delay }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const grow = useSharedValue(0);
  useEffect(() => {
    grow.value = withDelay(delay, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [start, end]);
  const fill = useAnimatedStyle(() => ({
    left: `${start * 100}%`,
    width: `${Math.max(end - start, 0.06) * 100 * grow.value}%`,
  }));
  const marker = useAnimatedStyle(() => ({ opacity: grow.value, transform: [{ scale: grow.value }] }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fill]}>
        <LinearGradient colors={[colors.tempCold, colors.tempWarm]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {dot !== undefined && <Animated.View style={[styles.dot, { left: `${dot * 100}%` }, marker]} />}
    </View>
  );
};

export const DailyCard: React.FC<Props> = ({ days, currentTemp, unit, tz, delay = 0 }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  if (!days.length) return null;

  const weekMin = Math.min(...days.map((d) => d.low));
  const weekMax = Math.max(...days.map((d) => d.high));
  const span = Math.max(weekMax - weekMin, 1);
  const pos = (t: number) => Math.min(1, Math.max(0, (t - weekMin) / span));

  return (
    <Card title={`${days.length}-day forecast`} icon="calendar-month-outline" iconMotion="float" delay={delay}>
      {days.map((d, i) => (
        <View key={d.dateKey} style={[styles.row, i < days.length - 1 && styles.divider]}>
          <Text style={[styles.day, i === 0 && styles.today]}>{i === 0 ? 'Today' : formatWeekday(d.dt, tz)}</Text>
          <View style={styles.iconCol}>
            <WeatherIcon icon={d.icon} size={28} animated />
          </View>
          <View style={styles.popCol}>
            {d.pop >= 0.2 ? (
              <>
                <MaterialCommunityIcons name="water" size={11} color={colors.info} />
                <Text style={styles.pop}>{Math.round(d.pop * 100)}%</Text>
              </>
            ) : null}
          </View>
          <Text style={styles.low}>{toTemp(d.low, unit)}°</Text>
          <RangeBar start={pos(d.low)} end={pos(d.high)} dot={i === 0 ? pos(currentTemp) : undefined} delay={delay + 200 + i * 70} />
          <Text style={styles.high}>{toTemp(d.high, unit)}°</Text>
        </View>
      ))}
    </Card>
  );
};

const makeStyles = ({ colors, fonts }: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    divider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    day: {
      width: 52,
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    today: {
      fontFamily: fonts.bold,
      color: colors.accent,
    },
    iconCol: {
      width: 36,
      alignItems: 'center',
    },
    popCol: {
      width: 42,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
    },
    pop: {
      fontFamily: fonts.semiBold,
      fontSize: 11,
      color: colors.info,
    },
    low: {
      width: 36,
      textAlign: 'right',
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.textMuted,
      marginRight: 10,
    },
    high: {
      width: 36,
      fontFamily: fonts.semiBold,
      fontSize: 15,
      color: colors.text,
      marginLeft: 10,
    },
    track: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surfaceSunken,
      justifyContent: 'center',
    },
    fill: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      borderRadius: 3,
      overflow: 'hidden',
    },
    dot: {
      position: 'absolute',
      width: 12,
      height: 12,
      marginLeft: -6,
      borderRadius: 6,
      backgroundColor: colors.surfaceStrong,
      borderWidth: 3,
      borderColor: colors.text,
    },
  });
