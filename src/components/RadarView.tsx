import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { COLORS, FONTS } from '../constants';

const { width } = Dimensions.get('window');

interface Props {
  cityName: string;
  temp: number;
  condition: string;
  unit: 'metric' | 'imperial';
}

export const RadarView: React.FC<Props> = ({ cityName, temp, condition, unit }) => {
  const [activeLayer, setActiveLayer] = useState<'rain' | 'wind' | 'temp'>('rain');
  const [isPlaying, setIsPlaying] = useState(true);
  const radarScanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loopAnim: Animated.CompositeAnimation;
    if (isPlaying) {
      loopAnim = Animated.loop(
        Animated.timing(radarScanAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        })
      );
      loopAnim.start();

      // Center ping pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.8, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.in(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    } else {
      radarScanAnim.stopAnimation();
    }
    return () => loopAnim?.stop();
  }, [isPlaying]);

  const scanWidth = radarScanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const pingOpacity = pulseAnim.interpolate({
    inputRange: [1, 1.8],
    outputRange: [0.6, 0],
  });

  const layers = [
    { key: 'rain' as const, icon: '🌧️', label: 'Precipitation' },
    { key: 'wind' as const, icon: '💨', label: 'Wind' },
    { key: 'temp' as const, icon: '🌡️', label: 'Temperature' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Doppler Radar</Text>
          <Text style={styles.subtitle}>📍 {cityName} · Live Next-Gen</Text>
        </View>
        <TouchableOpacity
          style={[styles.liveBadge, isPlaying && styles.liveBadgeActive]}
          onPress={() => setIsPlaying(!isPlaying)}
          activeOpacity={0.7}
        >
          <View style={[styles.pulseDot, !isPlaying && { backgroundColor: COLORS.textMuted }]} />
          <Text style={styles.liveText}>{isPlaying ? 'LIVE' : 'PAUSED'}</Text>
        </TouchableOpacity>
      </View>

      {/* Layer selector chips */}
      <View style={styles.layersRow}>
        {layers.map((l) => (
          <TouchableOpacity
            key={l.key}
            style={[styles.layerChip, activeLayer === l.key && styles.activeLayerChip]}
            onPress={() => setActiveLayer(l.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.layerText, activeLayer === l.key && styles.activeLayerText]}>
              {l.icon} {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Interactive Radar Screen Canvas */}
      <View style={styles.mapCanvas}>
        {/* Grid lines */}
        <View style={styles.gridLineHorizontal} />
        <View style={styles.gridLineVertical} />

        {/* Center Target with pulse */}
        <View style={styles.centerTarget}>
          <Animated.View style={[
            styles.centerPulse,
            { transform: [{ scale: pulseAnim }], opacity: pingOpacity },
          ]} />
          <View style={styles.centerTargetPing} />
          <Text style={styles.centerCityText}>{cityName}</Text>
        </View>

        {/* Radar concentric rings */}
        <View style={styles.ring1} />
        <View style={styles.ring2} />
        <View style={styles.ring3} />

        {/* Simulated precipitation storm cells */}
        {activeLayer === 'rain' && (
          <>
            <View style={[styles.stormCell, { top: '25%', left: '30%', backgroundColor: 'rgba(74, 222, 128, 0.45)' }]} />
            <View style={[styles.stormCell, { top: '35%', left: '55%', backgroundColor: 'rgba(250, 204, 21, 0.55)', width: 90, height: 90 }]} />
            <View style={[styles.stormCell, { top: '50%', left: '20%', backgroundColor: 'rgba(248, 113, 113, 0.65)', width: 60, height: 60 }]} />
          </>
        )}

        {/* Temperature thermal heat zones */}
        {activeLayer === 'temp' && (
          <>
            <View style={[styles.stormCell, { top: '20%', left: '20%', backgroundColor: 'rgba(249, 115, 22, 0.4)', width: 140, height: 140 }]} />
            <View style={[styles.stormCell, { top: '40%', left: '45%', backgroundColor: 'rgba(239, 68, 68, 0.4)', width: 120, height: 120 }]} />
          </>
        )}

        {/* Wind streams */}
        {activeLayer === 'wind' && (
          <>
            <View style={[styles.stormCell, { top: '30%', left: '25%', backgroundColor: 'rgba(56, 189, 248, 0.35)', width: 160, height: 50, borderRadius: 25 }]} />
            <View style={[styles.stormCell, { top: '55%', left: '40%', backgroundColor: 'rgba(34, 211, 238, 0.3)', width: 140, height: 40, borderRadius: 20, transform: [{ rotate: '30deg' }] }]} />
          </>
        )}

        {/* Radar Sweep Beam */}
        {isPlaying && (
          <Animated.View
            style={[
              styles.sweepBeam,
              { left: scanWidth },
            ]}
          />
        )}

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Intensity</Text>
          <View style={styles.legendBar}>
            <View style={[styles.legendStep, { backgroundColor: '#4ADE80' }]} />
            <View style={[styles.legendStep, { backgroundColor: '#FACC15' }]} />
            <View style={[styles.legendStep, { backgroundColor: '#FB923C' }]} />
            <View style={[styles.legendStep, { backgroundColor: '#F87171' }]} />
            <View style={[styles.legendStep, { backgroundColor: '#C084FC' }]} />
          </View>
          <View style={styles.legendLabels}>
            <Text style={styles.legendText}>Light</Text>
            <Text style={styles.legendText}>Moderate</Text>
            <Text style={styles.legendText}>Heavy / Severe</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    color: COLORS.textPrimary,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  liveBadgeActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  liveText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  layersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  layerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  activeLayerChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  layerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  activeLayerText: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  mapCanvas: {
    height: 380,
    backgroundColor: 'rgba(8, 14, 28, 0.95)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  ring1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.1)',
    borderStyle: 'dashed',
  },
  ring2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.07)',
    borderStyle: 'dashed',
  },
  ring3: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.04)',
  },
  centerTarget: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  centerPulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: COLORS.accent,
    top: -8,
  },
  centerTargetPing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: '#FFF',
    marginBottom: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  centerCityText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  stormCell: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  sweepBeam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.7)',
    shadowColor: COLORS.accent,
    shadowRadius: 12,
    shadowOpacity: 0.8,
  },
  legendCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(10, 15, 30, 0.85)',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  legendTitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  legendBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  legendStep: {
    flex: 1,
  },
  legendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});
