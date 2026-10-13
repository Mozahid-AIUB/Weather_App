import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { AnimatedGlyph, GlyphName } from './AnimatedGlyph';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: GlyphName;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Pill segmented control with a spring-sliding selection thumb. */
export const Segmented = <T extends string>({ options, value, onChange }: Props<T>) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width ? (width - 8) / options.length : 0;

  const thumb = useAnimatedStyle(() => ({
    width: segment,
    transform: [{ translateX: withSpring(index * segment, { damping: 18, stiffness: 240 }) }],
  }));

  return (
    <View style={styles.track} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && <Animated.View style={[styles.thumb, thumb]} />}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale key={o.value} style={styles.option} scaleTo={0.94} onPress={() => onChange(o.value)} accessibilityRole="button" accessibilityState={{ selected: active }}>
            {o.icon ? <AnimatedGlyph name={o.icon} size={15} color={active ? colors.text : colors.textMuted} motion={active ? 'pulse' : 'none'} /> : null}
            <Text style={[styles.text, active && styles.activeText]}>{o.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
};

const makeStyles = ({ colors, fonts, radius }: Theme) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSunken,
      borderRadius: radius.pill,
      padding: 4,
    },
    thumb: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      left: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceStrong,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.12)',
    },
    option: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
    },
    text: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.textMuted,
    },
    activeText: {
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
  });
