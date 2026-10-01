import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText, Line } from 'react-native-svg';
import { COLORS, FONTS } from '../constants';

interface Props {
  hourlyData: Array<{ time: string; pop: number; icon?: string }>;
}

export const PrecipitationChart: React.FC<Props> = ({ hourlyData }) => {
  const data = hourlyData.slice(0, 12);
  if (data.length === 0) return null;

  const maxPop = Math.max(...data.map(d => d.pop), 0.05);
  const svgW = 320;
  const svgH = 120;
  const barAreaH = 80;
  const barW = 16;
  const gap = (svgW - data.length * barW) / (data.length + 1);

  const getBarColor = (pop: number) => {
    if (pop < 0.2) return { start: '#38BDF8', end: '#0EA5E9' };
    if (pop < 0.5) return { start: '#22D3EE', end: '#06B6D4' };
    if (pop < 0.7) return { start: '#6366F1', end: '#4F46E5' };
    return { start: '#A855F7', end: '#7C3AED' };
  };

  const maxChance = Math.round(maxPop * 100);
  const avgChance = Math.round((data.reduce((s, d) => s + d.pop, 0) / data.length) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>🌧️</Text>
          <Text style={styles.title}>PRECIPITATION</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.statLabel}>Next 12h avg: </Text>
          <Text style={styles.statValue}>{avgChance}%</Text>
        </View>
      </View>

      {maxChance > 0 ? (
        <View style={styles.chartContainer}>
          <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
            <Defs>
              {data.map((d, i) => {
                const colors = getBarColor(d.pop);
                return (
                  <SvgGradient key={`grad-${i}`} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={colors.start} stopOpacity="0.9" />
                    <Stop offset="1" stopColor={colors.end} stopOpacity="0.4" />
                  </SvgGradient>
                );
              })}
            </Defs>

            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <Line
                key={i}
                x1={0}
                y1={barAreaH - ratio * barAreaH}
                x2={svgW}
                y2={barAreaH - ratio * barAreaH}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
              />
            ))}

            {/* Bars */}
            {data.map((d, i) => {
              const x = gap + i * (barW + gap);
              const barH = Math.max(2, (d.pop / Math.max(maxPop, 0.01)) * barAreaH);
              const y = barAreaH - barH;

              return (
                <React.Fragment key={i}>
                  <Rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={barW / 2}
                    ry={barW / 2}
                    fill={`url(#barGrad${i})`}
                  />
                  {/* Percentage above bar */}
                  {d.pop > 0.05 && (
                    <SvgText
                      x={x + barW / 2}
                      y={y - 4}
                      fill={COLORS.accent}
                      fontSize={8}
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {Math.round(d.pop * 100)}%
                    </SvgText>
                  )}
                  {/* Time label */}
                  <SvgText
                    x={x + barW / 2}
                    y={barAreaH + 14}
                    fill={COLORS.textMuted}
                    fontSize={8}
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {d.time}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </View>
      ) : (
        <View style={styles.noPrecip}>
          <Text style={styles.noPrecipEmoji}>☀️</Text>
          <Text style={styles.noPrecipText}>No precipitation expected in the next 12 hours</Text>
        </View>
      )}

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
          <Text style={styles.legendText}>Light</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22D3EE' }]} />
          <Text style={styles.legendText}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
          <Text style={styles.legendText}>Heavy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#A855F7' }]} />
          <Text style={styles.legendText}>Very Heavy</Text>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: { fontSize: 14 },
  title: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  noPrecip: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noPrecipEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  noPrecipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});
