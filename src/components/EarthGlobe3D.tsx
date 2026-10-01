import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Animated,
  Easing,
  Image,
  Platform,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
  Path,
} from 'react-native-svg';
import { COLORS, FONTS } from '../constants';

const { width } = Dimensions.get('window');

// ── REAL PHOTOREALISTIC NASA BLUE MARBLE TEXTURE ─────────────────
// Local asset bundle with high-res NASA CDN fallback
const NASA_EARTH_IMG = require('../../assets/earth-blue-marble.jpg');

export interface GlobeCity {
  name: string;
  lon: number;
  lat: number;
  temp: number;
  condition: string;
  icon: string;
  radarStatus: string;
}

const CITIES: GlobeCity[] = [
  { name: 'Dhaka', lon: 90.4, lat: 23.8, temp: 28, condition: 'Clear', icon: '🌤️', radarStatus: 'Normal 0.1 mm/h' },
  { name: 'Tokyo', lon: 139.7, lat: 35.7, temp: 19, condition: 'Partly Cloudy', icon: '☁️', radarStatus: 'Scattered clouds' },
  { name: 'London', lon: -0.1, lat: 51.5, temp: 14, condition: 'Rain Showers', icon: '🌧️', radarStatus: 'Active Front 4 mm/h' },
  { name: 'New York', lon: -74.0, lat: 40.7, temp: 21, condition: 'Clear Sky', icon: '☀️', radarStatus: 'Clear Doppler Scan' },
  { name: 'Dubai', lon: 55.3, lat: 25.3, temp: 34, condition: 'Sunny', icon: '☀️', radarStatus: 'Dry Heat Index' },
  { name: 'Sydney', lon: 151.2, lat: -33.9, temp: 22, condition: 'Breezy', icon: '💨', radarStatus: 'Coastal Gusts 24 km/h' },
  { name: 'Paris', lon: 2.35, lat: 48.9, temp: 16, condition: 'Mild', icon: '🌤️', radarStatus: 'Stable Front' },
  { name: 'Cairo', lon: 31.2, lat: 30.0, temp: 29, condition: 'Sunny', icon: '☀️', radarStatus: 'Clear Sky' },
  { name: 'Rio', lon: -43.2, lat: -22.9, temp: 27, condition: 'Warm', icon: '🏖️', radarStatus: 'Moderate Moisture' },
  { name: 'Singapore', lon: 103.8, lat: 1.35, temp: 31, condition: 'Thunderstorm', icon: '⛈️', radarStatus: 'Cell Detected 18 mm/h' },
];

interface Props {
  currentCityName: string;
  onSelectCity?: (cityName: string) => void;
}

export const EarthGlobe3D: React.FC<Props> = ({ currentCityName, onSelectCity }) => {
  // Center rotation longitude & latitude in degrees
  const [rotLon, setRotLon] = useState(90); // Default centered on Bangladesh / Asia
  const [rotLat, setRotLat] = useState(15);
  const [zoom, setZoom] = useState(1.0); // 0.8 to 2.2
  const [autoSpin, setAutoSpin] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>(currentCityName);
  const [showRadarBeams, setShowRadarBeams] = useState(true);

  const rotLonRef = useRef(rotLon);
  rotLonRef.current = rotLon;
  const autoSpinRef = useRef(autoSpin);
  autoSpinRef.current = autoSpin;

  // Radar satellite sweep animation
  const radarSweepAnim = useRef(new Animated.Value(0)).current;

  // Base Globe Dimensions
  const globeSize = Math.min(width - 48, 320);
  const R = (globeSize / 2);
  const texWidth = Math.round(globeSize * Math.PI); // Equirectangular aspect ratio

  // Auto-spin animation loop
  useEffect(() => {
    let animId: number;
    let lastTime = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = now - lastTime;
      lastTime = now;

      if (autoSpinRef.current) {
        setRotLon((prev) => (prev + (dt * 0.018)) % 360);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Radar satellite rotation loop
  useEffect(() => {
    const sweep = Animated.loop(
      Animated.timing(radarSweepAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    sweep.start();
    return () => sweep.stop();
  }, []);

  // PanResponder for touch / drag 3D rotation
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setAutoSpin(false);
      },
      onPanResponderMove: (_, gestureState) => {
        const sensitivity = 0.42 / zoom;
        setRotLon((prev) => (prev - gestureState.vx * 3.2 * sensitivity) % 360);
        setRotLat((prev) => Math.max(-45, Math.min(45, prev + gestureState.vy * 2.2 * sensitivity)));
      },
    })
  ).current;

  // Calculate horizontal texture shift for seamless 360° wrapping
  const normLon = ((rotLon % 360) + 360) % 360;
  const texOffset = -((normLon / 360) * texWidth);
  const texOffsetY = (rotLat / 45) * (globeSize * 0.18);

  // 3D City Position Projection
  const projectCity = (lonDeg: number, latDeg: number) => {
    const lambda = (lonDeg * Math.PI) / 180;
    const phi = (latDeg * Math.PI) / 180;
    const lambda0 = (normLon * Math.PI) / 180;
    const phi0 = (rotLat * Math.PI) / 180;

    const dLambda = lambda - lambda0;

    // 3D coordinates relative to camera
    const x3d = R * Math.cos(phi) * Math.sin(dLambda);
    const y3d = R * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dLambda));
    const z3d = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dLambda);

    return {
      x: R + x3d,
      y: R - y3d,
      z: z3d,
    };
  };

  const handleCityTap = (c: GlobeCity) => {
    setSelectedCity(c.name);
    setRotLon(c.lon);
    setRotLat(Math.max(-35, Math.min(35, c.lat)));
    setAutoSpin(false);
    onSelectCity?.(c.name);
  };

  const radarSpinAngle = radarSweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* 3D Satellite Earth Title Bar */}
      <View style={styles.topControlBar}>
        <View>
          <Text style={styles.globeTitle}>Photorealistic Satellite Earth</Text>
          <Text style={styles.globeSubtitle}>
            NASA Blue Marble · Real Satellite Doppler Stream
          </Text>
        </View>

        <View style={styles.topActionsRow}>
          {/* Radar Waves Layer Toggle */}
          <TouchableOpacity
            style={[styles.radarLayerBtn, showRadarBeams && styles.radarLayerBtnActive]}
            onPress={() => setShowRadarBeams(!showRadarBeams)}
            activeOpacity={0.7}
          >
            <Text style={styles.radarLayerIcon}>📡</Text>
            <Text style={styles.radarLayerText}>{showRadarBeams ? 'Radar On' : 'Radar Off'}</Text>
          </TouchableOpacity>

          {/* Auto-Spin Toggle */}
          <TouchableOpacity
            style={[styles.autoSpinBtn, autoSpin && styles.autoSpinBtnActive]}
            onPress={() => setAutoSpin(!autoSpin)}
            activeOpacity={0.7}
          >
            <Text style={styles.autoSpinIcon}>⟳</Text>
            <Text style={styles.autoSpinText}>{autoSpin ? 'Spinning' : 'Spin'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Interactive 3D Sphere Box */}
      <View style={[styles.canvasBox, { height: globeSize + 24 }]} {...panResponder.panHandlers}>
        {/* Outer Deep Space Nebula Halo */}
        <View
          style={[
            styles.spaceGlow,
            {
              width: globeSize + 60,
              height: globeSize + 60,
              borderRadius: (globeSize + 60) / 2,
            },
          ]}
        />

        {/* ── 3D SPHERICAL CLIPPED CONTAINER ────────────────────── */}
        <View
          style={[
            styles.sphereViewport,
            {
              width: globeSize,
              height: globeSize,
              borderRadius: globeSize / 2,
              transform: [{ scale: zoom }],
            },
          ]}
        >
          {/* REAL NASA BLUE MARBLE TEXTURE LAYER (Tiled 3x for 360° seamless wrap) */}
          <View
            style={[
              styles.textureRow,
              {
                width: texWidth * 3,
                height: globeSize * 1.3,
                transform: [
                  { translateX: texOffset - texWidth },
                  { translateY: texOffsetY },
                ],
              },
            ]}
          >
            <Image source={NASA_EARTH_IMG} style={{ width: texWidth, height: '100%' }} resizeMode="stretch" />
            <Image source={NASA_EARTH_IMG} style={{ width: texWidth, height: '100%' }} resizeMode="stretch" />
            <Image source={NASA_EARTH_IMG} style={{ width: texWidth, height: '100%' }} resizeMode="stretch" />
          </View>

          {/* SATELLITE DOPPLER WEATHER RADAR BEAM SWEEP OVERLAY */}
          {showRadarBeams && (
            <Animated.View
              style={[
                styles.radarBeamOverlay,
                {
                  transform: [{ rotate: radarSpinAngle }],
                },
              ]}
            >
              <Svg width={globeSize} height={globeSize} viewBox={`0 0 ${globeSize} ${globeSize}`}>
                <Defs>
                  <SvgLinearGradient id="radarSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
                    <Stop offset="70%" stopColor="#38BDF8" stopOpacity="0.15" />
                    <Stop offset="100%" stopColor="#22D3EE" stopOpacity="0.45" />
                  </SvgLinearGradient>
                </Defs>
                <Path
                  d={`M ${R} ${R} L ${globeSize} 0 A ${R} ${R} 0 0 1 ${globeSize} ${R} Z`}
                  fill="url(#radarSweepGrad)"
                />
              </Svg>
            </Animated.View>
          )}

          {/* 3D SPHERICAL SHADING & LIMB DARKENING LENS */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width={globeSize} height={globeSize} viewBox={`0 0 ${globeSize} ${globeSize}`}>
              <Defs>
                {/* 3D Spherical Volume Shading: Sunlit highlight at (32%, 28%) + Limb Darkening */}
                <RadialGradient id="sphericalLens" cx="32%" cy="28%" r="68%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
                  <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0" />
                  <Stop offset="72%" stopColor="#020617" stopOpacity="0.25" />
                  <Stop offset="90%" stopColor="#020617" stopOpacity="0.75" />
                  <Stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
                </RadialGradient>

                {/* Day / Night Terminator Shadow (Shadowing the unlit side) */}
                <SvgLinearGradient id="terminatorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="35%" stopColor="#000000" stopOpacity="0" />
                  <Stop offset="75%" stopColor="#020617" stopOpacity="0.40" />
                  <Stop offset="100%" stopColor="#020617" stopOpacity="0.75" />
                </SvgLinearGradient>
              </Defs>

              {/* Day/Night Shadow */}
              <Circle cx={R} cy={R} r={R} fill="url(#terminatorGrad)" />

              {/* 3D Sphere Normal Shading */}
              <Circle cx={R} cy={R} r={R} fill="url(#sphericalLens)" />

              {/* Equator & Tropical Radar Orbit Rings */}
              {showRadarBeams && (
                <G opacity={0.25}>
                  <Circle cx={R} cy={R} r={R * 0.65} stroke="#38BDF8" strokeWidth={1} strokeDasharray="6,4" fill="none" />
                  <Circle cx={R} cy={R} r={R * 0.9} stroke="#22D3EE" strokeWidth={0.8} fill="none" />
                </G>
              )}
            </Svg>
          </View>

          {/* REALISTIC ATMOSPHERIC RAYLEIGH SCATTERING GLOW (NASA Blue Rim) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width={globeSize} height={globeSize} viewBox={`0 0 ${globeSize} ${globeSize}`}>
              <Defs>
                <RadialGradient id="atmoRimGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="82%" stopColor="#38BDF8" stopOpacity="0" />
                  <Stop offset="93%" stopColor="#38BDF8" stopOpacity="0.40" />
                  <Stop offset="100%" stopColor="#67E8F9" stopOpacity="0.95" />
                </RadialGradient>
              </Defs>
              <Circle cx={R} cy={R} r={R} fill="url(#atmoRimGlow)" />
              <Circle cx={R} cy={R} r={R} stroke="rgba(56, 189, 248, 0.55)" strokeWidth={1.5} fill="none" />
            </Svg>
          </View>

          {/* 3D FLOATING CITY WEATHER BEACONS (Calculated Spherical Horizon) */}
          {CITIES.map((c) => {
            const p = projectCity(c.lon, c.lat);
            // Hide cities orbiting on the back side of Earth
            if (p.z <= 0.18) return null;

            const isSelected = selectedCity.toLowerCase() === c.name.toLowerCase();

            return (
              <TouchableOpacity
                key={c.name}
                style={[
                  styles.cityPinWrap,
                  {
                    left: p.x - 24,
                    top: p.y - 34,
                    opacity: Math.min(1, (p.z - 0.15) * 2.8),
                  },
                ]}
                onPress={() => handleCityTap(c)}
                activeOpacity={0.8}
              >
                <View style={[styles.cityBadge, isSelected && styles.cityBadgeSelected]}>
                  <Text style={styles.cityBadgeIcon}>{c.icon}</Text>
                  <Text style={styles.cityBadgeText}>{c.name}</Text>
                  <Text style={styles.cityBadgeTemp}>{c.temp}°</Text>
                </View>
                <View style={[styles.cityPinDot, isSelected && styles.cityPinDotSelected]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── FLOATING ZOOM IN / ZOOM OUT CONTROLS ("Close kora jai") ── */}
        <View style={styles.zoomControlPill}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoom((z) => Math.min(2.1, z + 0.25))}
            activeOpacity={0.7}
          >
            <Text style={styles.zoomBtnText}>➕</Text>
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoom((z) => Math.max(0.75, z - 0.25))}
            activeOpacity={0.7}
          >
            <Text style={styles.zoomBtnText}>➖</Text>
          </TouchableOpacity>
        </View>

        {/* Zoom Level Indicator */}
        <View style={styles.zoomBadge}>
          <Text style={styles.zoomBadgeText}>{Math.round(zoom * 100)}% CLOSE-UP</Text>
        </View>
      </View>

      {/* ── SATELLITE RADAR EXPLANATION & RELATION CARD ──────────── */}
      <View style={styles.relationCard}>
        <View style={styles.relationHeader}>
          <Text style={styles.relationIcon}>🛰️</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.relationTitle}>Earth & Radar Relationship</Text>
            <Text style={styles.relationSubtitle}>
              Global Satellite Doppler Grid vs Ground Radar
            </Text>
          </View>
        </View>
        <Text style={styles.relationBody}>
          Weather satellites (NASA, NOAA GOES, EUMETSAT) orbit the Earth in space, scanning planetary cloud tops, tropical cyclones, and storm fronts across continents.
          {'\n\n'}
          • <Text style={{ color: COLORS.accent, fontFamily: FONTS.semiBold }}>3D Earth View:</Text> Shows planetary storm systems, cyclone paths, and satellite Doppler cloud sweeps worldwide.
          {'\n'}
          • <Text style={{ color: '#4ADE80', fontFamily: FONTS.semiBold }}>2D Doppler Radar:</Text> Switches to high-resolution local ground radar within 50 km of your selected city for real-time rain intensity.
        </Text>
      </View>

      {/* ── QUICK WORLD CITIES ORBIT SELECTOR ───────────────────── */}
      <View style={styles.cityQuickRow}>
        <Text style={styles.quickLabel}>QUICK SATELLITE ORBIT FOCUS:</Text>
        <View style={styles.quickChipsGrid}>
          {CITIES.slice(0, 6).map((c) => (
            <TouchableOpacity
              key={c.name}
              style={[styles.quickChip, selectedCity === c.name && styles.quickChipActive]}
              onPress={() => handleCityTap(c)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>
                {c.icon} {c.name} {c.temp}°
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  globeTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  globeSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: 7,
  },
  radarLayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    gap: 4,
  },
  radarLayerBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: COLORS.accent,
  },
  radarLayerIcon: {
    fontSize: 12,
  },
  radarLayerText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  autoSpinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    gap: 4,
  },
  autoSpinBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: COLORS.accent,
  },
  autoSpinIcon: {
    fontSize: 12,
    color: COLORS.accent,
  },
  autoSpinText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  canvasBox: {
    width: '100%',
    backgroundColor: '#020617',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  spaceGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(30, 64, 175, 0.12)',
  },
  sphereViewport: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#030712',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 15,
  },
  textureRow: {
    position: 'absolute',
    flexDirection: 'row',
  },
  radarBeamOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 5,
  },
  cityPinWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 25,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 14, 28, 0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    paddingVertical: 2,
    paddingHorizontal: 7,
    gap: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  cityBadgeSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.30)',
    borderColor: '#38BDF8',
  },
  cityBadgeIcon: {
    fontSize: 11,
  },
  cityBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  cityBadgeTemp: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: COLORS.accent,
  },
  cityPinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    borderWidth: 1.5,
    borderColor: '#FFF',
    marginTop: 2,
  },
  cityPinDotSelected: {
    backgroundColor: '#F59E0B',
    transform: [{ scale: 1.3 }],
  },
  zoomControlPill: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    backgroundColor: 'rgba(8, 14, 28, 0.90)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 35,
  },
  zoomBtn: {
    padding: 6,
  },
  zoomBtnText: {
    fontSize: 13,
  },
  zoomDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 3,
  },
  zoomBadge: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    backgroundColor: 'rgba(8, 14, 28, 0.75)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  zoomBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  relationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.20)',
    padding: 16,
    marginTop: 14,
    marginBottom: 14,
  },
  relationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  relationIcon: {
    fontSize: 22,
  },
  relationTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  relationSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.accent,
  },
  relationBody: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  cityQuickRow: {
    marginTop: 4,
  },
  quickLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  quickChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: COLORS.accent,
  },
  quickChipText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
});
