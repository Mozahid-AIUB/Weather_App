import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS } from '../constants';
import { EarthGlobe3D } from './EarthGlobe3D';

const { width } = Dimensions.get('window');

interface Props {
  cityName: string;
  temp: number;
  condition: string;
  unit: 'metric' | 'imperial';
  humidity?: number;
  windSpeed?: number;
  windDeg?: number;
  rainChance?: number;
  onSelectCity?: (cityName: string) => void;
}

export const RadarView: React.FC<Props> = ({
  cityName,
  temp,
  condition,
  unit,
  humidity = 58,
  windSpeed = 3.6,
  windDeg = 190,
  rainChance = 15,
  onSelectCity,
}) => {
  const [viewMode, setViewMode] = useState<'globe' | 'radar'>('globe');
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
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      loopAnim.start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.7,
            duration: 1400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
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
    inputRange: [1, 1.7],
    outputRange: [0.65, 0],
  });

  const layers = [
    { key: 'rain' as const, icon: '🌧️', label: 'Rain & Storms' },
    { key: 'wind' as const, icon: '💨', label: 'Wind Currents' },
    { key: 'temp' as const, icon: '🌡️', label: 'Heat Zones' },
  ];

  const getCompassDir = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const isStormy = condition.includes('storm') || condition.includes('thunder') || rainChance > 60;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Mode Switcher: 3D Global Earth vs 2D Doppler Scope */}
      <View style={styles.modeSwitchRow}>
        <TouchableOpacity
          style={[styles.modePill, viewMode === 'globe' && styles.modePillActive]}
          onPress={() => setViewMode('globe')}
          activeOpacity={0.8}
        >
          <Text style={[styles.modePillText, viewMode === 'globe' && styles.modePillTextActive]}>
            🌍 3D Global Earth
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modePill, viewMode === 'radar' && styles.modePillActive]}
          onPress={() => setViewMode('radar')}
          activeOpacity={0.8}
        >
          <Text style={[styles.modePillText, viewMode === 'radar' && styles.modePillTextActive]}>
            📡 2D Doppler Scope
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 3D EARTH GLOBE VIEW ──────────────────────────────────── */}
      {viewMode === 'globe' ? (
        <View>
          <EarthGlobe3D currentCityName={cityName} onSelectCity={onSelectCity} />

          {/* Global Space Telemetry Cards */}
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryIcon}>☀️</Text>
              <Text style={styles.telemetryLabel}>Solar Exposure</Text>
              <Text style={styles.telemetryValue}>Live Sync</Text>
              <Text style={styles.telemetryHint}>Day/Night Terminator</Text>
            </View>

            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryIcon}>🛰️</Text>
              <Text style={styles.telemetryLabel}>Satellite Grid</Text>
              <Text style={styles.telemetryValue}>Online</Text>
              <Text style={styles.telemetryHint}>Geostationary 36k km</Text>
            </View>

            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryIcon}>🌀</Text>
              <Text style={styles.telemetryLabel}>Atmosphere</Text>
              <Text style={styles.telemetryValue}>1013 hPa</Text>
              <Text style={styles.telemetryHint}>Mean Sea Level</Text>
            </View>

            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryIcon}>🌍</Text>
              <Text style={styles.telemetryLabel}>World Focus</Text>
              <Text style={styles.telemetryValue}>{cityName}</Text>
              <Text style={styles.telemetryHint}>Tap city badge to orbit</Text>
            </View>
          </View>

          {/* 3D Globe Guide */}
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>🌐 How to Interact with 3D Earth</Text>
            <Text style={styles.guideText}>
              • <Text style={{ color: COLORS.accent, fontFamily: FONTS.semiBold }}>Rotate & Move:</Text> Swipe or drag your finger anywhere on the Earth to spin it 360° across any continent.
            </Text>
            <Text style={styles.guideText}>
              • <Text style={{ color: '#F59E0B', fontFamily: FONTS.semiBold }}>Zoom In & Out (Close kora):</Text> Tap the <Text style={{ color: '#FFF' }}>➕</Text> and <Text style={{ color: '#FFF' }}>➖</Text> buttons to bring the Earth super close or zoom out to full space.
            </Text>
            <Text style={styles.guideText}>
              • <Text style={{ color: '#10B981', fontFamily: FONTS.semiBold }}>City Beacons:</Text> Tap on any glowing city pin (e.g. Dhaka, Tokyo, London, Dubai) to automatically rotate the globe and view its live weather!
            </Text>
            <Text style={styles.guideText}>
              • <Text style={{ color: COLORS.sky, fontFamily: FONTS.semiBold }}>Auto-Spin:</Text> Tap the <Text style={{ color: '#FFF' }}>⟳ Spin</Text> button in the top right to start or pause planetary rotation.
            </Text>
          </View>
        </View>
      ) : (
        /* ── 2D DOPPLER RADAR SCOPE VIEW ────────────────────────── */
        <View>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Doppler Weather Radar</Text>
              <Text style={styles.subtitle}>
                📍 {cityName} · 50 km Atmospheric Range
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.liveBadge, isPlaying && styles.liveBadgeActive]}
              onPress={() => setIsPlaying(!isPlaying)}
              activeOpacity={0.7}
            >
              <View style={[styles.pulseDot, !isPlaying && { backgroundColor: COLORS.textMuted }]} />
              <Text style={styles.liveText}>{isPlaying ? 'SCANNING' : 'PAUSED'}</Text>
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
            {/* Cardinal Directions */}
            <Text style={[styles.cardinalText, styles.cardinalN]}>N</Text>
            <Text style={[styles.cardinalText, styles.cardinalS]}>S</Text>
            <Text style={[styles.cardinalText, styles.cardinalE]}>E</Text>
            <Text style={[styles.cardinalText, styles.cardinalW]}>W</Text>

            {/* Distance Range Markers */}
            <Text style={styles.rangeMarker15}>15 km</Text>
            <Text style={styles.rangeMarker35}>35 km</Text>
            <Text style={styles.rangeMarker50}>50 km</Text>

            {/* Grid lines */}
            <View style={styles.gridLineHorizontal} />
            <View style={styles.gridLineVertical} />

            {/* Radar concentric range rings */}
            <View style={styles.ring1} />
            <View style={styles.ring2} />
            <View style={styles.ring3} />

            {/* Center Target (Your Location) */}
            <View style={styles.centerTarget}>
              <Animated.View
                style={[
                  styles.centerPulse,
                  { transform: [{ scale: pulseAnim }], opacity: pingOpacity },
                ]}
              />
              <View style={styles.centerTargetPing} />
              <Text style={styles.centerCityText}>📍 {cityName}</Text>
            </View>

            {/* Simulated precipitation storm cells */}
            {activeLayer === 'rain' && (
              <>
                <View style={[styles.stormCell, { top: '24%', left: '30%', backgroundColor: 'rgba(74, 222, 128, 0.45)' }]} />
                <View style={[styles.stormCell, { top: '38%', left: '56%', backgroundColor: 'rgba(250, 204, 21, 0.55)', width: 90, height: 90 }]} />
                <View style={[styles.stormCell, { top: '54%', left: '22%', backgroundColor: isStormy ? 'rgba(239, 68, 68, 0.65)' : 'rgba(74, 222, 128, 0.35)', width: 70, height: 70 }]} />
              </>
            )}

            {/* Temperature thermal heat zones */}
            {activeLayer === 'temp' && (
              <>
                <View style={[styles.stormCell, { top: '22%', left: '20%', backgroundColor: 'rgba(249, 115, 22, 0.35)', width: 150, height: 150 }]} />
                <View style={[styles.stormCell, { top: '44%', left: '48%', backgroundColor: 'rgba(239, 68, 68, 0.40)', width: 120, height: 120 }]} />
              </>
            )}

            {/* Wind streams */}
            {activeLayer === 'wind' && (
              <>
                <View style={[styles.stormCell, { top: '30%', left: '20%', backgroundColor: 'rgba(56, 189, 248, 0.35)', width: 170, height: 45, borderRadius: 25 }]} />
                <View style={[styles.stormCell, { top: '56%', left: '42%', backgroundColor: 'rgba(34, 211, 238, 0.30)', width: 150, height: 35, borderRadius: 20, transform: [{ rotate: '25deg' }] }]} />
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

            {/* Bottom Scope Legend */}
            <View style={styles.legendCard}>
              <Text style={styles.legendTitle}>
                {activeLayer === 'rain' ? 'Precipitation Intensity' : activeLayer === 'wind' ? 'Wind Velocity' : 'Thermal Heat Index'}
              </Text>
              <View style={styles.legendBar}>
                <View style={[styles.legendStep, { backgroundColor: '#4ADE80' }]} />
                <View style={[styles.legendStep, { backgroundColor: '#FACC15' }]} />
                <View style={[styles.legendStep, { backgroundColor: '#FB923C' }]} />
                <View style={[styles.legendStep, { backgroundColor: '#F87171' }]} />
                <View style={[styles.legendStep, { backgroundColor: '#C084FC' }]} />
              </View>
              <View style={styles.legendLabels}>
                <Text style={styles.legendText}>Light (0-2 mm)</Text>
                <Text style={styles.legendText}>Moderate (5 mm)</Text>
                <Text style={styles.legendText}>Severe / Storm (15+ mm)</Text>
              </View>
            </View>
          </View>

          {/* Real-Time Telemetry & Storm Status Banner */}
          <View style={[styles.statusBanner, isStormy ? styles.statusBannerStorm : styles.statusBannerCalm]}>
            <Text style={styles.statusBannerIcon}>{isStormy ? '⚠️' : '🛡️'}</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.statusBannerTitle}>
                {isStormy ? 'Active Storm Cells Nearby' : 'No Severe Storm Fronts Detected'}
              </Text>
              <Text style={styles.statusBannerDesc}>
                {isStormy
                  ? `Precipitation cells moving towards ${cityName}. Rain probability is ${rainChance}%.`
                  : `Atmospheric stability within 50 km. Normal cloud movement towards ${getCompassDir(windDeg)}.`}
              </Text>
            </View>
          </View>

          {/* 4 Live Radar Data Cards */}
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryIcon}>🛰️</Text>
              <Text style={styles.telemetryLabel}>Radar Scope</Text>
              <Text style={styles.telemetryValue}>50 km</Text>
              <Text style={styles.telemetryHint}>Coverage Radius</Text>
            </View>

            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryIcon}>🌧️</Text>
              <Text style={styles.telemetryLabel}>Rain Probability</Text>
              <Text style={styles.telemetryValue}>{rainChance}%</Text>
              <Text style={styles.telemetryHint}>Next 60 Minutes</Text>
            </View>

            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryIcon}>💨</Text>
              <Text style={styles.telemetryLabel}>Wind Vector</Text>
              <Text style={styles.telemetryValue}>
                {unit === 'imperial' ? `${Math.round(windSpeed * 2.237)} mph` : `${Math.round(windSpeed * 3.6)} km/h`}
              </Text>
              <Text style={styles.telemetryHint}>Heading {getCompassDir(windDeg)}</Text>
            </View>

            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryIcon}>💧</Text>
              <Text style={styles.telemetryLabel}>Humidity Density</Text>
              <Text style={styles.telemetryValue}>{humidity}%</Text>
              <Text style={styles.telemetryHint}>Vapor Saturation</Text>
            </View>
          </View>

          {/* How to Read This Radar Guide */}
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>📖 How to Read This Doppler Radar</Text>
            <Text style={styles.guideText}>
              • <Text style={{ color: COLORS.accent, fontFamily: FONTS.semiBold }}>Center Point:</Text> Represents your selected city ({cityName}).
            </Text>
            <Text style={styles.guideText}>
              • <Text style={{ color: '#4ADE80', fontFamily: FONTS.semiBold }}>Green Blobs:</Text> Light rainfall or moist cloud layers.
            </Text>
            <Text style={styles.guideText}>
              • <Text style={{ color: '#FACC15', fontFamily: FONTS.semiBold }}>Yellow Blobs:</Text> Moderate rain showers moving over surrounding areas.
            </Text>
            <Text style={styles.guideText}>
              • <Text style={{ color: '#F87171', fontFamily: FONTS.semiBold }}>Red Blobs:</Text> Heavy downpours, thunderstorms, or intense wind gust cells.
            </Text>
            <Text style={styles.guideText}>
              • <Text style={{ color: COLORS.sky, fontFamily: FONTS.semiBold }}>Rings (15/35/50 km):</Text> Distance radius from the center to track how far away rain clouds are.
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 110 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modePill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  modePillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.40)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  modePillText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  modePillTextActive: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
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
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: FONTS.semiBold,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  liveBadgeActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.cyan,
  },
  liveText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  layersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  layerChip: {
    paddingHorizontal: 13,
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
  },
  activeLayerText: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
  },
  mapCanvas: {
    width: '100%',
    height: 310,
    borderRadius: 28,
    backgroundColor: 'rgba(6, 11, 25, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.20)',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardinalText: {
    position: 'absolute',
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: 'rgba(56, 189, 248, 0.5)',
  },
  cardinalN: { top: 8, alignSelf: 'center' },
  cardinalS: { bottom: 58, alignSelf: 'center' },
  cardinalE: { right: 10, top: '44%' },
  cardinalW: { left: 10, top: '44%' },

  rangeMarker15: {
    position: 'absolute',
    top: '36%',
    right: '34%',
    fontSize: 9,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.25)',
  },
  rangeMarker35: {
    position: 'absolute',
    top: '25%',
    right: '21%',
    fontSize: 9,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.25)',
  },
  rangeMarker50: {
    position: 'absolute',
    top: '14%',
    right: '10%',
    fontSize: 9,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.25)',
  },

  gridLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  gridLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  ring1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.20)',
    borderStyle: 'dashed',
  },
  ring2: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  ring3: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.10)',
  },
  centerTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
  },
  centerTargetPing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  centerCityText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginTop: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stormCell: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.8,
  },
  sweepBeam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.8)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  legendCard: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  legendTitle: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
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
    fontSize: 8,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusBannerCalm: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  statusBannerStorm: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  statusBannerIcon: {
    fontSize: 22,
  },
  statusBannerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  statusBannerDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  telemetryCard: {
    width: (width - 50) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  telemetryIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  telemetryLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  telemetryValue: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  telemetryHint: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.accent,
    marginTop: 2,
  },
  guideCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  guideTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  guideText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 6,
  },
});
