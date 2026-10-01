import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText, Polygon } from 'react-native-svg';
import { COLORS, FONTS } from '../constants';

interface Props {
  speed: number;
  direction: number;
  gustSpeed?: number;
  unit: 'metric' | 'imperial';
}

const AnimatedG = Animated.createAnimatedComponent(G);

export const WindCompassCard: React.FC<Props> = ({
  speed,
  direction,
  gustSpeed,
  unit = 'imperial',
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const windSpeed = unit === 'imperial' ? Math.round(speed * 2.237) : Math.round(speed);
  const gust = gustSpeed ? (unit === 'imperial' ? Math.round(gustSpeed * 2.237) : Math.round(gustSpeed)) : null;
  const speedUnit = unit === 'imperial' ? 'mph' : 'm/s';

  const getDirectionLabel = (deg: number) => {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  };

  const getBeaufortDescription = (ws: number, isImperial: boolean) => {
    const mph = isImperial ? ws : ws * 2.237;
    if (mph < 4) return 'Calm';
    if (mph < 8) return 'Light Air';
    if (mph < 13) return 'Light Breeze';
    if (mph < 19) return 'Gentle Breeze';
    if (mph < 25) return 'Moderate';
    if (mph < 32) return 'Fresh Breeze';
    if (mph < 39) return 'Strong';
    return 'Near Gale';
  };

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: direction,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, [direction]);

  const size = 160;
  const center = size / 2;
  const compassR = 62;
  const cardinals = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'W', angle: 270 },
  ];

  const intercardinals = [
    { label: 'NE', angle: 45 },
    { label: 'SE', angle: 135 },
    { label: 'SW', angle: 225 },
    { label: 'NW', angle: 315 },
  ];

  // Arrow tip coordinates
  const arrowLen = 42;
  const arrowAngleRad = ((direction - 90) * Math.PI) / 180;
  const tipX = center + arrowLen * Math.cos(arrowAngleRad);
  const tipY = center + arrowLen * Math.sin(arrowAngleRad);
  const tailX = center - arrowLen * 0.5 * Math.cos(arrowAngleRad);
  const tailY = center - arrowLen * 0.5 * Math.sin(arrowAngleRad);
  const wingSpread = 6;
  const perpX = -Math.sin(arrowAngleRad) * wingSpread;
  const perpY = Math.cos(arrowAngleRad) * wingSpread;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>🧭</Text>
        <Text style={styles.title}>WIND</Text>
      </View>

      <View style={styles.compassContainer}>
        <Svg width={size} height={size}>
          {/* Outer ring */}
          <Circle cx={center} cy={center} r={compassR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} />
          <Circle cx={center} cy={center} r={compassR - 15} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="3,4" />

          {/* Tick marks */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 - 90) * (Math.PI / 180);
            const r1 = compassR - 3;
            const r2 = i % 9 === 0 ? compassR - 10 : compassR - 6;
            return (
              <Line
                key={i}
                x1={center + r1 * Math.cos(angle)}
                y1={center + r1 * Math.sin(angle)}
                x2={center + r2 * Math.cos(angle)}
                y2={center + r2 * Math.sin(angle)}
                stroke={i % 9 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}
                strokeWidth={i % 9 === 0 ? 1.5 : 0.8}
              />
            );
          })}

          {/* Cardinal labels */}
          {cardinals.map((c) => {
            const a = (c.angle - 90) * (Math.PI / 180);
            const labelR = compassR - 20;
            return (
              <SvgText
                key={c.label}
                x={center + labelR * Math.cos(a)}
                y={center + labelR * Math.sin(a) + 4}
                fill={c.label === 'N' ? COLORS.accent : 'rgba(255,255,255,0.5)'}
                fontSize={c.label === 'N' ? 12 : 10}
                fontWeight="700"
                textAnchor="middle"
              >
                {c.label}
              </SvgText>
            );
          })}

          {/* Intercardinal labels */}
          {intercardinals.map((c) => {
            const a = (c.angle - 90) * (Math.PI / 180);
            const labelR = compassR - 20;
            return (
              <SvgText
                key={c.label}
                x={center + labelR * Math.cos(a)}
                y={center + labelR * Math.sin(a) + 3}
                fill="rgba(255,255,255,0.25)"
                fontSize={8}
                fontWeight="600"
                textAnchor="middle"
              >
                {c.label}
              </SvgText>
            );
          })}

          {/* Wind direction arrow */}
          <Polygon
            points={`${tipX},${tipY} ${tailX + perpX},${tailY + perpY} ${tailX - perpX},${tailY - perpY}`}
            fill={COLORS.accent}
            opacity={0.9}
          />
          <Circle cx={center} cy={center} r={4} fill={COLORS.accent} opacity={0.6} />
        </Svg>

        {/* Center speed readout */}
        <View style={styles.centerLabel}>
          <Text style={styles.speedValue}>{windSpeed}</Text>
          <Text style={styles.speedUnit}>{speedUnit}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Direction</Text>
          <Text style={styles.infoValue}>{getDirectionLabel(direction)} · {direction}°</Text>
        </View>
        {gust && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Gusts</Text>
            <Text style={[styles.infoValue, { color: COLORS.amber }]}>{gust} {speedUnit}</Text>
          </View>
        )}
      </View>

      <Text style={styles.beaufort}>{getBeaufortDescription(windSpeed, unit === 'imperial')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  icon: { fontSize: 14 },
  title: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 1,
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedValue: {
    fontSize: 28,
    color: '#FFF',
    fontFamily: FONTS.light,
    fontWeight: '300',
    letterSpacing: -1,
    lineHeight: 30,
  },
  speedUnit: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginTop: -2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: '#FFF',
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginTop: 2,
  },
  beaufort: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});
