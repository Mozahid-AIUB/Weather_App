import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { PressableScale } from './PressableScale';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  /** Fraction of the screen height the sheet may use. */
  maxHeight?: number;
  fullHeight?: boolean;
  children: React.ReactNode;
}

const CLOSE_MS = 220;

/** Bottom sheet with a spring-in panel and fading backdrop; animates out before unmounting. */
export const Sheet: React.FC<Props> = ({ visible, onClose, title, subtitle, headerRight, maxHeight = 0.88, fullHeight, children }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const y = useSharedValue(height);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      y.value = height;
      fade.value = withTiming(1, { duration: 240 });
      y.value = withSpring(0, { damping: 22, stiffness: 220, mass: 0.9 });
    } else if (mounted) {
      fade.value = withTiming(0, { duration: CLOSE_MS });
      y.value = withTiming(height, { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) });
      const t = setTimeout(() => setMounted(false), CLOSE_MS);
      return () => clearTimeout(t);
    }
  }, [visible]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const backdrop = useAnimatedStyle(() => ({ opacity: fade.value }));
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      {/* The sheet sizes itself to the space left above the keyboard and never rises past the status bar.
          'padding' measures the real keyboard overlap, so it works whether or not Android resizes the window
          (edge-to-edge apps get no resize). */}
      <KeyboardAvoidingView behavior="padding" style={[styles.anchor, { paddingTop: insets.top + 12 }]}>
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: height * maxHeight, paddingBottom: keyboardOpen ? 12 : Math.max(insets.bottom, 16) },
            fullHeight ? styles.fill : styles.shrink,
            panel,
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.titles}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {headerRight}
            <PressableScale onPress={onClose} style={styles.close} accessibilityLabel="Close">
              <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
            </PressableScale>
          </View>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const makeStyles = ({ colors, fonts, spacing, radius }: Theme) =>
  StyleSheet.create({
    anchor: {
      pointerEvents: 'box-none',
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    fill: { flex: 1 },
    shrink: { flexShrink: 1 },
    sheet: {
      width: '100%',
      maxWidth: 560,
      backgroundColor: colors.surfaceStrong,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.border,
      paddingTop: spacing.sm,
      boxShadow: '0px -12px 40px rgba(0, 0, 0, 0.18)',
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.divider,
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.md,
    },
    titles: { flex: 1 },
    title: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.text,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    close: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surfaceSunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
