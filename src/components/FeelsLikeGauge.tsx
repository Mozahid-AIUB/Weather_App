import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS } from '../constants';

interface Props {
  feelsLike: number;
  actual: number;
  unit: 'metric' | 'imperial';
}

export const FeelsLikeGauge: React.FC<Props> = ({ feelsLike, actual, unit }) => {
  const displayFeels = unit === 'imperial' ? Math.round((feelsLike * 9) / 5 + 32) : Math.round(feelsLike);
  const displayActual = unit === 'imperial' ? Math.round((actual * 9) / 5 + 32) : Math.round(actual);
  const diff = displayFeels - displayActual;

  const getComfort = () => {
    const f = unit === 'imperial' ? displayFeels : displayFeels * 9 / 5 + 32;
    if (f < 32) return { text: 'Freezing', color: '#38BDF8', desc: 'Bundle up — biting wind chill' };
    if (f < 50) return { text: 'Cold', color: '#22D3EE', desc: 'Wear warm layers and coat' };
    if (f < 60) return { text: 'Cool', color: '#14B8A6', desc: 'Light jacket recommended' };
    if (f < 75) return { text: 'Comfortable', color: '#10B981', desc: 'Perfect outdoor weather' };
    if (f < 85) return { text: 'Warm', color: '#F59E0B', desc: 'Stay hydrated, light clothing' };
    if (f < 95) return { text: 'Hot', color: '#F97316', desc: 'Limit outdoor exposure' };
    return { text: 'Extreme Heat', color: '#EF4444', desc: 'Dangerous — stay indoors' };
  };

  const comfort = getComfort();

  // Circular gauge
  const size = 100;
  const strokeW = 6;
  const r = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * r;
  // Map temp to 0-1 (0°F to 120°F range, or -17 to 49°C)
  const minTemp = unit === 'imperial' ? 0 : -17;
  const maxTemp = unit === 'imperial' ? 120 : 49;
  const progress = Math.max(0.02, Math.min(1, (displayFeels - minTemp) / (maxTemp - minTemp)));
  const dashOffset = circumference * (1 - progress * 0.75); // 270° arc

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>🌡️</Text>
        <Text style={styles.title}>FEELS LIKE</Text>
      </View>

      <View style={styles.gaugeContainer}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <SvgGradient id="feelsGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={comfort.color} stopOpacity="0.3" />
              <Stop offset="1" stopColor={comfort.color} stopOpacity="1" />
            </SvgGradient>
          </Defs>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            transform={`rotate(135, ${size / 2}, ${size / 2})`}
          />
          {/* Progress */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#feelsGrad)"
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(135, ${size / 2}, ${size / 2})`}
          />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text style={styles.gaugeValue}>{displayFeels}°</Text>
        </View>
      </View>

      <Text style={[styles.comfortLabel, { color: comfort.color }]}>{comfort.text}</Text>
      <Text style={styles.description}>{comfort.desc}</Text>

      {diff !== 0 && (
        <View style={styles.diffRow}>
          <Text style={styles.diffText}>
            {diff > 0 ? '↑' : '↓'} {Math.abs(diff)}° {diff > 0 ? 'warmer' : 'cooler'} than actual
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  icon: { fontSize: 14 },
  title: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValue: {
    fontSize: 26,
    color: '#FFF',
    fontFamily: FONTS.light,
    fontWeight: '300',
    letterSpacing: -1,
  },
  comfortLabel: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginTop: 2,
  },
  description: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  diffRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  diffText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});
