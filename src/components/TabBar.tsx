import React, { useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, useStyles, useTheme } from '../theme/ThemeProvider';
import { PressableScale } from './ui/PressableScale';
import { AnimatedGlyph, GlyphName, Motion } from './ui/AnimatedGlyph';

export type TabKey = 'today' | 'radar' | 'places' | 'settings';

const TABS: { key: TabKey; label: string; icon: GlyphName; motion: Motion }[] = [
  { key: 'today', label: 'Today', icon: 'weather-partly-cloudy', motion: 'float' },
  { key: 'radar', label: 'Radar', icon: 'radar', motion: 'spin' },
  { key: 'places', label: 'Places', icon: 'map-marker-radius-outline', motion: 'float' },
  { key: 'settings', label: 'Settings', icon: 'cog-outline', motion: 'spin' },
];

export const TAB_BAR_SPACE = 96;

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

/** Floating glass dock; the highlight pill springs between tabs and the active icon comes alive. */
export const TabBar: React.FC<Props> = ({ active, onChange }) => {
  const styles = useStyles(makeStyles);
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const index = TABS.findIndex((t) => t.key === active);
  const tabW = width ? (width - 12) / TABS.length : 0;

  const pill = useAnimatedStyle(() => ({
    width: tabW,
    transform: [{ translateX: withSpring(index * tabW, { damping: 17, stiffness: 210, mass: 0.8 }) }],
  }));

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.dock} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {Platform.OS !== 'android' && <BlurView intensity={50} tint={mode === 'day' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />}
        {width > 0 && <Animated.View style={[styles.pill, pill]} />}
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <PressableScale
              key={tab.key}
              style={styles.tab}
              scaleTo={0.9}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <AnimatedGlyph
                key={`${tab.key}-${isActive}`}
                name={tab.icon}
                size={23}
                color={isActive ? colors.accent : colors.textMuted}
                motion={isActive ? tab.motion : 'none'}
              />
              <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
};

const makeStyles = ({ colors, fonts, radius }: Theme) =>
  StyleSheet.create({
    wrap: {
      pointerEvents: 'box-none',
      position: 'absolute',
      left: 16,
      right: 16,
      alignItems: 'center',
    },
    dock: {
      flexDirection: 'row',
      width: '100%',
      maxWidth: 460,
      padding: 6,
      borderRadius: radius.xl,
      overflow: 'hidden',
      backgroundColor: Platform.OS === 'android' ? colors.surfaceStrong : `${colors.surfaceStrong}B3`,
      borderWidth: 1,
      borderColor: colors.border,
      boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.16)',
    },
    pill: {
      position: 'absolute',
      top: 6,
      bottom: 6,
      left: 6,
      borderRadius: radius.lg,
      backgroundColor: colors.accentSoft,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      gap: 3,
    },
    label: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: colors.textMuted,
    },
    activeLabel: {
      fontFamily: fonts.semiBold,
      color: colors.accent,
    },
  });
