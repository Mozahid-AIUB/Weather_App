import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { COLORS } from '../constants';

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
    } else {
      radarScanAnim.stopAnimation();
    }
    return () => loopAnim?.stop();
  }, [isPlaying]);

  const scanWidth = radarScanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Doppler Radar & Satellite</Text>
          <Text style={styles.subtitle}>📍 {cityName} Metro Coverage · Live Next-Gen</Text>
        </View>
        <TouchableOpacity
          style={[styles.liveBadge, isPlaying && styles.liveBadgeActive]}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>{isPlaying ? 'LIVE' : 'PAUSED'}</Text>
        </TouchableOpacity>
      </View>

      {/* Layer selector chips */}
      <View style={styles.layersRow}>
        <TouchableOpacity
          style={[styles.layerChip, activeLayer === 'rain' && styles.activeLayerChip]}
          onPress={() => setActiveLayer('rain')}
        >
          <Text style={[styles.layerText, activeLayer === 'rain' && styles.activeLayerText]}>🌧️ Precipitation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerChip, activeLayer === 'wind' && styles.activeLayerChip]}
          onPress={() => setActiveLayer('wind')}
        >
          <Text style={[styles.layerText, activeLayer === 'wind' && styles.activeLayerText]}>💨 Wind Streams</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerChip, activeLayer === 'temp' && styles.activeLayerChip]}
          onPress={() => setActiveLayer('temp')}
        >
          <Text style={[styles.layerText, activeLayer === 'temp' && styles.activeLayerText]}>🌡️ Temperature</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Radar Screen Canvas */}
      <View style={styles.mapCanvas}>
        {/* Grid lines */}
        <View style={styles.gridLineHorizontal} />
        <View style={styles.gridLineVertical} />

        {/* Center Target */}
        <View style={styles.centerTarget}>
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

        {/* Radar Sweep Beam */}
        {isPlaying && (
          <Animated.View
            style={[
              styles.sweepBeam,
              {
                left: scanWidth,
              },
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
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  liveBadgeActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  layersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  layerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  activeLayerChip: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  layerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeLayerText: {
    color: '#000',
    fontWeight: '800',
  },
  mapCanvas: {
    height: 380,
    backgroundColor: 'rgba(10, 18, 36, 0.95)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  gridLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  ring1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.15)',
    borderStyle: 'dashed',
  },
  ring2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.12)',
    borderStyle: 'dashed',
  },
  ring3: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.08)',
  },
  centerTarget: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  centerTargetPing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: '#FFF',
    marginBottom: 4,
  },
  centerCityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stormCell: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    filter: 'blur(16px)',
  },
  sweepBeam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(79, 195, 247, 0.8)',
    shadowColor: COLORS.accent,
    shadowRadius: 10,
    shadowOpacity: 1,
  },
  legendCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  legendTitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  legendBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
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
  },
});
