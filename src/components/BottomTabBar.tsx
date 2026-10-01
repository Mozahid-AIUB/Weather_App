import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS } from '../constants';

export type TabKey = 'weather' | 'radar' | 'cities' | 'insights' | 'settings';

interface TabItem {
  key: TabKey;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { key: 'weather', label: 'Weather', icon: '🌤️' },
  { key: 'radar', label: 'Radar', icon: '🛰️' },
  { key: 'cities', label: 'Cities', icon: '🏙️' },
  { key: 'insights', label: 'Insights', icon: '📊' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

interface Props {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

const TabButton: React.FC<{
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}> = ({ tab, isActive, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: isActive ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  const handlePress = () => {
    // Tactile spring press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.tabContentWrap,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated Glow Pill Background */}
        <Animated.View
          style={[
            styles.activePill,
            {
              opacity: glowAnim,
              transform: [
                {
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Stable Consistent Icon (Does not mutate into different emojis) */}
        <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
          {tab.icon}
        </Text>

        {/* Tab Label */}
        <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
          {tab.label}
        </Text>

        {/* Animated Glowing Active Dot */}
        <Animated.View
          style={[
            styles.activeDot,
            {
              opacity: glowAnim,
              transform: [
                {
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export const BottomTabBar: React.FC<Props> = ({ activeTab, onSelectTab }) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={Platform.OS === 'ios' ? 70 : 100} tint="dark" style={styles.blurWrap}>
        <View style={styles.tabDock}>
          {TABS.map((tab) => (
            <TabButton
              key={tab.key}
              tab={tab}
              isActive={activeTab === tab.key}
              onPress={() => onSelectTab(tab.key)}
            />
          ))}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 12,
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 999,
  },
  blurWrap: {
    borderRadius: 32,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  tabDock: {
    flexDirection: 'row',
    backgroundColor: 'rgba(8, 14, 28, 0.72)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 52,
    position: 'relative',
  },
  tabContentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    position: 'relative',
    minWidth: 58,
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  tabIcon: {
    fontSize: 19,
    marginBottom: 2,
    opacity: 0.65,
  },
  activeTabIcon: {
    fontSize: 20,
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.medium,
    letterSpacing: 0.2,
  },
  activeTabLabel: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 2,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
});
