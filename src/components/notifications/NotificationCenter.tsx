import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { Sheet } from '../ui/Sheet';
import { PressableScale } from '../ui/PressableScale';
import { AnimatedGlyph } from '../ui/AnimatedGlyph';
import { AppNotification, useNotificationStore } from '../../store/notificationStore';
import { notificationService } from '../../services/notificationService';
import { ALERT_ICON, severityColor } from './alertVisuals';
import { timeAgo } from '../../utils/format';
import { haptic } from '../../utils/haptics';
import { useNow } from '../../hooks/useNow';

interface Props {
  visible: boolean;
  onClose: () => void;
  placeName?: string;
}

const Row: React.FC<{ item: AppNotification; index: number; now: number }> = ({ item, index, now }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const tint = severityColor(item.severity, item.kind, colors);
  const visual = ALERT_ICON[item.kind];

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(380)} layout={LinearTransition} style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: `${tint}1F` }]}>
        <AnimatedGlyph name={visual.icon} size={20} color={tint} motion={index < 6 ? visual.motion : 'none'} delay={index * 120} />
      </View>
      <View style={styles.rowText}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {!item.read && <View style={[styles.unread, { backgroundColor: colors.accent }]} />}
        </View>
        <Text style={styles.rowBody}>{item.body}</Text>
        <Text style={styles.rowMeta}>
          {item.city} · {timeAgo(item.createdAt, now)}
        </Text>
      </View>
    </Animated.View>
  );
};

/** Device push status, with the right call to action for web, installed app or Expo Go. */
export const PushStatus: React.FC = () => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const permission = useNotificationStore((s) => s.permission);
  const request = useNotificationStore((s) => s.requestPermission);
  const support = notificationService.support();

  if (permission === 'granted') {
    return (
      <View style={[styles.status, { backgroundColor: `${colors.success}14`, borderColor: `${colors.success}33` }]}>
        <AnimatedGlyph name="check-decagram" size={20} color={colors.success} motion="pulse" />
        <Text style={styles.statusText}>Push notifications are on. Alerts and your morning brief reach you even outside the app.</Text>
      </View>
    );
  }

  // No system notifications here (e.g. Expo Go): alerts still arrive in-app, nothing to configure.
  if (support === 'none' || permission === 'unsupported') return null;

  if (permission === 'blocked') {
    return (
      <View style={[styles.status, { backgroundColor: `${colors.warning}14`, borderColor: `${colors.warning}33` }]}>
        <AnimatedGlyph name="bell-off-outline" size={20} color={colors.warning} motion="none" />
        <Text style={styles.statusText}>
          {support === 'web'
            ? 'Notifications are blocked for this site. Allow them in your browser settings.'
            : 'Notifications are turned off for WeatherNow. Turn them on to get alerts outside the app.'}
        </Text>
        {support !== 'web' && (
          <PressableScale style={[styles.enable, { backgroundColor: colors.warning }]} onPress={notificationService.openSettings} accessibilityRole="button">
            <Text style={[styles.enableText, { color: '#FFFFFF' }]}>Open settings</Text>
          </PressableScale>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.status, { backgroundColor: colors.accentSoft, borderColor: `${colors.accent}33` }]}>
      <AnimatedGlyph name="bell-ring-outline" size={20} color={colors.accent} motion="ring" />
      <Text style={styles.statusText}>Get rain, storm and heat alerts plus a good-morning brief as push notifications.</Text>
      <PressableScale
        style={[styles.enable, { backgroundColor: colors.accent }]}
        onPress={async () => {
          const result = await request();
          if (result === 'granted') {
            haptic.success();
            notificationService.present("You're all set ✨", "We'll let you know when the weather needs your attention.");
          }
        }}
      >
        <Text style={[styles.enableText, { color: colors.onAccent }]}>Enable</Text>
      </PressableScale>
    </View>
  );
};

export const NotificationCenter: React.FC<Props> = ({ visible, onClose, placeName }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const items = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);
  const toast = useNotificationStore((s) => s.toast);
  const dismissToast = useNotificationStore((s) => s.dismissToast);
  const now = useNow(30000);

  // The list already shows everything, so no toast should float above the open sheet.
  useEffect(() => {
    if (visible && toast) dismissToast();
  }, [visible, toast]);

  const close = () => {
    markAllRead();
    onClose();
  };

  const fresh = items.filter((i) => !i.read);
  const earlier = items.filter((i) => i.read);

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title="Notifications"
      fullHeight
      headerRight={
        items.length ? (
          <PressableScale onPress={clear} style={styles.clear} accessibilityLabel="Clear all notifications">
            <Text style={styles.clearText}>Clear</Text>
          </PressableScale>
        ) : null
      }
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PushStatus />

        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accentSoft }]}>
              <AnimatedGlyph name="bell-check-outline" size={34} color={colors.accent} motion="ring" />
            </View>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptyBody}>
              We keep an eye on {placeName || 'your location'} every few minutes and alert you about rain, storms, heat, wind and sudden changes.
            </Text>
          </View>
        ) : (
          <>
            {fresh.length > 0 && <Text style={styles.section}>New</Text>}
            {fresh.map((item, i) => (
              <Row key={item.id} item={item} index={i} now={now} />
            ))}
            {earlier.length > 0 && <Text style={styles.section}>Earlier</Text>}
            {earlier.map((item, i) => (
              <Row key={item.id} item={item} index={fresh.length + i} now={now} />
            ))}
          </>
        )}
      </ScrollView>
    </Sheet>
  );
};

const makeStyles = ({ colors, fonts, radius, spacing }: Theme) =>
  StyleSheet.create({
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
    },
    clear: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSunken,
    },
    clearText: {
      fontFamily: fonts.semiBold,
      fontSize: 13,
      color: colors.textSecondary,
    },
    status: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      marginBottom: spacing.lg,
    },
    statusText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    enable: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    enableText: {
      fontFamily: fonts.semiBold,
      fontSize: 13,
    },
    section: {
      fontFamily: fonts.semiBold,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    rowIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1 },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    rowTitle: {
      flex: 1,
      fontFamily: fonts.semiBold,
      fontSize: 15,
      color: colors.text,
    },
    unread: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
    },
    rowBody: {
      fontFamily: fonts.regular,
      fontSize: 13.5,
      lineHeight: 19,
      color: colors.textSecondary,
      marginTop: 2,
    },
    rowMeta: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 6,
    },
    empty: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    emptyIcon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 18,
      color: colors.text,
    },
    emptyBody: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 6,
    },
  });
