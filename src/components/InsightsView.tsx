import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../constants';

interface Props {
  cityName: string;
  unit: 'metric' | 'imperial';
}

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
          <View>
            <Text style={styles.bigText}>Waxing Gibbous</Text>
            <Text style={styles.descText}>84% Illumination</Text>
            <Text style={styles.metaText}>Next Full Moon: in 3 days</Text>
          </View>
          <Text style={styles.largeEmoji}>🌖</Text>
        </View>
      </View>

      {/* Pollen Forecast (Key US Market feature) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>🌸</Text>
          <Text style={styles.cardTitle}>POLLEN & ALLERGY OUTLOOK</Text>
        </View>
        <View style={styles.pollenGrid}>
          <View style={styles.pollenItem}>
            <Text style={styles.pollenLabel}>Tree Pollen</Text>
            <Text style={[styles.pollenBadge, { color: '#FACC15' }]}>Moderate (4.2)</Text>
          </View>
          <View style={styles.pollenItem}>
            <Text style={styles.pollenLabel}>Grass Pollen</Text>
            <Text style={[styles.pollenBadge, { color: '#4ADE80' }]}>Low (1.8)</Text>
          </View>
          <View style={styles.pollenItem}>
            <Text style={styles.pollenLabel}>Ragweed</Text>
            <Text style={[styles.pollenBadge, { color: '#4ADE80' }]}>Very Low (0.5)</Text>
          </View>
        </View>
      </View>

      {/* Barometric Pressure & Comfort Index */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>📉</Text>
          <Text style={styles.cardTitle}>BAROMETRIC PRESSURE TREND</Text>
        </View>
        <Text style={styles.bigText}>{unit === 'imperial' ? '29.92 inHg' : '1013 hPa'}</Text>
        <Text style={styles.descText}>Stable · Typical fair-weather pattern expected over next 48h</Text>
      </View>

      {/* Outdoor & Running Comfort Score */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>🏃</Text>
          <Text style={styles.cardTitle}>OUTDOOR ACTIVITY SCORE</Text>
        </View>
        <View style={styles.activityRow}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>9.2</Text>
            <Text style={styles.scoreMax}>/10</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.activityTitle}>Excellent Conditions</Text>
            <Text style={styles.descText}>Mild temperatures and low wind make it ideal for running and cycling.</Text>
          </View>
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
    fontSize: 22,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  icon: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  moonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bigText: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  descText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 4,
    fontWeight: '600',
  },
  largeEmoji: {
    fontSize: 48,
  },
  pollenGrid: {
    gap: 10,
    marginTop: 4,
  },
  pollenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  pollenLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  pollenBadge: {
    fontSize: 13,
    fontWeight: '700',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderWidth: 2,
    borderColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: '#4ADE80',
    fontSize: 18,
    fontWeight: '800',
  },
  scoreMax: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  activityTitle: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});
