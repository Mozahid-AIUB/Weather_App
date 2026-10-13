import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { AnimatedGlyph, GlyphName, Motion } from './AnimatedGlyph';

interface Props {
  title?: string;
  icon?: GlyphName;
  iconMotion?: Motion;
  /** Tint for the header icon; defaults to the theme accent. */
  tint?: string;
  right?: React.ReactNode;
  /** Entrance stagger in ms. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  children: React.ReactNode;
}

/** Frosted surface used for every section, with an animated icon header and staggered entrance. */
export const Card: React.FC<Props> = ({ title, icon, iconMotion = 'none', tint, right, delay = 0, style, padded = true, children }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const color = tint || colors.accent;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(520).springify().damping(18)} style={[styles.card, padded && styles.padded, style]}>
      {title ? (
        <View style={[styles.header, !padded && styles.headerUnpadded]}>
          {icon ? (
            <View style={[styles.iconWrap, { backgroundColor: `${color}1F` }]}>
              <AnimatedGlyph name={icon} size={15} color={color} motion={iconMotion} delay={delay} />
            </View>
          ) : null}
          <Text style={styles.title}>{title}</Text>
          <View style={styles.spacer} />
          {right}
        </View>
      ) : null}
      {children}
    </Animated.View>
  );
};

const makeStyles = ({ colors, fonts, radius, spacing }: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      boxShadow: colors.cardShadow,
      overflow: 'hidden',
    },
    padded: {
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    headerUnpadded: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    iconWrap: {
      width: 26,
      height: 26,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: fonts.semiBold,
      fontSize: 13,
      letterSpacing: 0.3,
      color: colors.textSecondary,
    },
    spacer: { flex: 1 },
  });
