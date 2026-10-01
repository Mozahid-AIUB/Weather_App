import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface Props {
  uvIndex?: number;
  humidity?: number;
  dewPoint?: number;
  unit?: 'metric' | 'imperial';
}

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
          <Text style={styles.value}>{uvIndex}</Text>
          <Text style={[styles.badge, { color: uvInfo.color }]}>{uvInfo.text}</Text>
          
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(uvIndex * 9.5, 100)}%`, backgroundColor: uvInfo.color },
              ]}
            />
          </View>
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
          <View style={styles.valueRow}>
            <Text style={styles.value}>{aqiInfo.aqi}</Text>
            <Text style={styles.aqiUnit}>AQI</Text>
          </View>
          <Text style={[styles.badge, { color: aqiInfo.color }]}>{aqiInfo.text}</Text>
          
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min((aqiInfo.aqi / 160) * 100, 100)}%`, backgroundColor: aqiInfo.color },
              ]}
            />
          </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 145,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  content: {
    marginTop: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 26,
    color: COLORS.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  aqiUnit: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  descText: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
});
