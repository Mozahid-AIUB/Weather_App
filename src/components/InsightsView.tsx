import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS } from '../constants';

interface Props {
  cityName: string;
  unit: 'metric' | 'imperial';
}

// Reusable ring gauge
const RingGauge: React.FC<{
  value: number;
  maxValue: number;
  color: string;
  size?: number;
  strokeW?: number;
}> = ({ value, maxValue, color, size = 64, strokeW = 5 }) => {
  const r = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.max(0.02, Math.min(1, value / maxValue));
  const dashOffset = circumference * (1 - progress * 0.75);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id={`ring-${color}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeW} strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          transform={`rotate(135, ${size / 2}, ${size / 2})`}
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={`url(#ring-${color})`}
          strokeWidth={strokeW} strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(135, ${size / 2}, ${size / 2})`}
        />
      </Svg>
    </View>
  );
};

export const InsightsView: React.FC<Props> = ({ cityName, unit }) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Weather Insights</Text>
        <Text style={styles.subtitle}>Environmental & Astronomical Analysis · {cityName}</Text>
      </View>

      {/* Moon Phase Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>🌖</Text>
          <Text style={styles.cardTitle}>LUNAR CYCLE</Text>
        </View>
        <View style={styles.moonRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bigText}>Waxing Gibbous</Text>
            <Text style={styles.descText}>84% Illumination</Text>
            <Text style={styles.metaText}>Next Full Moon: in 3 days</Text>
          </View>
          <View style={styles.moonGaugeWrap}>
            <RingGauge value={84} maxValue={100} color="#FBBF24" size={72} />
            <View style={styles.moonGaugeCenter}>
              <Text style={styles.moonEmoji}>🌖</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Pollen Forecast */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>🌸</Text>
          <Text style={styles.cardTitle}>POLLEN & ALLERGY OUTLOOK</Text>
        </View>
        <View style={styles.pollenGrid}>
          {[
            { name: 'Tree Pollen', value: 4.2, level: 'Moderate', color: '#FACC15', max: 10 },
            { name: 'Grass Pollen', value: 1.8, level: 'Low', color: '#4ADE80', max: 10 },
            { name: 'Ragweed', value: 0.5, level: 'Very Low', color: '#4ADE80', max: 10 },
            { name: 'Mold', value: 3.1, level: 'Low-Med', color: '#22D3EE', max: 10 },
          ].map((p, i) => (
            <View key={i} style={styles.pollenItem}>
              <View style={styles.pollenLeft}>
                <Text style={styles.pollenLabel}>{p.name}</Text>
                <Text style={[styles.pollenBadge, { color: p.color }]}>{p.level} ({p.value})</Text>
              </View>
              {/* Mini progress bar */}
              <View style={styles.pollenBar}>
                <View style={[styles.pollenBarFill, { width: `${(p.value / p.max) * 100}%`, backgroundColor: p.color }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Barometric Pressure & Comfort Index */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>📉</Text>
          <Text style={styles.cardTitle}>BAROMETRIC PRESSURE TREND</Text>
        </View>
        <View style={styles.pressureRow}>
          <View>
            <Text style={styles.bigText}>{unit === 'imperial' ? '29.92 inHg' : '1013 hPa'}</Text>
            <Text style={styles.descText}>Stable · Fair-weather pattern next 48h</Text>
          </View>
          <View style={styles.pressureGaugeWrap}>
            <RingGauge value={1013} maxValue={1050} color="#6366F1" size={56} />
            <View style={styles.pressureGaugeCenter}>
              <Text style={styles.pressureGaugeText}>📊</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Outdoor & Running Comfort Score */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>🏃</Text>
          <Text style={styles.cardTitle}>OUTDOOR ACTIVITY SCORE</Text>
        </View>
        <View style={styles.activityRow}>
          <View style={styles.scoreRingWrap}>
            <RingGauge value={9.2} maxValue={10} color="#4ADE80" size={72} strokeW={6} />
            <View style={styles.scoreCenter}>
              <Text style={styles.scoreText}>9.2</Text>
              <Text style={styles.scoreMax}>/10</Text>
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.activityTitle}>Excellent Conditions</Text>
            <Text style={styles.descText}>Mild temperatures and low wind make it ideal for running, cycling, and outdoor dining.</Text>
          </View>
        </View>
      </View>

      {/* Humidity Comfort */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>💧</Text>
          <Text style={styles.cardTitle}>HUMIDITY COMFORT INDEX</Text>
        </View>
        <View style={styles.humidityRow}>
          {[
            { label: 'Indoor', value: '42%', status: 'Comfortable', color: '#10B981' },
            { label: 'Outdoor', value: '65%', status: 'Moderate', color: '#FBBF24' },
            { label: 'Dew Point', value: '54°', status: 'Tolerable', color: '#22D3EE' },
          ].map((h, i) => (
            <View key={i} style={styles.humidityItem}>
              <Text style={styles.humidityValue}>{h.value}</Text>
              <Text style={[styles.humidityStatus, { color: h.color }]}>{h.status}</Text>
              <Text style={styles.humidityLabel}>{h.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 110 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: COLORS.textPrimary,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  icon: { fontSize: 14 },
  cardTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  moonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moonGaugeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonGaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonEmoji: {
    fontSize: 26,
  },
  bigText: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  descText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 18,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginTop: 4,
  },
  pollenGrid: {
    gap: 8,
  },
  pollenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  pollenLeft: {
    width: 140,
  },
  pollenLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  pollenBadge: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginTop: 1,
  },
  pollenBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginLeft: 12,
  },
  pollenBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  pressureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pressureGaugeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressureGaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressureGaugeText: {
    fontSize: 18,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  scoreRingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    color: '#4ADE80',
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  scoreMax: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginTop: -2,
  },
  activityTitle: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  humidityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  humidityItem: {
    alignItems: 'center',
  },
  humidityValue: {
    fontSize: 22,
    color: '#FFF',
    fontFamily: FONTS.light,
    fontWeight: '300',
  },
  humidityStatus: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginTop: 2,
  },
  humidityLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
