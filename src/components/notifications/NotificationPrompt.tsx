import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { Sheet } from '../ui/Sheet';
import { PressableScale } from '../ui/PressableScale';
import { AnimatedGlyph, GlyphName, Motion } from '../ui/AnimatedGlyph';
import { useNotificationStore } from '../../store/notificationStore';
import { notificationService } from '../../services/notificationService';
import { haptic } from '../../utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const BENEFITS: { icon: GlyphName; motion: Motion; text: string }[] = [
  { icon: 'umbrella-outline', motion: 'swing', text: 'Rain and storm heads-up before it starts' },
  { icon: 'white-balance-sunny', motion: 'spin', text: 'A good-morning message with your day ahead' },
  { icon: 'weather-night', motion: 'float', text: 'An evening preview of tomorrow' },
];

/**
 * Explains what notifications are for before the system dialog appears — shown once, so
 * the one-time system prompt isn't wasted on a user who doesn't know why it's there.
 */
export const NotificationPrompt: React.FC<Props> = ({ visible, onClose }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const request = useNotificationStore((s) => s.requestPermission);

  const turnOn = async () => {
    const result = await request();
    if (result === 'granted') {
      haptic.success();
      notificationService.present("You're all set ✨", "We'll let you know when the weather needs your attention.");
    }
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Smart weather alerts">
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.bell, { backgroundColor: colors.accentSoft }]}>
          <AnimatedGlyph name="bell-ring-outline" size={38} color={colors.accent} motion="ring" />
        </Animated.View>
        <Text style={styles.headline}>Stay a step ahead of the weather</Text>

        {BENEFITS.map((b, i) => (
          <Animated.View key={b.icon} entering={FadeInDown.delay(120 + i * 80).duration(380)} style={styles.benefit}>
            <View style={[styles.benefitIcon, { backgroundColor: colors.surfaceSunken }]}>
              <AnimatedGlyph name={b.icon} size={18} color={colors.text} motion={b.motion} delay={i * 200} />
            </View>
            <Text style={styles.benefitText}>{b.text}</Text>
          </Animated.View>
        ))}

        <PressableScale onPress={turnOn} style={[styles.primary, { backgroundColor: colors.accent }]} accessibilityRole="button">
          <Text style={[styles.primaryText, { color: colors.onAccent }]}>Turn on notifications</Text>
        </PressableScale>
        <PressableScale onPress={onClose} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryText}>Not now</Text>
        </PressableScale>
        <Text style={styles.note}>You can change this anytime in Settings.</Text>
      </View>
    </Sheet>
  );
};

const makeStyles = ({ colors, fonts, spacing, radius }: Theme) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.sm,
      alignItems: 'stretch',
    },
    bell: {
      alignSelf: 'center',
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    headline: {
      fontFamily: fonts.semiBold,
      fontSize: 19,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    benefit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    benefitIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    benefitText: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    primary: {
      marginTop: spacing.xl,
      paddingVertical: 15,
      borderRadius: radius.pill,
      alignItems: 'center',
    },
    primaryText: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
    },
    secondary: {
      marginTop: spacing.sm,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryText: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
      color: colors.textSecondary,
    },
    note: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  });
