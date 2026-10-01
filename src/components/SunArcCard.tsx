import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';
import { COLORS, FONTS } from '../constants';

interface Props {
  sunrise: number; // unix timestamp
  sunset: number;  // unix timestamp
}

export const SunArcCard: React.FC<Props> = ({ sunrise, sunset }) => {
  const now = Date.now() / 1000;
  const totalDaylight = sunset - sunrise;
  const elapsed = Math.max(0, Math.min(now - sunrise, totalDaylight));
  const progress = totalDaylight > 0 ? elapsed / totalDaylight : 0;
  const isDaytime = now >= sunrise && now <= sunset;

  const formatTime = (unix: number) => {
    if (!unix) return '--:--';
    const d = new Date(unix * 1000);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const daylightHours = Math.floor(totalDaylight / 3600);
  const daylightMins = Math.round((totalDaylight % 3600) / 60);
  const remainingSeconds = isDaytime ? (sunset - now) : 0;
  const remainingHrs = Math.floor(remainingSeconds / 3600);
  const remainingMins = Math.round((remainingSeconds % 3600) / 60);

  // SVG arc geometry
  const svgW = 280;
  const svgH = 130;
  const cx = svgW / 2;
  const cy = svgH - 10;
  const rx = 120;
  const ry = 95;

  // Arc from left to right (semi-ellipse)
  const startX = cx - rx;
  const startY = cy;
  const endX = cx + rx;
  const endY = cy;

  const arcPath = `M ${startX} ${startY} A ${rx} ${ry} 0 0 1 ${endX} ${endY}`;

  // Calculate sun position on arc
  const sunAngle = Math.PI * (1 - progress);
  const sunX = cx + rx * Math.cos(sunAngle);
  const sunY = cy - ry * Math.sin(sunAngle);

  // Horizon line
  const horizonY = cy;

  // Progress arc (only the filled part)
  // Approximate with a point on the arc
  const progressPath = progress > 0 && progress < 1
    ? `M ${startX} ${startY} A ${rx} ${ry} 0 0 1 ${sunX} ${sunY}`
    : arcPath;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{isDaytime ? '☀️' : '🌙'}</Text>
        <Text style={styles.title}>{isDaytime ? 'SUNSET' : 'SUNRISE'}</Text>
      </View>

      <Text style={styles.nextTime}>
        {isDaytime ? formatTime(sunset) : formatTime(sunrise)}
      </Text>

      <View style={styles.arcContainer}>
        <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          <Defs>
            <SvgGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={COLORS.amber} stopOpacity="0.15" />
              <Stop offset="0.5" stopColor={COLORS.amber} stopOpacity="0.5" />
              <Stop offset="1" stopColor={COLORS.orange} stopOpacity="0.15" />
            </SvgGradient>
            <SvgGradient id="arcProgressGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={COLORS.amber} stopOpacity="0.9" />
              <Stop offset="1" stopColor={COLORS.orange} stopOpacity="0.9" />
            </SvgGradient>
            <SvgGradient id="sunGlowGrad" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#FBBF24" stopOpacity="0.5" />
              <Stop offset="1" stopColor="#FBBF24" stopOpacity="0" />
            </SvgGradient>
          </Defs>

          {/* Horizon line */}
          <Path
            d={`M ${startX - 10} ${horizonY} L ${endX + 10} ${horizonY}`}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Full arc track */}
          <Path
            d={arcPath}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          {progress > 0.01 && (
            <Path
              d={progressPath}
              fill="none"
              stroke="url(#arcProgressGrad)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          )}

          {/* Sun glow */}
          {isDaytime && (
            <Circle cx={sunX} cy={sunY} r={18} fill="url(#sunGlowGrad)" />
          )}

          {/* Sun dot */}
          <Circle
            cx={isDaytime ? sunX : startX}
            cy={isDaytime ? sunY : startY}
            r={5}
            fill={isDaytime ? '#FBBF24' : '#94A3B8'}
          />

          {/* Sunrise label */}
          <SvgText x={startX} y={cy + 16} fill={COLORS.textMuted} fontSize={9} fontWeight="600" textAnchor="middle">
            {formatTime(sunrise)}
          </SvgText>

          {/* Sunset label */}
          <SvgText x={endX} y={cy + 16} fill={COLORS.textMuted} fontSize={9} fontWeight="600" textAnchor="middle">
            {formatTime(sunset)}
          </SvgText>
        </Svg>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Daylight</Text>
          <Text style={styles.infoValue}>{daylightHours}h {daylightMins}m</Text>
        </View>
        {isDaytime && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Remaining</Text>
            <Text style={[styles.infoValue, { color: COLORS.amber }]}>{remainingHrs}h {remainingMins}m</Text>
          </View>
        )}
      </View>
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
    marginHorizontal: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  icon: { fontSize: 14 },
  title: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  nextTime: {
    fontSize: 28,
    color: '#FFF',
    fontFamily: FONTS.light,
    fontWeight: '300',
    marginBottom: 4,
  },
  arcContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
});
