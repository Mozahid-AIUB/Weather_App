import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, WEATHER_ICONS } from '../constants';
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
          colors={['#38BDF8', '#F59E0B', '#F43F5E']}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  todayRow: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: 16,
    marginVertical: 2,
    borderBottomWidth: 0,
  },
  dayText: {
    width: 60,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  todayDayText: {
    color: COLORS.accent,
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
    fontWeight: '700',
    marginTop: -2,
  },
  lowText: {
    width: 34,
    textAlign: 'right',
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginRight: 10,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 12,
  },
  highText: {
    width: 34,
    textAlign: 'left',
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginLeft: 10,
  },
});
