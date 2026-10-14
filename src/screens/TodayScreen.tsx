import React, { useEffect } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme, useStyles, useTheme } from '../theme/ThemeProvider';
import { useWeatherStore } from '../store/weatherStore';
import { useSettingsStore } from '../store/settingsStore';
import { useNotificationStore } from '../store/notificationStore';
import { useNow } from '../hooks/useNow';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PressableScale } from '../components/ui/PressableScale';
import { AnimatedGlyph } from '../components/ui/AnimatedGlyph';
import { Skeleton } from '../components/ui/Skeleton';
import { Hero } from '../components/weather/Hero';
import { GreetingCard } from '../components/weather/GreetingCard';
import { HourlyCard } from '../components/weather/HourlyCard';
import { DailyCard } from '../components/weather/DailyCard';
import { DetailsGrid } from '../components/weather/DetailsGrid';
import { SunCard } from '../components/weather/SunCard';
import { AlertBanner } from '../components/notifications/AlertBanner';
import { TAB_BAR_SPACE } from '../components/TabBar';
import { timeAgo } from '../utils/format';

interface Props {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
}

const ACTIVE_ALERT_MS = 6 * 60 * 60 * 1000;

/** "● Live · updated 2m ago" with a breathing dot. */
const LiveLine: React.FC<{ region?: string; isGps: boolean; updated: string }> = ({ region, isGps, updated }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400 }), -1, false);
    return () => cancelAnimation(pulse);
  }, []);
  const ring = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 1.6 }] }));

  return (
    <View style={styles.liveRow}>
      {isGps && <MaterialCommunityIcons name="navigation-variant" size={12} color={colors.accent} />}
      {region ? (
        <Text style={styles.liveText} numberOfLines={1}>
          {region}
        </Text>
      ) : null}
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.dotRing, { backgroundColor: colors.success }, ring]} />
        <View style={[styles.dot, { backgroundColor: colors.success }]} />
      </View>
      <Text style={styles.liveText}>Live · {updated}</Text>
    </View>
  );
};

/** Placeholder layout shown while the first or a newly chosen place loads. */
const TodaySkeleton: React.FC = () => {
  const styles = useStyles(makeStyles);
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.flex}>
      <View style={styles.skelHero}>
        <Skeleton width={128} height={128} radius={64} />
        <Skeleton width={150} height={84} radius={22} style={styles.skelGap} />
        <Skeleton width={120} height={18} style={styles.skelGapSm} />
        <View style={styles.skelPills}>
          <Skeleton width={110} height={32} radius={16} />
          <Skeleton width={120} height={32} radius={16} />
        </View>
      </View>
      {[0, 1].map((i) => (
        <View key={i} style={styles.skelCard}>
          <Skeleton width={130} height={14} />
          <Skeleton height={16} style={styles.skelGap} />
          <Skeleton width="70%" height={16} style={styles.skelGapSm} />
        </View>
      ))}
    </Animated.View>
  );
};

/** Header subtitle while loading. */
const LoadingLine: React.FC = () => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.liveRow}>
      <ActivityIndicator size="small" color={colors.accent} style={styles.spinner} />
      <Text style={styles.liveText}>Loading weather…</Text>
    </View>
  );
};

const ErrorState: React.FC<{ message: string; onRetry: () => void; onSearch: () => void }> = ({ message, onRetry, onSearch }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.center}>
      <AnimatedGlyph name="cloud-off-outline" size={64} color={colors.textMuted} motion="float" />
      <Text style={styles.centerTitle}>No weather right now</Text>
      <Text style={styles.centerBody}>{message}</Text>
      <View style={styles.centerActions}>
        <PressableScale onPress={onRetry} style={[styles.button, { backgroundColor: colors.accent }]}>
          <Text style={[styles.buttonText, { color: colors.onAccent }]}>Try again</Text>
        </PressableScale>
        <PressableScale onPress={onSearch} style={[styles.button, styles.buttonGhost]}>
          <Text style={styles.buttonText}>Search a place</Text>
        </PressableScale>
      </View>
    </Animated.View>
  );
};

export const TodayScreen: React.FC<Props> = ({ onOpenSearch, onOpenNotifications }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const { place, pending, current, forecast, hourly, daily, status, error, isRefreshing, lastUpdated, isGps, refresh, locate } = useWeatherStore();
  const unit = useSettingsStore((s) => s.unit);
  const userName = useSettingsStore((s) => s.userName);
  const items = useNotificationStore((s) => s.items);
  const now = useNow(30000);

  // First load, or a newly chosen place still on its way: name it right away and show a skeleton.
  if (!current || !place || pending) {
    const title = pending ? pending.name || 'Current location' : place?.name || 'WeatherNow';
    return (
      <View style={styles.flex}>
        <ScreenHeader title={title} subtitle={status === 'error' ? undefined : <LoadingLine />} onTitlePress={onOpenSearch} onBellPress={onOpenNotifications} />
        {status === 'error' ? (
          <ErrorState message={error || 'Something went wrong.'} onRetry={() => (place ? refresh() : locate('always'))} onSearch={onOpenSearch} />
        ) : (
          <TodaySkeleton />
        )}
      </View>
    );
  }

  const activeAlert = items.find(
    (n) => n.city === place.name && n.severity !== 'info' && n.kind !== 'brief' && now - n.createdAt < ACTIVE_ALERT_MS
  );
  const today = daily[0];

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={place.name}
        subtitle={<LiveLine region={place.region} isGps={isGps} updated={timeAgo(lastUpdated, now)} />}
        onTitlePress={onOpenSearch}
        onBellPress={onOpenNotifications}
      />
      <ScrollView
        key={`${place.lat.toFixed(2)},${place.lon.toFixed(2)}`}
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => refresh()} tintColor={colors.accent} colors={[colors.accent]} />}
      >
        {error && (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.errorBanner, { borderColor: `${colors.warning}40`, backgroundColor: `${colors.warning}14` }]}>
            <MaterialCommunityIcons name="wifi-alert" size={20} color={colors.warning} />
            <Text style={styles.errorText}>Couldn't update just now. Showing the last forecast.</Text>
            <PressableScale onPress={() => refresh()} style={[styles.retry, { backgroundColor: colors.warning }]}>
              <Text style={styles.retryText}>Retry</Text>
            </PressableScale>
          </Animated.View>
        )}
        <Hero current={current} high={today?.high ?? current.main.temp_max} low={today?.low ?? current.main.temp_min} unit={unit} />
        {activeAlert && <AlertBanner alert={activeAlert} onPress={onOpenNotifications} delay={250} />}
        <GreetingCard place={place} current={current} forecast={forecast} unit={unit} userName={userName} now={now} delay={300} />
        <HourlyCard items={hourly} unit={unit} tz={current.timezone} delay={380} />
        <DailyCard days={daily} currentTemp={current.main.temp} unit={unit} tz={current.timezone} delay={460} />
        <DetailsGrid current={current} nextPop={forecast[0]?.pop ?? 0} unit={unit} delay={540} />
        <SunCard sunrise={current.sys.sunrise} sunset={current.sys.sunset} tz={current.timezone} now={now} delay={600} />
      </ScrollView>
    </View>
  );
};

const makeStyles = ({ colors, fonts, spacing, radius }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    liveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 3,
    },
    liveText: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      flexShrink: 1,
    },
    dotWrap: {
      width: 8,
      height: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    dotRing: {
      position: 'absolute',
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xxl,
      paddingBottom: TAB_BAR_SPACE,
      gap: spacing.sm,
    },
    centerTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 20,
      color: colors.text,
      marginTop: spacing.md,
    },
    centerBody: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    centerActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    button: {
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: radius.pill,
    },
    buttonGhost: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      color: colors.text,
    },
    spinner: { transform: [{ scale: 0.7 }], marginLeft: -4 },
    skelHero: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.xxl,
    },
    skelGap: { marginTop: spacing.lg },
    skelGapSm: { marginTop: spacing.sm },
    skelPills: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    skelCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      padding: spacing.lg,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    errorText: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
      color: colors.text,
    },
    retry: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: radius.pill,
    },
    retryText: {
      fontFamily: fonts.semiBold,
      fontSize: 13,
      color: '#FFFFFF',
    },
  });
