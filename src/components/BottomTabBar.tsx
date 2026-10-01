import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS } from '../constants';

export type TabKey = 'weather' | 'radar' | 'cities' | 'insights' | 'settings';

interface TabItem {
  key: TabKey;
  label: string;
  icon: string;
  activeIcon: string;
}

const TABS: TabItem[] = [
  { key: 'weather', label: 'Weather', icon: '🌤', activeIcon: '☀️' },
  { key: 'radar', label: 'Radar', icon: '📡', activeIcon: '🛰️' },
  { key: 'cities', label: 'Cities', icon: '🏙', activeIcon: '📍' },
  { key: 'insights', label: 'Insights', icon: '📈', activeIcon: '📊' },
  { key: 'settings', label: 'Settings', icon: '⚙️', activeIcon: '⚙️' },
];

interface Props {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const BottomTabBar: React.FC<Props> = ({ activeTab, onSelectTab }) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={60} tint="dark" style={styles.blurWrap}>
        <View style={styles.tabDock}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
                onPress={() => onSelectTab(tab.key)}
                activeOpacity={0.7}
              >
                {isActive && <View style={styles.activeGlow} />}
                <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                  {isActive ? tab.activeIcon : tab.icon}
                </Text>
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
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
  },
  blurWrap: {
    borderRadius: 32,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tabDock: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 15, 30, 0.55)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 22,
    minWidth: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  activeTabButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  activeGlow: {
    position: 'absolute',
    top: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 3,
  },
  activeTabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeTabLabel: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 3,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
