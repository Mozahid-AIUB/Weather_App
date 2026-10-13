import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOutUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { useNotificationStore } from '../../store/notificationStore';
import { PressableScale } from '../ui/PressableScale';
import { AnimatedGlyph } from '../ui/AnimatedGlyph';
import { ALERT_ICON, severityColor } from './alertVisuals';
import { haptic } from '../../utils/haptics';

const VISIBLE_MS = 5500;

/** Live alert banner that drops in from the top whenever a new notification arrives. */
export const AlertToast: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const styles = useStyles(makeStyles);
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useNotificationStore((s) => s.toast);
  const dismiss = useNotificationStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    if (toast.severity === 'severe') haptic.warning();
    const t = setTimeout(dismiss, VISIBLE_MS);
    return () => clearTimeout(t);
  }, [toast?.id]);

  if (!toast) return null;
  const visual = ALERT_ICON[toast.kind];
  const tint = severityColor(toast.severity, toast.kind, colors);

  return (
    <View style={[styles.layer, { top: insets.top + 8 }]}>
      <Animated.View key={toast.id} entering={SlideInUp.springify().damping(16)} exiting={FadeOutUp.duration(250)} style={styles.shadow}>
        <PressableScale
          onPress={() => {
            dismiss();
            onOpen();
          }}
          style={styles.toast}
          accessibilityRole="alert"
        >
          {Platform.OS !== 'android' && <BlurView intensity={40} tint={mode === 'day' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />}
          <View style={[styles.accent, { backgroundColor: tint }]} />
          <View style={[styles.iconWrap, { backgroundColor: `${tint}22` }]}>
            <AnimatedGlyph name={visual.icon} size={20} color={tint} motion={visual.motion} />
          </View>
          <View style={styles.text}>
            <Text style={styles.title} numberOfLines={1}>
              {toast.title}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {toast.body.replace(/\n/g, ' ')}
            </Text>
          </View>
        </PressableScale>
      </Animated.View>
    </View>
  );
};

const makeStyles = ({ colors, fonts, radius, spacing }: Theme) =>
  StyleSheet.create({
    layer: {
      pointerEvents: 'box-none',
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      alignItems: 'center',
      zIndex: 1000,
    },
    shadow: {
      width: '100%',
      maxWidth: 520,
      borderRadius: radius.lg,
      boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.22)',
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      paddingLeft: spacing.lg,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: Platform.OS === 'android' ? colors.surfaceStrong : `${colors.surfaceStrong}D9`,
      borderWidth: 1,
      borderColor: colors.border,
    },
    accent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1 },
    title: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
      color: colors.text,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
      marginTop: 1,
    },
  });
