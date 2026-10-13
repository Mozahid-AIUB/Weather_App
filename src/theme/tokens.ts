export type ThemeMode = 'day' | 'night';

export const FONTS = {
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  extraBold: 'Outfit_800ExtraBold',
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
export const RADIUS = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 };

export interface Palette {
  mode: ThemeMode;
  text: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
  surfaceStrong: string;
  surfaceSunken: string;
  border: string;
  divider: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  info: string;
  warning: string;
  danger: string;
  success: string;
  overlay: string;
  cardShadow: string;
  tempCold: string;
  tempWarm: string;
  icon: {
    sun: string;
    moon: string;
    cloud: string;
    cloudDark: string;
    rain: string;
    snow: string;
    bolt: string;
    fog: string;
  };
  sky: {
    clear: [string, string, string];
    overcast: [string, string, string];
    celestial: string;
    glow: string;
    cloud: string;
    rain: string;
    snow: string;
    star: string;
  };
}

// Cream-white daylight palette — warm paper tones, sun-orange accent.
const day: Palette = {
  mode: 'day',
  text: '#2A2118',
  textSecondary: '#6E5F4E',
  textMuted: '#A08F7A',
  surface: 'rgba(255, 255, 255, 0.68)',
  surfaceStrong: '#FFFCF6',
  surfaceSunken: 'rgba(110, 80, 40, 0.06)',
  border: 'rgba(110, 80, 40, 0.09)',
  divider: 'rgba(110, 80, 40, 0.08)',
  accent: '#E5762F',
  accentSoft: 'rgba(229, 118, 47, 0.12)',
  onAccent: '#FFFFFF',
  info: '#3A7FC4',
  warning: '#C97A0A',
  danger: '#D2483A',
  success: '#2F9E6A',
  overlay: 'rgba(42, 33, 24, 0.32)',
  cardShadow: '0px 8px 24px rgba(138, 106, 63, 0.10)',
  tempCold: '#5AA9E6',
  tempWarm: '#F08A3C',
  icon: {
    sun: '#F5A524',
    moon: '#7D8FD1',
    cloud: '#AEB8C6',
    cloudDark: '#8C97A8',
    rain: '#4A90D9',
    snow: '#7FB5E6',
    bolt: '#F2B230',
    fog: '#A9A196',
  },
  sky: {
    clear: ['#FFF8EC', '#FCEFDC', '#F6E3C8'],
    overcast: ['#F8F5F0', '#EFEBE4', '#E4E0D8'],
    celestial: '#FFC15C',
    glow: 'rgba(255, 176, 66, 0.45)',
    cloud: 'rgba(150, 138, 122, 0.16)',
    rain: 'rgba(74, 144, 217, 0.45)',
    snow: 'rgba(140, 170, 205, 0.75)',
    star: 'transparent',
  },
};

// Moonlit night palette — deep navy, periwinkle accent.
const night: Palette = {
  mode: 'night',
  text: '#F3F1EC',
  textSecondary: '#A9B3C7',
  textMuted: '#6C7791',
  surface: 'rgba(255, 255, 255, 0.055)',
  surfaceStrong: '#0E1529',
  surfaceSunken: 'rgba(255, 255, 255, 0.04)',
  border: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.07)',
  accent: '#9DB4FF',
  accentSoft: 'rgba(157, 180, 255, 0.14)',
  onAccent: '#0A1124',
  info: '#7CC4FF',
  warning: '#F5B54A',
  danger: '#FF7A6B',
  success: '#5BD6A0',
  overlay: 'rgba(0, 0, 0, 0.55)',
  cardShadow: '0px 8px 24px rgba(0, 0, 0, 0.25)',
  tempCold: '#7CC4FF',
  tempWarm: '#FFB36B',
  icon: {
    sun: '#FFC555',
    moon: '#DCE3FF',
    cloud: '#C5CEE0',
    cloudDark: '#8E99B3',
    rain: '#7CC4FF',
    snow: '#E6F1FF',
    bolt: '#FFD24D',
    fog: '#9AA4B8',
  },
  sky: {
    clear: ['#050914', '#0A1124', '#121D3A'],
    overcast: ['#07090F', '#0E131F', '#171E2E'],
    celestial: '#EEF1FA',
    glow: 'rgba(190, 205, 255, 0.28)',
    cloud: 'rgba(200, 210, 235, 0.07)',
    rain: 'rgba(170, 200, 255, 0.45)',
    snow: 'rgba(255, 255, 255, 0.85)',
    star: '#FFFFFF',
  },
};

export const PALETTES: Record<ThemeMode, Palette> = { day, night };
