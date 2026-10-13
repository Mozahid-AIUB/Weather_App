import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { selectUnreadCount, useNotificationStore } from '../../store/notificationStore';
import { PressableScale } from './PressableScale';
import { haptic } from '../../utils/haptics';

interface Props {
  title: string;
  subtitle?: React.ReactNode;
  onTitlePress?: () => void;
  onBellPress: () => void;
  right?: React.ReactNode;
}

/** Bell that wiggles and pops its badge whenever a new alert lands. */
const Bell: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const unread = useNotificationStore(selectUnreadCount);
  const prev = useRef(unread);
  const tilt = useSharedValue(0);

  useEffect(() => {
    if (unread > prev.current) {
      haptic.warning();
      tilt.value = withSequence(
        withTiming(18, { duration: 90 }),
        withTiming(-16, { duration: 120 }),
        withTiming(12, { duration: 110 }),
        withTiming(-8, { duration: 100 }),
        withSpring(0, { damping: 8 })
      );
    }
    prev.current = unread;
  }, [unread]);

  const bell = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }] }));

  return (
    <PressableScale onPress={onPress} style={styles.iconButton} accessibilityLabel={`Notifications, ${unread} unread`}>
      <Animated.View style={bell}>
        <MaterialCommunityIcons name={unread ? 'bell-ring-outline' : 'bell-outline'} size={21} color={colors.text} />
      </Animated.View>
      {unread > 0 && (
        <Animated.View key={unread} entering={ZoomIn.springify().damping(10)} style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </Animated.View>
      )}
    </PressableScale>
  );
};

export const ScreenHeader: React.FC<Props> = ({ title, subtitle, onTitlePress, onBellPress, right }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();

  const titleBlock = (
    <>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {onTitlePress ? <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textMuted} /> : null}
      </View>
      {typeof subtitle === 'string' ? <Text style={styles.subtitle}>{subtitle}</Text> : subtitle}
    </>
  );

  return (
    <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
      {onTitlePress ? (
        <PressableScale style={styles.titleWrap} scaleTo={0.98} onPress={onTitlePress} accessibilityRole="button">
          {titleBlock}
        </PressableScale>
      ) : (
        <View style={styles.titleWrap}>{titleBlock}</View>
      )}
      <View style={styles.actions}>
        {right}
        <Bell onPress={onBellPress} />
      </View>
    </Animated.View>
  );
};

export const makeHeaderButtonStyle = (t: Theme) => makeStyles(t).iconButton;

const makeStyles = ({ colors, fonts, spacing }: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    titleWrap: { flex: 1 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 26,
      letterSpacing: -0.6,
      color: colors.text,
      flexShrink: 1,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 19,
      height: 19,
      paddingHorizontal: 5,
      borderRadius: 10,
      backgroundColor: colors.danger,
      borderWidth: 2,
      borderColor: colors.surfaceStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontFamily: fonts.bold,
      fontSize: 10,
      color: '#FFFFFF',
    },
  });
