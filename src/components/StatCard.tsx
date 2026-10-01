import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS } from '../constants';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  accentColor?: string;
  gaugeProgress?: number; // 0 to 1
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  unit,
  subtext,
  accentColor = COLORS.accent,
  gaugeProgress,
}) => {
  const showGauge = gaugeProgress !== undefined;
  const size = 44;
  const strokeW = 3.5;
  const r = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.max(0.02, Math.min(1, gaugeProgress || 0));
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={styles.card}>
      {/* Subtle top accent line */}
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.content}>
        {showGauge ? (
          <View style={styles.gaugeRow}>
            <View style={styles.gaugeWrap}>
              <Svg width={size} height={size}>
                <Defs>
                  <SvgGradient id={`stat-${label}`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={accentColor} stopOpacity="0.3" />
                    <Stop offset="1" stopColor={accentColor} stopOpacity="1" />
                  </SvgGradient>
                </Defs>
                <Circle
                  cx={size / 2} cy={size / 2} r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={strokeW}
                />
                <Circle
                  cx={size / 2} cy={size / 2} r={r}
                  fill="none"
                  stroke={`url(#stat-${label})`}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={dashOffset}
                  transform={`rotate(-90, ${size / 2}, ${size / 2})`}
                />
              </Svg>
              <View style={styles.gaugeCenter}>
                <Text style={[styles.gaugeValue, { color: accentColor }]}>{value}</Text>
              </View>
            </View>
            {unit && <Text style={styles.gaugeUnit}>{unit}</Text>}
          </View>
        ) : (
          <View style={styles.valueRow}>
            <Text style={styles.value}>{value}</Text>
            {unit && <Text style={styles.unit}>{unit}</Text>}
          </View>
        )}
        {subtext && <Text style={styles.subtext} numberOfLines={2}>{subtext}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    margin: 5,
    minWidth: '45%',
    minHeight: 130,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    borderRadius: 1,
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  content: {
    marginTop: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontSize: 26,
    color: COLORS.textPrimary,
    fontFamily: FONTS.light,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  gaugeRow: {
    alignItems: 'center',
  },
  gaugeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValue: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  gaugeUnit: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginTop: 2,
  },
  subtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 15,
  },
});
