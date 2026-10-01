import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, WEATHER_ICONS } from '../constants';
import { DailyForecast } from '../types/weather';
import { useWeatherStore } from '../store/weatherStore';

interface Props {
  item: DailyForecast;
  isToday?: boolean;
  minTempWeek?: number;
  maxTempWeek?: number;
}

export const ForecastCard: React.FC<Props> = ({
  item,
  isToday = false,
  minTempWeek = 50,
  maxTempWeek = 85,
}) => {
  const unit = useWeatherStore((s) => s.unit);

  const displayHigh = unit === 'imperial' ? Math.round((item.high * 9) / 5 + 32) : item.high;
  const displayLow = unit === 'imperial' ? Math.round((item.low * 9) / 5 + 32) : item.low;

  // Calculate percentage offset for Apple Weather style temperature bar
  const totalRange = Math.max(maxTempWeek - minTempWeek, 1);
  const leftPercent = Math.max(0, Math.min(100, ((displayLow - minTempWeek) / totalRange) * 100));
  const rightPercent = Math.max(0, Math.min(100, ((maxTempWeek - displayHigh) / totalRange) * 100));

  // Current temp dot position (for "Today" row)
  const currentTemp = unit === 'imperial'
    ? Math.round((item.high * 9) / 5 + 32) - 3
    : item.high - 2;
  const dotPercent = Math.max(0, Math.min(100, ((currentTemp - minTempWeek) / totalRange) * 100));

  return (
    <View style={[styles.row, isToday && styles.todayRow]}>
      {/* Day Name */}
      <Text style={[styles.dayText, isToday && styles.todayDayText]}>
        {isToday ? 'Today' : item.day}
      </Text>

      {/* Weather Icon & Rain % */}
      <View style={styles.iconColumn}>
        <Text style={styles.icon}>{WEATHER_ICONS[item.condition?.icon] || '🌤️'}</Text>
        {item.humidity > 40 && (
          <Text style={styles.humidityText}>{item.humidity}%</Text>
        )}
      </View>

      {/* Low Temp */}
      <Text style={styles.lowText}>{displayLow}°</Text>

      {/* Temperature Bar */}
      <View style={styles.barTrack}>
        <LinearGradient
          colors={['#38BDF8', '#10B981', '#F59E0B', '#F43F5E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.barFill,
            {
              marginLeft: `${Math.min(leftPercent, 70)}%`,
              marginRight: `${Math.min(rightPercent, 70)}%`,
            },
          ]}
        />
        {/* Current temp dot (Today only) */}
        {isToday && (
          <View style={[styles.currentDot, { left: `${dotPercent}%` }]}>
            <View style={styles.currentDotInner} />
          </View>
        )}
      </View>

      {/* High Temp */}
      <Text style={styles.highText}>{displayHigh}°</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  todayRow: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: 18,
    marginVertical: 2,
    borderBottomWidth: 0,
  },
  dayText: {
    width: 56,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  todayDayText: {
    color: COLORS.accent,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  iconColumn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  humidityText: {
    fontSize: 10,
    color: '#38BDF8',
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginTop: -2,
  },
  lowText: {
    width: 34,
    textAlign: 'right',
    fontSize: 15,
    color: COLORS.textMuted,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginRight: 10,
  },
  barTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    overflow: 'visible',
    justifyContent: 'center',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 14,
  },
  currentDot: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -7,
  },
  currentDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  highText: {
    width: 34,
    textAlign: 'left',
    fontSize: 15,
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginLeft: 10,
  },
});
