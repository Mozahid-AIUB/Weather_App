import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, WEATHER_ICONS } from '../constants';
import { HourlyForecastItem } from '../store/weatherStore';

interface Props {
  item: HourlyForecastItem;
  isFirst?: boolean;
  unit?: 'metric' | 'imperial';
}

export const HourlyForecastCard: React.FC<Props> = ({ item, isFirst = false, unit = 'imperial' }) => {
  const displayTemp = unit === 'imperial' 
    ? Math.round((item.temp * 9) / 5 + 32)
    : item.temp;

  return (
    <View style={[styles.card, isFirst && styles.activeCard]}>
      <Text style={[styles.time, isFirst && styles.activeTime]}>
        {isFirst ? 'Now' : item.time}
      </Text>
      <Text style={styles.icon}>{WEATHER_ICONS[item.icon] || '🌤️'}</Text>
      <Text style={[styles.temp, isFirst && styles.activeTemp]}>{displayTemp}°</Text>
      {item.pop !== undefined && item.pop > 0 && (
        <Text style={styles.popText}>{Math.round(item.pop * 100)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 72,
    height: 128,
  },
  activeCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: 'rgba(56, 189, 248, 0.45)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  time: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeTime: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  icon: {
    fontSize: 26,
    marginVertical: 4,
  },
  temp: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  activeTemp: {
    color: '#FFF',
    fontWeight: '800',
  },
  popText: {
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '700',
    marginTop: 2,
  },
});
