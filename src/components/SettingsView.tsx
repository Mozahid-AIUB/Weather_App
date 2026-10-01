import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants';

interface Props {
  unit: 'metric' | 'imperial';
  onToggleUnit: () => void;
}

export const SettingsView: React.FC<Props> = ({ unit, onToggleUnit }) => {
  const [severeAlerts, setSevereAlerts] = useState(true);
  const [rainAlerts, setRainAlerts] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [highPrecisionGps, setHighPrecisionGps] = useState(true);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Preferences & Alerts</Text>
        <Text style={styles.subtitle}>Customize US Weather Notifications & Units</Text>
      </View>

      {/* Units Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>UNITS OF MEASUREMENT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={onToggleUnit}>
            <View>
              <Text style={styles.rowLabel}>Temperature Unit</Text>
              <Text style={styles.rowSubLabel}>{unit === 'imperial' ? 'Fahrenheit (°F) · US Standard' : 'Celsius (°C) · Metric Standard'}</Text>
            </View>
            <View style={styles.unitPill}>
              <Text style={styles.unitPillText}>{unit === 'imperial' ? '°F' : '°C'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* US Weather Alerts & Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PUSH NOTIFICATIONS & RADAR ALERTS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>🚨 Severe Weather Alerts</Text>
              <Text style={styles.rowSubLabel}>National Weather Service (NWS) warnings & tornados</Text>
            </View>
            <Switch
              value={severeAlerts}
              onValueChange={setSevereAlerts}
              trackColor={{ false: '#334155', true: COLORS.accent }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>🌧️ Precipitation / Rain Radar</Text>
              <Text style={styles.rowSubLabel}>Get notified 15 minutes before rain starts in your area</Text>
            </View>
            <Switch
              value={rainAlerts}
              onValueChange={setRainAlerts}
              trackColor={{ false: '#334155', true: COLORS.accent }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>☀️ Daily Morning Briefing</Text>
              <Text style={styles.rowSubLabel}>7:30 AM summary of the day's high, low & rain chance</Text>
            </View>
            <Switch
              value={dailyBriefing}
              onValueChange={setDailyBriefing}
              trackColor={{ false: '#334155', true: COLORS.accent }}
              thumbColor="#FFF"
            />
          </View>
        </View>
      </View>

      {/* Location & Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>LOCATION & RADAR PRECISION</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>📍 High-Precision GPS</Text>
              <Text style={styles.rowSubLabel}>Hyper-local neighborhood radar resolution</Text>
            </View>
            <Switch
              value={highPrecisionGps}
              onValueChange={setHighPrecisionGps}
              trackColor={{ false: '#334155', true: COLORS.accent }}
              thumbColor="#FFF"
            />
          </View>
        </View>
      </View>

      {/* App Version Info */}
      <View style={styles.card}>
        <Text style={styles.aboutTitle}>WeatherNow Ultra v1.2</Text>
        <Text style={styles.aboutText}>Engineered for iOS App Store & Google Play Store (US Market Edition). Integrated with OpenWeather & NestJS Cloud Architecture.</Text>
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
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  rowSubLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
  unitPill: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  unitPillText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  aboutTitle: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  aboutText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
