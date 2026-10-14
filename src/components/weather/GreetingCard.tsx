import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { Card } from '../ui/Card';
import type { GlyphName, Motion } from '../ui/AnimatedGlyph';
import type { CurrentWeather, ForecastItem, Place } from '../../types/weather';
import type { Unit } from '../../store/settingsStore';
import { buildEveningBrief, buildMorningBrief } from '../../services/alertEngine';
import { cityDateKey, greetingName } from '../../utils/format';

interface Props {
  place: Place;
  current: CurrentWeather;
  forecast: ForecastItem[];
  unit: Unit;
  userName: string;
  now: number;
  delay?: number;
}

const greetingFor = (hour: number): { text: string; icon: GlyphName; motion: Motion; tomorrow: boolean } => {
  if (hour >= 5 && hour < 12) return { text: 'Good morning', icon: 'white-balance-sunny', motion: 'spin', tomorrow: false };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon', icon: 'weather-sunny', motion: 'pulse', tomorrow: false };
  if (hour >= 17 && hour < 21) return { text: 'Good evening', icon: 'weather-sunset', motion: 'float', tomorrow: true };
  return { text: 'Good night', icon: 'weather-night', motion: 'breathe', tomorrow: true };
};

/** Personal daily note: today's outlook in the morning, tomorrow's from the evening on. */
export const GreetingCard: React.FC<Props> = ({ place, current, forecast, unit, userName, now, delay = 0 }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const g = greetingFor(new Date(now).getHours());
  const tz = current.timezone;
  const dateKey = cityDateKey(Math.floor(now / 1000) + (g.tomorrow ? 86400 : 0), tz);
  const brief = g.tomorrow
    ? buildEveningBrief({ place, forecast, unit, userName, tomorrowKey: dateKey, tz })
    : buildMorningBrief({ place, current, forecast, unit, userName, dateKey, tz });
  if (!brief) return null;

  const name = greetingName(userName);

  return (
    <Card
      title={g.tomorrow ? 'Tomorrow at a glance' : 'Your day at a glance'}
      icon={g.icon}
      iconMotion={g.motion}
      tint={g.tomorrow ? colors.accent : colors.icon.sun}
      delay={delay}
    >
      <Text style={styles.greeting}>
        {g.text}
        {name ? `, ${name}` : ''}
      </Text>
      <Text style={styles.body}>{brief.body}</Text>
    </Card>
  );
};

const makeStyles = ({ colors, fonts }: Theme) =>
  StyleSheet.create({
    greeting: {
      fontFamily: fonts.semiBold,
      fontSize: 19,
      color: colors.text,
      marginBottom: 6,
      letterSpacing: -0.2,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: 15,
      lineHeight: 23,
      color: colors.textSecondary,
    },
  });
