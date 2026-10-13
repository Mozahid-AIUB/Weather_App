import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { Card } from '../ui/Card';
import type { GlyphName, Motion } from '../ui/AnimatedGlyph';
import type { CurrentWeather } from '../../types/weather';
import type { Unit } from '../../store/settingsStore';
import { compassDir, dewPoint, formatPressure, formatTemp, formatVisibility, formatWind, toTemp } from '../../utils/format';

interface Props {
  current: CurrentWeather;
  /** Chance of rain over the next forecast slot, 0–1. */
  nextPop: number;
  unit: Unit;
  delay?: number;
}

interface TileProps {
  title: string;
  icon: GlyphName;
  motion: Motion;
  tint: string;
  value: string;
  suffix?: string;
  caption: string;
  delay: number;
  children?: React.ReactNode;
}

const Tile: React.FC<TileProps> = ({ title, icon, motion, tint, value, suffix, caption, delay, children }) => {
  const styles = useStyles(makeStyles);
  return (
    <Card title={title} icon={icon} iconMotion={motion} tint={tint} delay={delay} style={styles.tile}>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        <View style={styles.flex} />
        {children}
      </View>
      <Text style={styles.caption}>{caption}</Text>
    </Card>
  );
};

/** Humidity fill that rises to its level. */
const Meter: React.FC<{ value: number; color: string; delay: number }> = ({ value, color, delay }) => {
  const styles = useStyles(makeStyles);
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(delay, withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [value]);
  const fill = useAnimatedStyle(() => ({ height: `${h.value * 100}%` }));
  return (
    <View style={styles.meter}>
      <Animated.View style={[styles.meterFill, { backgroundColor: color }, fill]} />
    </View>
  );
};

/** Compass rose whose arrow swings round to where the wind is blowing. */
const Compass: React.FC<{ deg: number; color: string; delay: number }> = ({ deg, color, delay }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const r = useSharedValue(0);
  useEffect(() => {
    // Arrow points the way the wind travels (meteorological degrees give its origin).
    r.value = withDelay(delay, withSpring(deg + 180, { damping: 9, stiffness: 60 }));
  }, [deg]);
  const arrow = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return (
    <View style={styles.compass}>
      <Text style={[styles.north, { color: colors.textMuted }]}>N</Text>
      <Animated.View style={arrow}>
        <MaterialCommunityIcons name="navigation" size={20} color={color} />
      </Animated.View>
    </View>
  );
};

export const DetailsGrid: React.FC<Props> = ({ current, nextPop, unit, delay = 0 }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const { main, wind, visibility } = current;

  const feelsDiff = main.feels_like - main.temp;
  const feelsCaption =
    Math.abs(feelsDiff) < 1.5
      ? 'Similar to the actual temperature.'
      : feelsDiff > 0
        ? 'Humidity makes it feel warmer.'
        : 'Wind makes it feel cooler.';

  const dew = dewPoint(main.temp, main.humidity);
  const w = formatWind(wind.speed, unit);
  const g = wind.gust ? formatWind(wind.gust, unit) : null;
  const p = formatPressure(main.pressure, unit);
  const v = formatVisibility(visibility, unit);
  const pressureCaption = main.pressure < 1005 ? 'Low pressure. Unsettled weather.' : main.pressure > 1022 ? 'High pressure. Settled skies.' : 'Normal and steady.';
  const visCaption = visibility >= 9000 ? 'Perfectly clear view.' : visibility >= 4000 ? 'Light haze in the air.' : 'Poor visibility. Take care.';

  return (
    <View style={styles.grid}>
      <Tile
        title="Feels like"
        icon="thermometer"
        motion="float"
        tint={colors.tempWarm}
        value={formatTemp(main.feels_like, unit)}
        caption={feelsCaption}
        delay={delay}
      />
      <Tile
        title="Humidity"
        icon="water-outline"
        motion="drip"
        tint={colors.info}
        value={`${main.humidity}`}
        suffix="%"
        caption={`Dew point ${toTemp(dew, unit)}°`}
        delay={delay + 60}
      >
        <Meter value={main.humidity / 100} color={colors.info} delay={delay + 300} />
      </Tile>
      <Tile
        title="Wind"
        icon="weather-windy"
        motion="sway"
        tint={colors.success}
        value={`${w.value}`}
        suffix={w.label}
        caption={g ? `Gusts ${g.value} ${g.label} · from ${compassDir(wind.deg)}` : `From the ${compassDir(wind.deg)}`}
        delay={delay + 120}
      >
        <Compass deg={wind.deg || 0} color={colors.success} delay={delay + 300} />
      </Tile>
      <Tile
        title="Pressure"
        icon="gauge"
        motion="swing"
        tint={colors.accent}
        value={p.value}
        suffix={p.label}
        caption={pressureCaption}
        delay={delay + 180}
      />
      <Tile
        title="Visibility"
        icon="eye-outline"
        motion="blink"
        tint={colors.warning}
        value={v.value}
        suffix={v.label}
        caption={visCaption}
        delay={delay + 240}
      />
      <Tile
        title="Rain chance"
        icon="umbrella-outline"
        motion="swing"
        tint={colors.info}
        value={`${Math.round(nextPop * 100)}`}
        suffix="%"
        caption={nextPop >= 0.5 ? 'Next 3 hours. Keep an umbrella handy.' : nextPop >= 0.2 ? 'Next 3 hours. A passing shower is possible.' : 'Next 3 hours. Staying dry.'}
        delay={delay + 300}
      />
    </View>
  );
};

const makeStyles = ({ colors, fonts, spacing }: Theme) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
    },
    tile: {
      width: '48.3%',
      marginHorizontal: 0,
      minHeight: 138,
    },
    flex: { flex: 1 },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    value: {
      fontFamily: fonts.medium,
      fontSize: 30,
      lineHeight: 34,
      color: colors.text,
      letterSpacing: -0.8,
    },
    suffix: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.textMuted,
      marginLeft: 3,
      marginBottom: 4,
    },
    caption: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      lineHeight: 17,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    meter: {
      width: 8,
      height: 34,
      borderRadius: 4,
      backgroundColor: colors.surfaceSunken,
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    meterFill: {
      width: '100%',
      borderRadius: 4,
    },
    compass: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1.5,
      borderColor: colors.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    north: {
      position: 'absolute',
      top: -1,
      fontFamily: fonts.bold,
      fontSize: 8,
    },
  });
