import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { COLORS, FONTS } from '../constants';

interface Props {
  unit: 'metric' | 'imperial';
  onToggleUnit: () => void;
}

export const SettingsView: React.FC<Props> = ({ unit, onToggleUnit }) => {
  const [severeAlerts, setSevereAlerts] = useState(true);
  const [rainAlerts, setRainAlerts] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [highPrecisionGps, setHighPrecisionGps] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const SettingRow: React.FC<{
    icon: string;
    label: string;
    subLabel: string;
    value: boolean;
    onToggle: (v: boolean) => void;
  }> = ({ icon, label, subLabel, value, onToggle }) => (
    <View style={styles.row}>
      <View style={styles.rowIconWrap}>
        <Text style={styles.rowIcon}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSubLabel}>{subLabel}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(255,255,255,0.08)', true: 'rgba(56,189,248,0.4)' }}
        thumbColor={value ? COLORS.accent : '#64748B'}
        ios_backgroundColor="rgba(255,255,255,0.08)"
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Preferences</Text>
        <Text style={styles.subtitle}>Customize your weather experience</Text>
      </View>

      {/* Units Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>UNITS OF MEASUREMENT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.unitRow} onPress={onToggleUnit} activeOpacity={0.7}>
            <View style={styles.rowIconWrap}>
              <Text style={styles.rowIcon}>🌡️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Temperature Unit</Text>
              <Text style={styles.rowSubLabel}>
                {unit === 'imperial' ? 'Fahrenheit (°F) · US Standard' : 'Celsius (°C) · Metric Standard'}
              </Text>
            </View>
            <View style={styles.unitPill}>
              <Text style={styles.unitPillText}>{unit === 'imperial' ? '°F' : '°C'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PUSH NOTIFICATIONS & ALERTS</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🚨"
            label="Severe Weather Alerts"
            subLabel="NWS warnings, tornados & hurricanes"
            value={severeAlerts}
            onToggle={setSevereAlerts}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🌧️"
            label="Rain Anticipation"
            subLabel="Notified 15 min before precipitation"
            value={rainAlerts}
            onToggle={setRainAlerts}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="☀️"
            label="Daily Morning Briefing"
            subLabel="7:30 AM high, low & rain chance"
            value={dailyBriefing}
            onToggle={setDailyBriefing}
          />
        </View>
      </View>

      {/* System */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SYSTEM & EXPERIENCE</Text>
        <View style={styles.card}>
          <SettingRow
            icon="📍"
            label="High-Precision GPS"
            subLabel="Hyper-local neighborhood resolution"
            value={highPrecisionGps}
            onToggle={setHighPrecisionGps}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📳"
            label="Haptic Feedback"
            subLabel="Subtle vibrations on interactions"
            value={hapticFeedback}
            onToggle={setHapticFeedback}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🌙"
            label="Dark Mode"
            subLabel="Premium obsidian dark theme"
            value={darkMode}
            onToggle={setDarkMode}
          />
        </View>
      </View>

      {/* App Version Info */}
      <View style={styles.aboutCard}>
        <View style={styles.aboutLogoRow}>
          <Text style={styles.aboutEmoji}>⛅</Text>
          <View>
            <Text style={styles.aboutTitle}>WeatherNow Ultra</Text>
            <Text style={styles.aboutVersion}>Version 2.0 · Build 2026.10</Text>
          </View>
        </View>
        <View style={styles.aboutDivider} />
        <Text style={styles.aboutText}>
          Engineered for iOS & Android · US Market Edition{'\n'}
          OpenWeather API · NestJS Cloud · PostgreSQL{'\n'}
          Designed with ❤️ for premium weather experience
        </Text>
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
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIcon: {
    fontSize: 18,
  },
  rowLabel: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  rowSubLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginVertical: 6,
    marginLeft: 48,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  unitPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  unitPillText: {
    color: COLORS.accent,
    fontSize: 15,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  aboutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  aboutLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aboutEmoji: {
    fontSize: 36,
  },
  aboutTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  aboutVersion: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 1,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
  },
  aboutText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    lineHeight: 20,
  },
});
