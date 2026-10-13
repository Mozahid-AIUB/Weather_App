import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Theme, useStyles, useTheme } from '../theme/ThemeProvider';
import { AlertPrefs, Appearance, Unit, useSettingsStore } from '../store/settingsStore';
import { useWeatherStore } from '../store/weatherStore';
import { useNotificationStore } from '../store/notificationStore';
import { buildMorningBrief } from '../services/alertEngine';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Card } from '../components/ui/Card';
import { Segmented } from '../components/ui/Segmented';
import { PressableScale } from '../components/ui/PressableScale';
import { AnimatedGlyph, GlyphName, Motion } from '../components/ui/AnimatedGlyph';
import { PushStatus } from '../components/notifications/NotificationCenter';
import { NameCard } from '../components/settings/NameCard';
import { DeveloperCard } from '../components/settings/DeveloperCard';
import { notificationService } from '../services/notificationService';
import { TAB_BAR_SPACE } from '../components/TabBar';
import { cityDateKey } from '../utils/format';
import { haptic } from '../utils/haptics';

interface Props {
  onOpenNotifications: () => void;
}

const ALERT_ROWS: { key: keyof AlertPrefs; label: string; sub: string; icon: GlyphName; motion: Motion }[] = [
  { key: 'storm', label: 'Storms & lightning', sub: 'Thunderstorms now or in the next 12 hours', icon: 'weather-lightning', motion: 'blink' },
  { key: 'rain', label: 'Rain & snow', sub: 'Heads-up before it starts', icon: 'umbrella-outline', motion: 'swing' },
  { key: 'temperature', label: 'Heat & cold', sub: 'When it feels dangerously hot or freezing', icon: 'thermometer-alert', motion: 'pulse' },
  { key: 'wind', label: 'Strong wind', sub: 'Gusts strong enough to matter', icon: 'weather-windy', motion: 'sway' },
  { key: 'change', label: 'Sudden changes', sub: 'Clear to rain, fog rolling in and more', icon: 'swap-horizontal', motion: 'sway' },
];

const BRIEF_HOURS = [6, 7, 8, 9];

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={(v) => {
        haptic.tap();
        onChange(v);
      }}
      trackColor={{ false: colors.surfaceSunken, true: colors.accent }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.surfaceSunken}
      // react-native-web colours the thumb from its own prop
      {...({ activeThumbColor: '#FFFFFF' } as object)}
    />
  );
};

export const SettingsScreen: React.FC<Props> = ({ onOpenNotifications }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const s = useSettingsStore();
  const { place, current, forecast } = useWeatherStore();
  const ingest = useNotificationStore((st) => st.ingest);
  const permission = useNotificationStore((st) => st.permission);
  // Push controls only matter where system notifications exist (web or an installed build).
  const showPush = notificationService.support() !== 'none' && permission !== 'unsupported';

  const preview =
    place && current
      ? buildMorningBrief({ place, current, forecast, unit: s.unit, userName: s.userName, dateKey: cityDateKey(current.dt, current.timezone), tz: current.timezone })
      : null;

  const sendTest = () => {
    if (!preview || !place) return;
    haptic.success();
    ingest([{ id: `test:${Date.now()}`, kind: 'brief', severity: 'info', title: preview.title, body: preview.body, city: place.name }]);
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Settings" subtitle="Make WeatherNow yours" onBellPress={onOpenNotifications} />
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <NameCard delay={0} />

        <Card title="Appearance" icon="theme-light-dark" iconMotion="spin" delay={60}>
          <Segmented<Appearance>
            value={s.appearance}
            onChange={s.setAppearance}
            options={[
              { value: 'auto', label: 'Auto', icon: 'weather-sunset' },
              { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
              { value: 'dark', label: 'Dark', icon: 'weather-night' },
            ]}
          />
          <Text style={styles.hint}>
            Auto follows the sun where you are: a warm cream look from sunrise, moonlit dark after sunset.
          </Text>
        </Card>

        <Card title="Units" icon="thermometer" iconMotion="float" delay={120}>
          <Segmented<Unit>
            value={s.unit}
            onChange={s.setUnit}
            options={[
              { value: 'metric', label: '°C · km/h' },
              { value: 'imperial', label: '°F · mph' },
            ]}
          />
        </Card>

        <Card title="Morning brief" icon="white-balance-sunny" iconMotion="spin" tint={colors.icon.sun} delay={180}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Good-morning notification</Text>
              <Text style={styles.rowSub}>Today's forecast, rain timing and what to carry</Text>
            </View>
            <Toggle value={s.morningBrief} onChange={s.setMorningBrief} />
          </View>
          {s.morningBrief && (
            <>
              <View style={styles.hours}>
                {BRIEF_HOURS.map((h) => {
                  const on = s.briefHour === h;
                  return (
                    <PressableScale key={h} onPress={() => s.setBriefHour(h)} scaleTo={0.92} style={[styles.hour, on && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                      <Text style={[styles.hourText, on && { color: colors.onAccent }]}>{h}:00 AM</Text>
                    </PressableScale>
                  );
                })}
              </View>
              {preview && (
                <View style={styles.preview}>
                  <Text style={styles.previewTitle}>{preview.title}</Text>
                  <Text style={styles.previewBody}>{preview.body}</Text>
                  <PressableScale onPress={sendTest} style={styles.test}>
                    <AnimatedGlyph name="send-outline" size={15} color={colors.accent} motion="sway" />
                    <Text style={styles.testText}>Send it to me now</Text>
                  </PressableScale>
                </View>
              )}
            </>
          )}
        </Card>

        <Card title="Alerts" icon="bell-ring-outline" iconMotion="ring" delay={240}>
          {ALERT_ROWS.map((r, i) => (
            <View key={r.key} style={[styles.row, i > 0 && styles.rowDivider]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.surfaceSunken }]}>
                <AnimatedGlyph name={r.icon} size={18} color={colors.textSecondary} motion={s.alerts[r.key] ? r.motion : 'none'} delay={i * 150} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowSub}>{r.sub}</Text>
              </View>
              <Toggle value={s.alerts[r.key]} onChange={(v) => s.setAlert(r.key, v)} />
            </View>
          ))}
          {showPush && (
            <View style={styles.push}>
              <PushStatus />
            </View>
          )}
        </Card>

        <DeveloperCard delay={300} />

        <Card title="About" icon="information-outline" iconMotion="breathe" delay={360}>
          <Text style={styles.about}>WeatherNow · Version 1.0.0</Text>
          <Text style={styles.hint}>
            Forecasts from OpenWeather and Open-Meteo, live radar from RainViewer, place names from OpenStreetMap / GeoNames. Conditions refresh every 10 minutes while the app is open.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const makeStyles = ({ colors, fonts, spacing, radius }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 19,
      color: colors.textMuted,
      marginTop: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      paddingTop: spacing.md,
      marginTop: spacing.xs,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1 },
    rowLabel: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
      color: colors.text,
    },
    rowSub: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      color: colors.textMuted,
      marginTop: 1,
    },
    hours: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    hour: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 9,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSunken,
    },
    hourText: {
      fontFamily: fonts.semiBold,
      fontSize: 12.5,
      color: colors.textSecondary,
    },
    preview: {
      marginTop: spacing.lg,
      padding: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSunken,
    },
    previewTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    previewBody: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
    },
    test: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      marginTop: spacing.md,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
    },
    testText: {
      fontFamily: fonts.semiBold,
      fontSize: 13,
      color: colors.accent,
    },
    push: {
      marginTop: spacing.md,
      marginBottom: -spacing.lg,
    },
    about: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
      color: colors.text,
    },
  });
