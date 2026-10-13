import React, { useEffect } from 'react';
import { DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

interface Props {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Placeholder block with a soft light sweep, shown while content loads. */
export const Skeleton: React.FC<Props> = ({ width = '100%', height, radius = 10, style }) => {
  const { colors, mode } = useTheme();
  const x = useSharedValue(-1);

  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => cancelAnimation(x);
  }, []);
  const sweep = useAnimatedStyle(() => ({ transform: [{ translateX: `${x.value * 100}%` }] }));
  const shine = mode === 'day' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.07)';

  return (
    <View style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceSunken, overflow: 'hidden' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, sweep]}>
        <LinearGradient colors={['transparent', shine, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
};
