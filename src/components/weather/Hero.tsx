import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { Theme, useStyles } from '../../theme/ThemeProvider';
import type { CurrentWeather } from '../../types/weather';
import type { Unit } from '../../store/settingsStore';
import { capitalize, formatTemp, toTemp } from '../../utils/format';
import { useCountUp } from '../../hooks/useCountUp';
import { WeatherIcon } from './WeatherIcon';

interface Props {
  current: CurrentWeather;
  high: number;
  low: number;
  unit: Unit;
}

export const Hero: React.FC<Props> = ({ current, high, low, unit }) => {
  const styles = useStyles(makeStyles);
  const temp = useCountUp(toTemp(current.main.temp, unit));
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(bob);
  }, []);
  const floating = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 8 }] }));

  return (
    <View style={styles.hero}>
      <Animated.View entering={ZoomIn.duration(600).springify().damping(14)}>
        <Animated.View style={floating}>
          <WeatherIcon icon={current.weather[0]?.icon || '01d'} size={148} animated />
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.tempRow}>
        <Text style={styles.temp} accessibilityLabel={`${temp} degrees`}>
          {temp}
        </Text>
        <Text style={styles.degree}>°</Text>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.condition}>
        {capitalize(current.weather[0]?.description || 'Clear')}
      </Animated.Text>

      <Animated.View entering={FadeIn.delay(320).duration(600)} style={styles.pills}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Feels like {formatTemp(current.main.feels_like, unit)}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            H {formatTemp(high, unit)}  ·  L {formatTemp(low, unit)}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const makeStyles = ({ colors, fonts, spacing, radius }: Theme) =>
  StyleSheet.create({
    hero: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.xxl,
    },
    tempRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: -4,
    },
    temp: {
      fontFamily: fonts.light,
      fontSize: 112,
      lineHeight: 118,
      letterSpacing: -5,
      color: colors.text,
    },
    degree: {
      fontFamily: fonts.light,
      fontSize: 52,
      lineHeight: 70,
      color: colors.accent,
      marginLeft: 2,
    },
    condition: {
      fontFamily: fonts.medium,
      fontSize: 20,
      color: colors.text,
      marginTop: -2,
    },
    pills: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
