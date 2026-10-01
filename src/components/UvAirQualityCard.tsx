import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS } from '../constants';

interface Props {
  uvIndex?: number;
  humidity?: number;
  dewPoint?: number;
  unit?: 'metric' | 'imperial';
}

// Circular gauge sub-component
const MiniGauge: React.FC<{
  value: number;
  maxValue: number;
  color: string;
  size?: number;
}> = ({ value, maxValue, color, size = 56 }) => {
  const strokeW = 4;
  const r = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.max(0.02, Math.min(1, value / maxValue));
  const dashOffset = circumference * (1 - progress * 0.75);

  return (
    <Svg width={size} height={size}>
      <Defs>
        <SvgGradient id={`gauge-${color}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.4" />
          <Stop offset="1" stopColor={color} stopOpacity="1" />
        </SvgGradient>
      </Defs>
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        transform={`rotate(135, ${size / 2}, ${size / 2})`}
      />
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={`url(#gauge-${color})`}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        strokeDashoffset={dashOffset}
        transform={`rotate(135, ${size / 2}, ${size / 2})`}
      />
    </Svg>
  );
};

export const UvAirQualityCard: React.FC<Props> = ({
  uvIndex = 5,
  humidity = 65,
  dewPoint = 18,
  unit = 'imperial',
}) => {
  const getUvLevel = (uv: number) => {
    if (uv <= 2) return { text: 'Low', color: '#34D399', desc: 'No protection needed' };
    if (uv <= 5) return { text: 'Moderate', color: '#FBBF24', desc: 'Wear sun protection' };
    if (uv <= 7) return { text: 'High', color: '#FB923C', desc: 'Protection essential' };
    if (uv <= 10) return { text: 'Very High', color: '#F87171', desc: 'Take extra precautions' };
    return { text: 'Extreme', color: '#C084FC', desc: 'Avoid outdoor sun' };
  };

  const getAqiLevel = (hum: number) => {
    if (hum < 50) return { aqi: 28, text: 'Good', color: '#34D399', desc: 'Air quality is ideal' };
    if (hum < 70) return { aqi: 54, text: 'Moderate', color: '#FBBF24', desc: 'Acceptable for most' };
    return { aqi: 112, text: 'Unhealthy', color: '#FB923C', desc: 'Sensitive groups take care' };
  };

  const uvInfo = getUvLevel(uvIndex);
  const aqiInfo = getAqiLevel(humidity);

  return (
    <View style={styles.container}>
      {/* UV Index Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>☀️</Text>
          <Text style={styles.title}>UV INDEX</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.gaugeRow}>
            <View style={styles.gaugeWrap}>
              <MiniGauge value={uvIndex} maxValue={11} color={uvInfo.color} />
              <View style={styles.gaugeCenter}>
                <Text style={styles.value}>{uvIndex}</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.badge, { color: uvInfo.color }]}>{uvInfo.text}</Text>
          <Text style={styles.descText} numberOfLines={1}>{uvInfo.desc}</Text>
        </View>
      </View>

      {/* Air Quality Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>🍃</Text>
          <Text style={styles.title}>AIR QUALITY</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.gaugeRow}>
            <View style={styles.gaugeWrap}>
              <MiniGauge value={aqiInfo.aqi} maxValue={200} color={aqiInfo.color} />
              <View style={styles.gaugeCenter}>
                <Text style={styles.value}>{aqiInfo.aqi}</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.badge, { color: aqiInfo.color }]}>{aqiInfo.text}</Text>
          <Text style={styles.descText} numberOfLines={1}>{aqiInfo.desc}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 180,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: { fontSize: 14 },
  title: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  content: {
    marginTop: 6,
    alignItems: 'center',
  },
  gaugeRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  gaugeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  badge: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginTop: 2,
  },
  descText: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
});
