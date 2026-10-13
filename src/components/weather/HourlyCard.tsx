import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { Card } from '../ui/Card';
import { WeatherIcon } from './WeatherIcon';
import type { HourlyItem } from '../../types/weather';
import type { Unit } from '../../store/settingsStore';
import { formatHour, toTemp } from '../../utils/format';

interface Props {
  items: HourlyItem[];
  unit: Unit;
  tz?: number;
  delay?: number;
}

const COL = 66;
const CURVE_H = 58;
const PAD_TOP = 22;
const PAD_BOTTOM = 8;

/** Smooth path through points using Catmull-Rom → cubic Bézier segments. */
const smoothPath = (pts: { x: number; y: number }[]) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

export const HourlyCard: React.FC<Props> = ({ items, unit, tz, delay = 0 }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  if (!items.length) return null;

  const temps = items.map((i) => toTemp(i.temp, unit));
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(max - min, 1);
  const width = items.length * COL;
  const pts = temps.map((t, i) => ({
    x: i * COL + COL / 2,
    y: PAD_TOP + (1 - (t - min) / span) * (CURVE_H - PAD_TOP - PAD_BOTTOM),
  }));
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${CURVE_H} L ${pts[0].x} ${CURVE_H} Z`;

  return (
    <Card title="Hourly forecast" icon="clock-time-four-outline" iconMotion="swing" delay={delay} padded={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={{ width }}>
          <View style={styles.row}>
            {items.map((item, i) => (
              <View key={item.dt} style={[styles.col, item.isNow && styles.nowCol]}>
                <Text style={[styles.time, item.isNow && styles.nowText]}>{item.isNow ? 'Now' : formatHour(item.dt, tz)}</Text>
                <WeatherIcon icon={item.icon} size={34} animated={i < 5} />
              </View>
            ))}
          </View>

          <Animated.View entering={FadeIn.delay(delay + 250).duration(700)} style={{ height: CURVE_H }}>
            <Svg width={width} height={CURVE_H}>
              <Defs>
                <LinearGradient id="hourlyStroke" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={colors.tempCold} />
                  <Stop offset="1" stopColor={colors.tempWarm} />
                </LinearGradient>
                <LinearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.tempWarm} stopOpacity="0.22" />
                  <Stop offset="1" stopColor={colors.tempWarm} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Path d={area} fill="url(#hourlyFill)" />
              <Path d={line} stroke="url(#hourlyStroke)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
              {pts.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={i === 0 ? 4.5 : 3} fill={i === 0 ? colors.accent : colors.surfaceStrong} stroke={colors.accent} strokeWidth={1.5} />
              ))}
            </Svg>
            {pts.map((p, i) => (
              <Text key={i} style={[styles.temp, { left: p.x - COL / 2, top: p.y - 22 }, i === 0 && styles.nowText]}>
                {temps[i]}°
              </Text>
            ))}
          </Animated.View>

          <View style={styles.row}>
            {items.map((item) => (
              <View key={item.dt} style={styles.popCol}>
                {item.pop >= 0.1 ? (
                  <>
                    <MaterialCommunityIcons name="water" size={11} color={colors.info} />
                    <Text style={styles.pop}>{Math.round(item.pop * 100)}%</Text>
                  </>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Card>
  );
};

const makeStyles = ({ colors, fonts, spacing, radius }: Theme) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.lg,
    },
    row: {
      flexDirection: 'row',
    },
    col: {
      width: COL,
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      borderRadius: radius.md,
    },
    nowCol: {
      backgroundColor: colors.accentSoft,
    },
    time: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      color: colors.textMuted,
    },
    nowText: {
      fontFamily: fonts.bold,
      color: colors.accent,
    },
    temp: {
      position: 'absolute',
      width: COL,
      textAlign: 'center',
      fontFamily: fonts.semiBold,
      fontSize: 14,
      color: colors.text,
    },
    popCol: {
      width: COL,
      height: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    pop: {
      fontFamily: fonts.semiBold,
      fontSize: 11,
      color: colors.info,
    },
  });
