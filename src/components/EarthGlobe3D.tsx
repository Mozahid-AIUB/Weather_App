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
} from 'react-native';
import Svg, {
  Circle,
  Path,
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { COLORS, FONTS } from '../constants';

const { width } = Dimensions.get('window');

// ── WORLD CITIES ON GLOBE ──────────────────────────────────────────
export interface GlobeCity {
  name: string;
  lon: number;
  lat: number;
  temp: number;
  condition: string;
  icon: string;
}

const CITIES: GlobeCity[] = [
  { name: 'Dhaka', lon: 90.4, lat: 23.8, temp: 28, condition: 'Clear', icon: '🌤️' },
  { name: 'Tokyo', lon: 139.7, lat: 35.7, temp: 19, condition: 'Partly Cloudy', icon: '☁️' },
  { name: 'London', lon: -0.1, lat: 51.5, temp: 14, condition: 'Rain', icon: '🌧️' },
  { name: 'New York', lon: -74.0, lat: 40.7, temp: 21, condition: 'Clear', icon: '☀️' },
  { name: 'Dubai', lon: 55.3, lat: 25.3, temp: 34, condition: 'Sunny', icon: '☀️' },
  { name: 'Sydney', lon: 151.2, lat: -33.9, temp: 22, condition: 'Breezy', icon: '💨' },
  { name: 'Paris', lon: 2.35, lat: 48.9, temp: 16, condition: 'Mild', icon: '🌤️' },
  { name: 'Cairo', lon: 31.2, lat: 30.0, temp: 29, condition: 'Sunny', icon: '☀️' },
  { name: 'Rio', lon: -43.2, lat: -22.9, temp: 27, condition: 'Warm', icon: '🏖️' },
  { name: 'Singapore', lon: 103.8, lat: 1.35, temp: 31, condition: 'Showers', icon: '🌦️' },
];

// ── SIMPLIFIED CONTINENT POLYGONS (Lon, Lat) ──────────────────────
const CONTINENTS: [number, number][][] = [
  // Africa
  [
    [-17, 15], [-12, 5], [9, 4], [8, -4], [12, -18], [18, -34], [28, -33], [33, -27],
    [40, -10], [51, 12], [44, 12], [32, 31], [10, 37], [-5, 36], [-17, 21], [-17, 15]
  ],
  // Eurasia (Europe + Asia)
  [
    [-9, 36], [-9, 43], [2, 51], [8, 55], [20, 60], [28, 70], [60, 70], [100, 77],
    [170, 67], [140, 50], [130, 42], [122, 30], [108, 22], [100, 5], [104, 1],
    [98, 10], [88, 22], [80, 13], [72, 23], [60, 25], [50, 30], [35, 32], [26, 38],
    [14, 38], [0, 42], [-9, 36]
  ],
  // North America
  [
    [-168, 65], [-160, 55], [-130, 50], [-124, 38], [-117, 32], [-105, 20], [-87, 13],
    [-77, 8], [-80, 25], [-81, 31], [-70, 42], [-60, 47], [-64, 58], [-80, 62],
    [-95, 70], [-135, 70], [-168, 65]
  ],
  // South America
  [
    [-77, 8], [-81, -5], [-78, -18], [-72, -38], [-68, -54], [-53, -33], [-35, -5],
    [-50, 0], [-60, 8], [-77, 8]
  ],
  // Australia
  [
    [114, -22], [115, -34], [135, -35], [150, -37], [153, -28], [144, -14], [136, -12],
    [125, -15], [114, -22]
  ],
  // Antarctica
  [
    [-180, -78], [-120, -75], [-60, -65], [0, -70], [60, -66], [120, -66], [180, -78], [-180, -78]
  ],
  // Greenland
  [
    [-44, 60], [-20, 70], [-25, 80], [-55, 82], [-50, 70], [-44, 60]
  ],
  // Indian Subcontinent Detail
  [
    [68, 24], [72, 19], [76, 10], [80, 8], [82, 15], [88, 22], [92, 24], [90, 26], [77, 30], [68, 24]
  ],
];

interface Props {
  currentCityName: string;
  onSelectCity?: (cityName: string) => void;
}

export const EarthGlobe3D: React.FC<Props> = ({ currentCityName, onSelectCity }) => {
  // Center longitude and latitude in degrees
  const [rotLon, setRotLon] = useState(90); // Default centered around Bangladesh / Asia
  const [rotLat, setRotLat] = useState(15);
  const [zoom, setZoom] = useState(1.0); // 0.8 to 2.2
  const [autoSpin, setAutoSpin] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>(currentCityName);

  const rotLonRef = useRef(rotLon);
  rotLonRef.current = rotLon;
  const rotLatRef = useRef(rotLat);
  rotLatRef.current = rotLat;
  const autoSpinRef = useRef(autoSpin);
  autoSpinRef.current = autoSpin;

  // Globe dimensions
  const globeSize = Math.min(width - 48, 330);
  const baseRadius = (globeSize / 2) - 16;
  const R = baseRadius * zoom;
  const cx = globeSize / 2;
  const cy = globeSize / 2;

  // Auto-spin animation loop
  useEffect(() => {
    let animId: number;
    let lastTime = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = now - lastTime;
      lastTime = now;

      if (autoSpinRef.current) {
        setRotLon((prev) => (prev + (dt * 0.015)) % 360);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
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
        const sensitivity = 0.35 / zoom;
        setRotLon((prev) => (prev - gestureState.vx * 3.5 * sensitivity) % 360);
        setRotLat((prev) => Math.max(-65, Math.min(65, prev + gestureState.vy * 2.5 * sensitivity)));
      },
      onPanResponderRelease: () => {
        // Leave autoSpin off so user can inspect
      },
    })
  ).current;

  // Orthographic 3D projection math
  const project = (lonDeg: number, latDeg: number): { x: number; y: number; z: number } => {
    const lambda = (lonDeg * Math.PI) / 180;
    const phi = (latDeg * Math.PI) / 180;
    const lambda0 = (rotLon * Math.PI) / 180;
    const phi0 = (rotLat * Math.PI) / 180;

    const dLambda = lambda - lambda0;

    // 3D coordinates relative to view
    const x3d = R * Math.cos(phi) * Math.sin(dLambda);
    const y3d = R * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dLambda));
    const z3d = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dLambda);

    return {
      x: cx + x3d,
      y: cy - y3d,
      z: z3d,
    };
  };

  // Convert continent points to SVG Path with smooth curves
  const renderContinentPath = (points: [number, number][], idx: number) => {
    let d = '';
    let visiblePoints = 0;

    for (let i = 0; i < points.length; i++) {
      const p = project(points[i][0], points[i][1]);
      if (p.z > -0.15) {
        visiblePoints++;
        const cmd = d === '' ? 'M' : 'L';
        d += `${cmd} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
      }
    }

    if (visiblePoints < 2 || d === '') return null;
    d += 'Z';

    return (
      <Path
        key={idx}
        d={d}
        fill="rgba(52, 211, 153, 0.55)"
        stroke="rgba(16, 185, 129, 0.85)"
        strokeWidth={1}
      />
    );
  };

  // Render Latitude & Longitude Graticule rings (3D wireframe mesh)
  const renderGraticules = () => {
    const latRings = [-40, -20, 0, 20, 40];
    const lonLines = [0, 45, 90, 135, 180, 225, 270, 315];

    return (
      <G opacity={0.22}>
        {/* Parallels (Latitudes) */}
        {latRings.map((lat, i) => {
          let path = '';
          for (let lon = -180; lon <= 180; lon += 15) {
            const p = project(lon, lat);
            if (p.z > 0) {
              path += (path === '' ? 'M' : 'L') + ` ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
            } else {
              path = ''; // break path when crossing horizon
            }
          }
          return path ? (
            <Path key={`lat-${i}`} d={path} stroke="#38BDF8" strokeWidth={0.8} fill="none" />
          ) : null;
        })}

        {/* Meridians (Longitudes) */}
        {lonLines.map((lon, i) => {
          let path = '';
          for (let lat = -80; lat <= 80; lat += 10) {
            const p = project(lon, lat);
            if (p.z > 0) {
              path += (path === '' ? 'M' : 'L') + ` ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
            }
          }
          return path ? (
            <Path key={`lon-${i}`} d={path} stroke="#38BDF8" strokeWidth={0.8} fill="none" />
          ) : null;
        })}
      </G>
    );
  };

  // Weather Cloud Band Swirls across globe
  const renderCloudSwirls = () => {
    // Semi-transparent rotating white weather front swirls
    const cloudOffset = (rotLon * 1.15) % 360; // clouds drift faster
    const cloudPaths = [
      { lat: 10, len: 60, start: (cloudOffset + 30) % 360 },
      { lat: -25, len: 80, start: (cloudOffset + 180) % 360 },
      { lat: 45, len: 70, start: (cloudOffset + 90) % 360 },
    ];

    return (
      <G opacity={0.35}>
        {cloudPaths.map((c, i) => {
          let d = '';
          for (let l = 0; l <= c.len; l += 8) {
            const p = project(c.start + l, c.lat + Math.sin(l * 0.1) * 8);
            if (p.z > 0.05) {
              d += (d === '' ? 'M' : 'L') + ` ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
            }
          }
          return d ? (
            <Path
              key={`cloud-${i}`}
              d={d}
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth={8 * zoom}
              strokeLinecap="round"
              fill="none"
            />
          ) : null;
        })}
      </G>
    );
  };

  const handleCityTap = (c: GlobeCity) => {
    setSelectedCity(c.name);
    // Smoothly rotate globe to face selected city
    setRotLon(c.lon);
    setRotLat(Math.max(-40, Math.min(40, c.lat)));
    setAutoSpin(false);
    onSelectCity?.(c.name);
  };

  return (
    <View style={styles.container}>
      {/* 3D Earth Title Bar */}
      <View style={styles.topControlBar}>
        <View>
          <Text style={styles.globeTitle}>3D Satellite Earth</Text>
          <Text style={styles.globeSubtitle}>Touch & drag to rotate · Zoom in / out</Text>
        </View>

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

      {/* Main Interactive 3D Sphere Canvas */}
      <View style={[styles.canvasBox, { height: globeSize + 20 }]} {...panResponder.panHandlers}>
        {/* Outer Deep Space Nebula Glow */}
        <View style={[styles.spaceGlow, { width: globeSize + 40, height: globeSize + 40, borderRadius: (globeSize + 40) / 2 }]} />

        <Svg width={globeSize} height={globeSize} viewBox={`0 0 ${globeSize} ${globeSize}`}>
          <Defs>
            {/* Ocean radial depth gradient (sunlit top-left to shadow bottom-right) */}
            <RadialGradient id="oceanGrad" cx="38%" cy="32%" r="65%">
              <Stop offset="0%" stopColor="#1E40AF" stopOpacity="1" />
              <Stop offset="45%" stopColor="#0F2459" stopOpacity="1" />
              <Stop offset="85%" stopColor="#081432" stopOpacity="1" />
              <Stop offset="100%" stopColor="#030712" stopOpacity="1" />
            </RadialGradient>

            {/* Atmosphere Rim Glow (Fresnel haze) */}
            <RadialGradient id="atmoGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="82%" stopColor="#38BDF8" stopOpacity="0" />
              <Stop offset="94%" stopColor="#38BDF8" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#22D3EE" stopOpacity="0.95" />
            </RadialGradient>
          </Defs>

          {/* Deep Ocean Globe Sphere */}
          <Circle cx={cx} cy={cy} r={R} fill="url(#oceanGrad)" />

          {/* 3D Wireframe Graticule Grid */}
          {renderGraticules()}

          {/* Continents projected onto 3D Sphere */}
          {CONTINENTS.map((pts, i) => renderContinentPath(pts, i))}

          {/* Real-time Weather Clouds */}
          {renderCloudSwirls()}

          {/* Outer Atmospheric Aura */}
          <Circle cx={cx} cy={cy} r={R + 3} fill="url(#atmoGlow)" />
          <Circle cx={cx} cy={cy} r={R} stroke="rgba(56, 189, 248, 0.4)" strokeWidth={1.5} fill="none" />
        </Svg>

        {/* 3D Floating City Pins & Weather Beacons */}
        {CITIES.map((c) => {
          const p = project(c.lon, c.lat);
          // Only show cities facing the camera (front hemisphere)
          if (p.z <= 0.12) return null;

          const isSelected = selectedCity.toLowerCase() === c.name.toLowerCase();

          return (
            <TouchableOpacity
              key={c.name}
              style={[
                styles.cityPinWrap,
                {
                  left: p.x - 22,
                  top: p.y - 32,
                  opacity: Math.min(1, (p.z - 0.1) * 2.5),
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

        {/* Floating Zoom Controls ("Close kora jai / Zoom in & out") */}
        <View style={styles.zoomControlPill}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoom((z) => Math.min(1.85, z + 0.2))}
            activeOpacity={0.7}
          >
            <Text style={styles.zoomBtnText}>➕</Text>
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => setZoom((z) => Math.max(0.75, z - 0.2))}
            activeOpacity={0.7}
          >
            <Text style={styles.zoomBtnText}>➖</Text>
          </TouchableOpacity>
        </View>

        {/* Zoom Level Indicator */}
        <View style={styles.zoomBadge}>
          <Text style={styles.zoomBadgeText}>{Math.round(zoom * 100)}% ZOOM</Text>
        </View>
      </View>

      {/* Quick World Cities Orbit Selector */}
      <View style={styles.cityQuickRow}>
        <Text style={styles.quickLabel}>QUICK WORLD FOCUS:</Text>
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
  autoSpinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 5,
  },
  autoSpinBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: COLORS.accent,
  },
  autoSpinIcon: {
    fontSize: 13,
    color: COLORS.accent,
  },
  autoSpinText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  canvasBox: {
    width: '100%',
    backgroundColor: 'rgba(4, 9, 22, 0.95)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  spaceGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(30, 64, 175, 0.14)',
  },
  cityPinWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 20,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 15, 33, 0.90)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.40)',
    paddingVertical: 2,
    paddingHorizontal: 7,
    gap: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  cityBadgeSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
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
    borderWidth: 1,
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
    backgroundColor: 'rgba(10, 18, 40, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 30,
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
    backgroundColor: 'rgba(10, 18, 40, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  zoomBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  cityQuickRow: {
    marginTop: 12,
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
