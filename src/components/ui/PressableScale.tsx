import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptic } from '../../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far the element shrinks while pressed. */
  scaleTo?: number;
  haptics?: boolean;
  children: React.ReactNode;
}

const SPRING = { damping: 15, stiffness: 320, mass: 0.6 };

/** Pressable that springs down on touch and back on release, with a light haptic tick. */
export const PressableScale: React.FC<Props> = ({ style, scaleTo = 0.96, haptics = true, onPressIn, onPressOut, onPress, children, ...rest }) => {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, animated]}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptics) haptic.tap();
        onPress?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
};
