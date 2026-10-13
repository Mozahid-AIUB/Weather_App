import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Mozahid Software mark: a peaked "M" with a small sun, on a warm gradient tile. */
export const BrandLogo: React.FC<{ size?: number; from: string; to: string }> = ({ size = 58, from, to }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <LinearGradient id="brandTile" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={from} />
        <Stop offset="1" stopColor={to} />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="64" height="64" rx="18" fill="url(#brandTile)" />
    <Path d="M15 45 V21 L32 36 L49 21 V45" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Circle cx="49" cy="12" r="4.5" fill="#FFFFFF" opacity={0.92} />
  </Svg>
);
