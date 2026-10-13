import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { AppNotification } from '../../store/notificationStore';
import { PressableScale } from '../ui/PressableScale';
import { AnimatedGlyph } from '../ui/AnimatedGlyph';
import { ALERT_ICON, severityColor } from './alertVisuals';

interface Props {
  alert: AppNotification;
  onPress: () => void;
  delay?: number;
}

/** The most important active alert for the place, pinned under the hero. */
export const AlertBanner: React.FC<Props> = ({ alert, onPress, delay = 0 }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const tint = severityColor(alert.severity, alert.kind, colors);
  const visual = ALERT_ICON[alert.kind];

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).springify().damping(18)}>
      <PressableScale onPress={onPress} scaleTo={0.98} style={[styles.banner, { backgroundColor: `${tint}17`, borderColor: `${tint}40` }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${tint}26` }]}>
          <AnimatedGlyph name={visual.icon} size={22} color={tint} motion={visual.motion} />
        </View>
        <View style={styles.text}>
          <View style={styles.labelRow}>
            <View style={[styles.liveDot, { backgroundColor: tint }]} />
            <Text style={[styles.label, { color: tint }]}>{alert.severity === 'severe' ? 'Weather warning' : 'Weather alert'}</Text>
          </View>
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.body}>{alert.body}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      </PressableScale>
    </Animated.View>
  );
};

const makeStyles = ({ colors, fonts, radius, spacing }: Theme) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1 },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    label: {
      fontFamily: fonts.bold,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    title: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      color: colors.text,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
