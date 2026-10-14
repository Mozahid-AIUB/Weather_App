import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Theme, useStyles, useTheme } from '../theme/ThemeProvider';
import { AlertPrefs, Appearance, Unit, useSettingsStore } from '../store/settingsStore';
import { useWeatherStore } from '../store/weatherStore';
import { useNotificationStore } from '../store/notificationStore';
import { buildEveningBrief, buildMorningBrief } from '../services/alertEngine';
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

const ABOUT_POINTS: { icon: GlyphName; motion: Motion; title: string; text: string }[] = [
  { icon: 'map-marker-radius-outline', motion: 'float', title: 'Weather for exactly where you are', text: 'Down to your neighbourhood, town or village.' },
  { icon: 'update', motion: 'spin', title: 'Always up to date', text: 'Conditions refresh every 10 minutes while the app is open.' },
  { icon: 'bell-ring-outline', motion: 'ring', title: 'Alerts only when it matters', text: 'Rain, storms, heat and strong wind. No noise in between.' },
  { icon: 'shield-check-outline', motion: 'pulse', title: 'No account needed', text: 'Your location is used only for your weather and alerts.' },
];

const MORNING_HOURS = [6, 7, 8, 9];
const EVENING_HOURS = [18, 19, 20, 21];
const hourLabel = (h: number) => `${h % 12 || 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;

/** One daily message: on/off switch and the hour it arrives. */
const DailyRow: React.FC<{
  icon: GlyphName;
  tint: string;
  label: string;
  sub: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  hours: number[];
  hour: number;
  onHour: (h: number) => void;
}> = ({ icon, tint, label, sub, on, onToggle, hours, hour, onHour }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: `${tint}1F` }]}>
          <AnimatedGlyph name={icon} size={18} color={tint} motion={on ? 'pulse' : 'none'} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowSub}>{sub}</Text>
        </View>
        <Toggle value={on} onChange={onToggle} />
      </View>
      {on && (
        <View style={styles.hours}>
          {hours.map((h) => {
            const active = hour === h;
            return (
              <PressableScale key={h} onPress={() => onHour(h)} scaleTo={0.92} style={[styles.hour, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                <Text style={[styles.hourText, active && { color: colors.onAccent }]}>{hourLabel(h)}</Text>
              </PressableScale>
            );
          })}
        </View>
      )}
    </View>
  );
};

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

  const [previewKind, setPreviewKind] = useState<'morning' | 'evening'>(new Date().getHours() >= 15 ? 'evening' : 'morning');
  const tz = current?.timezone;
  const preview =
    place && current
      ? previewKind === 'morning'
        ? buildMorningBrief({ place, current, forecast, unit: s.unit, userName: s.userName, dateKey: cityDateKey(current.dt, tz), tz })
        : buildEveningBrief({ place, forecast, unit: s.unit, userName: s.userName, tomorrowKey: cityDateKey(current.dt + 86400, tz), tz })
      : null;

  const sendTest = () => {
    if (!preview || !place) return;
    haptic.success();
    const kind = previewKind === 'morning' ? 'brief' : 'evening';
    ingest([{ id: `test:${Date.now()}`, kind, severity: 'info', title: preview.title, body: preview.body, city: place.name }]);
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

        <Card title="Daily messages" icon="weather-sunset" iconMotion="float" tint={colors.icon.sun} delay={180}>
          <DailyRow
            icon="white-balance-sunny"
            tint={colors.icon.sun}
            label="Good morning"
            sub="Today's forecast, rain timing and what to carry"
            on={s.morningBrief}
            onToggle={s.setMorningBrief}
            hours={MORNING_HOURS}
            hour={s.briefHour}
            onHour={s.setBriefHour}
          />
          <View style={styles.rowDivider} />
          <DailyRow
            icon="weather-night"
            tint={colors.accent}
            label="Good evening"
            sub="How tonight goes and what tomorrow needs"
            on={s.eveningBrief}
            onToggle={s.setEveningBrief}
            hours={EVENING_HOURS}
            hour={s.eveningHour}
            onHour={s.setEveningHour}
          />
          {preview && (s.morningBrief || s.eveningBrief) && (
            <View style={styles.preview}>
              <Segmented<'morning' | 'evening'>
                value={previewKind}
                onChange={setPreviewKind}
                options={[
                  { value: 'morning', label: 'Morning', icon: 'white-balance-sunny' },
                  { value: 'evening', label: 'Evening', icon: 'weather-night' },
                ]}
              />
              <Text style={[styles.previewTitle, styles.previewGap]}>{preview.title}</Text>
              <Text style={styles.previewBody}>{preview.body}</Text>
              <PressableScale onPress={sendTest} style={styles.test}>
                <AnimatedGlyph name="send-outline" size={15} color={colors.accent} motion="sway" />
                <Text style={styles.testText}>Send it to me now</Text>
              </PressableScale>
            </View>
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

        <Card title="About WeatherNow" icon="information-outline" iconMotion="breathe" delay={360}>
          <Text style={styles.aboutLead}>Your weather, explained simply, so you always know what the day has in store.</Text>
          {ABOUT_POINTS.map((a, i) => (
            <View key={a.title} style={styles.aboutRow}>
              <View style={[styles.rowIcon, { backgroundColor: `${colors.accent}1F` }]}>
                <AnimatedGlyph name={a.icon} size={18} color={colors.accent} motion={a.motion} delay={i * 180} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{a.title}</Text>
                <Text style={styles.rowSub}>{a.text}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.credits}>Version 1.0.0 · Weather data by OpenWeather and Open-Meteo · Radar by RainViewer</Text>
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
    previewGap: { marginTop: spacing.md },
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
    aboutLead: {
      fontFamily: fonts.medium,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    aboutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    credits: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 16,
      color: colors.textMuted,
      marginTop: spacing.md,
    },
    about: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
      color: colors.text,
    },
  });
