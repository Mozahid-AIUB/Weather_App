import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type GlyphName = keyof typeof MaterialCommunityIcons.glyphMap;
export type Motion = 'none' | 'pulse' | 'float' | 'spin' | 'swing' | 'drip' | 'sway' | 'blink' | 'breathe' | 'ring';

interface Props {
  name: GlyphName;
  size?: number;
  color: string;
  motion?: Motion;
  /** Stagger start so neighbouring icons don't move in lockstep. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

const ease = Easing.inOut(Easing.sin);

/** A MaterialCommunityIcons glyph with a looping micro-animation suited to its meaning. */
export const AnimatedGlyph: React.FC<Props> = ({ name, size = 18, color, motion = 'none', delay = 0, style }) => {
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = 0;
    const run = (anim: number) => {
      v.value = withDelay(delay, anim);
    };
    switch (motion) {
      case 'spin':
        run(withRepeat(withTiming(1, { duration: 12000, easing: Easing.linear }), -1, false));
        break;
      case 'ring':
        // Bell: a quick shake, then rest.
        run(
          withRepeat(
            withSequence(
              withTiming(1, { duration: 90 }),
              withTiming(-1, { duration: 140 }),
              withTiming(0.6, { duration: 120 }),
              withTiming(-0.4, { duration: 110 }),
              withTiming(0, { duration: 100 }),
              withTiming(0, { duration: 3400 })
            ),
            -1,
            false
          )
        );
        break;
      case 'blink':
        run(
          withRepeat(
            withSequence(withTiming(0, { duration: 2800 }), withTiming(1, { duration: 90 }), withTiming(0, { duration: 120 })),
            -1,
            false
          )
        );
        break;
      case 'drip':
        run(withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.in(Easing.quad) }), withTiming(0, { duration: 0 })), -1, false));
        break;
      case 'none':
        break;
      default:
        run(withRepeat(withTiming(1, { duration: motion === 'breathe' ? 2600 : 1600, easing: ease }), -1, true));
    }
    return () => cancelAnimation(v);
  }, [motion, delay]);

  const animated = useAnimatedStyle(() => {
    const t = v.value;
    switch (motion) {
      case 'pulse':
        return { transform: [{ scale: 1 + t * 0.14 }] };
      case 'breathe':
        return { opacity: 0.75 + t * 0.25, transform: [{ scale: 0.96 + t * 0.08 }] };
      case 'float':
        return { transform: [{ translateY: -t * 2.5 }] };
      case 'spin':
        return { transform: [{ rotate: `${t * 360}deg` }] };
      case 'swing':
        return { transform: [{ rotate: `${(t - 0.5) * 24}deg` }] };
      case 'ring':
        return { transform: [{ rotate: `${t * 18}deg` }] };
      case 'sway':
        return { transform: [{ translateX: (t - 0.5) * 4 }] };
      case 'blink':
        return { transform: [{ scaleY: 1 - t * 0.85 }] };
      case 'drip':
        return { opacity: t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3, transform: [{ translateY: t * 3 }] };
      default:
        return {};
    }
  });

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style, animated]}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </Animated.View>
  );
};
