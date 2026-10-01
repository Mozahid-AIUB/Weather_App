import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  condition: string; // 'sunny' | 'rainy' | 'snowy' | 'night' | 'stormy' | 'cloudy'
}

export const AnimatedWeatherBackground: React.FC<Props> = ({ condition }) => {
  // Sun ray rotation & pulse
  const sunRotate = useRef(new Animated.Value(0)).current;
  const sunPulse = useRef(new Animated.Value(1)).current;

  // Rain drop animations (18 drops)
  const rainDrops = useRef(
    Array.from({ length: 20 }).map(() => ({
      y: new Animated.Value(-50),
      x: Math.random() * width,
      speed: 800 + Math.random() * 600,
      opacity: 0.3 + Math.random() * 0.5,
      height: 15 + Math.random() * 20,
    }))
  ).current;

  // Snow drop animations (18 flakes)
  const snowFlakes = useRef(
    Array.from({ length: 18 }).map(() => ({
      y: new Animated.Value(-30),
      x: Math.random() * width,
      sway: new Animated.Value(0),
      speed: 2500 + Math.random() * 2000,
      size: 4 + Math.random() * 6,
      opacity: 0.4 + Math.random() * 0.5,
    }))
  ).current;

  // Star twinkling
  const starPulses = useRef(
    Array.from({ length: 24 }).map(() => ({
      anim: new Animated.Value(0.2 + Math.random() * 0.8),
      top: Math.random() * (height * 0.6),
      left: Math.random() * width,
      size: 1.5 + Math.random() * 2.5,
    }))
  ).current;

  // Cloud drifting
  const cloud1 = useRef(new Animated.Value(-120)).current;
  const cloud2 = useRef(new Animated.Value(-200)).current;

  // Lightning flash
  const lightningOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Sun animations
    Animated.loop(
      Animated.timing(sunRotate, {
        toValue: 1,
        duration: 35000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sunPulse, {
          toValue: 1.12,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(sunPulse, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // 2. Rain drops loops
    rainDrops.forEach((drop) => {
      const loop = () => {
        drop.y.setValue(-50);
        Animated.timing(drop.y, {
          toValue: height,
          duration: drop.speed,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(() => loop());
      };
      loop();
    });

    // 3. Snow flakes loops
    snowFlakes.forEach((flake) => {
      const loopY = () => {
        flake.y.setValue(-30);
        Animated.timing(flake.y, {
          toValue: height,
          duration: flake.speed,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(() => loopY());
      };
      loopY();

      Animated.loop(
        Animated.sequence([
          Animated.timing(flake.sway, {
            toValue: 15,
            duration: 1500 + Math.random() * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(flake.sway, {
            toValue: -15,
            duration: 1500 + Math.random() * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      ).start();
    });

    // 4. Star twinkling
    starPulses.forEach((star) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(star.anim, {
            toValue: 0.1,
            duration: 1200 + Math.random() * 1500,
            useNativeDriver: false,
          }),
          Animated.timing(star.anim, {
            toValue: 0.9,
            duration: 1200 + Math.random() * 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    });

    // 5. Cloud drifting
    const driftCloud1 = () => {
      cloud1.setValue(-150);
      Animated.timing(cloud1, {
        toValue: width + 150,
        duration: 28000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => driftCloud1());
    };
    driftCloud1();

    const driftCloud2 = () => {
      cloud2.setValue(-220);
      Animated.timing(cloud2, {
        toValue: width + 220,
        duration: 42000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => driftCloud2());
    };
    driftCloud2();

    // 6. Lightning flashes
    const triggerLightning = () => {
      Animated.sequence([
        Animated.timing(lightningOpacity, { toValue: 0.7, duration: 80, useNativeDriver: false }),
        Animated.timing(lightningOpacity, { toValue: 0, duration: 100, useNativeDriver: false }),
        Animated.timing(lightningOpacity, { toValue: 0.9, duration: 60, useNativeDriver: false }),
        Animated.timing(lightningOpacity, { toValue: 0, duration: 180, useNativeDriver: false }),
      ]).start(() => {
        setTimeout(triggerLightning, 6000 + Math.random() * 9000);
      });
    };
    if (condition === 'stormy') {
      triggerLightning();
    }
  }, [condition]);

  const spin = sunRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Sunny Aura */}
      {condition === 'sunny' && (
        <View style={styles.sunContainer}>
          <Animated.View
            style={[
              styles.sunGlow,
              {
                transform: [{ scale: sunPulse }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sunRays,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          />
        </View>
      )}

      {/* Starry Night */}
      {condition === 'night' && (
        <View style={StyleSheet.absoluteFill}>
          {starPulses.map((star, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.star,
                {
                  top: star.top,
                  left: star.left,
                  width: star.size,
                  height: star.size,
                  borderRadius: star.size / 2,
                  opacity: star.anim,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Clouds Layer */}
      {(condition === 'cloudy' || condition === 'rainy' || condition === 'stormy') && (
        <>
          <Animated.View
            style={[
              styles.cloud,
              {
                top: 50,
                transform: [{ translateX: cloud1 }],
                opacity: 0.25,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.cloudLarge,
              {
                top: 130,
                transform: [{ translateX: cloud2 }],
                opacity: 0.2,
              },
            ]}
          />
        </>
      )}

      {/* Rain Drops */}
      {(condition === 'rainy' || condition === 'stormy') && (
        <View style={StyleSheet.absoluteFill}>
          {rainDrops.map((drop, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.rainDrop,
                {
                  left: drop.x,
                  height: drop.height,
                  opacity: drop.opacity,
                  transform: [{ translateY: drop.y }],
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Snow Flakes */}
      {condition === 'snowy' && (
        <View style={StyleSheet.absoluteFill}>
          {snowFlakes.map((flake, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.snowFlake,
                {
                  left: flake.x,
                  width: flake.size,
                  height: flake.size,
                  borderRadius: flake.size / 2,
                  opacity: flake.opacity,
                  transform: [{ translateY: flake.y }, { translateX: flake.sway }],
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Lightning Flash Overlay */}
      {condition === 'stormy' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#FFFFFF',
              opacity: lightningOpacity,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sunContainer: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 183, 77, 0.25)',
  },
  sunRays: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    borderStyle: 'dashed',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  rainDrop: {
    position: 'absolute',
    width: 1.5,
    backgroundColor: 'rgba(186, 230, 253, 0.75)',
    borderRadius: 1,
  },
  snowFlake: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  cloud: {
    position: 'absolute',
    width: 180,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  cloudLarge: {
    position: 'absolute',
    width: 260,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
  },
});
