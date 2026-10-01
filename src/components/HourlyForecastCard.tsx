import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONTS, WEATHER_ICONS } from '../constants';
import { HourlyForecastItem } from '../store/weatherStore';

const { width } = Dimensions.get('window');

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
      {/* Glow effect for active */}
      {isFirst && <View style={styles.glowOverlay} />}

      <Text style={[styles.time, isFirst && styles.activeTime]}>
        {isFirst ? 'Now' : item.time}
      </Text>

      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{WEATHER_ICONS[item.icon] || '🌤️'}</Text>
      </View>

      <Text style={[styles.temp, isFirst && styles.activeTemp]}>{displayTemp}°</Text>

      {item.pop !== undefined && item.pop > 0 && (
        <View style={styles.popBadge}>
          <Text style={styles.popText}>{Math.round(item.pop * 100)}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    minWidth: 74,
    height: 140,
    overflow: 'hidden',
  },
  activeCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  glowOverlay: {
    position: 'absolute',
    top: -20,
    left: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    transform: [{ translateX: -20 }],
  },
  time: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeTime: {
    color: COLORS.accent,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  iconContainer: {
    marginVertical: 6,
  },
  icon: {
    fontSize: 28,
  },
  temp: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  activeTemp: {
    color: '#FFF',
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  popBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginTop: 2,
  },
  popText: {
    fontSize: 10,
    color: '#38BDF8',
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});
