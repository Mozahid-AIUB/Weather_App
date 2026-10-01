// ============================================
// WEATHER API CONSTANTS
// ============================================
export const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';
export const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// ============================================
// BACKEND API (Your VPS with PostgreSQL)
// ============================================
export const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://YOUR_VPS_IP:3001/api';

// ============================================
// PREMIUM FONT FAMILY SYSTEM
// ============================================
export const FONTS = {
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  extraBold: 'Outfit_800ExtraBold',
};

// ============================================
// PREMIUM DESIGN TOKENS
// ============================================
export const COLORS = {
  // Ultra-Luxury Dark Palette
  bgDark: '#030712',
  bgMid: '#0B132B',
  bgLight: '#1C2541',

  // Radiant Accents
  accent: '#38BDF8',
  accentGlow: '#0EA5E9',
  cyan: '#22D3EE',
  indigo: '#6366F1',
  purple: '#A855F7',
  amber: '#F59E0B',
  emerald: '#10B981',
  rose: '#F43F5E',
  teal: '#14B8A6',
  sky: '#7DD3FC',
  violet: '#8B5CF6',
  fuchsia: '#D946EF',
  lime: '#84CC16',
  orange: '#F97316',

  // Luxury Glassmorphic Surfaces
  cardBg: 'rgba(255, 255, 255, 0.05)',
  cardBgHover: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.10)',
  cardBorderLight: 'rgba(255, 255, 255, 0.18)',
  cardGlass: 'rgba(56, 189, 248, 0.08)',
  cardGlassDark: 'rgba(15, 23, 42, 0.75)',
  glassHighlight: 'rgba(255, 255, 255, 0.12)',
  glassFrost: 'rgba(255, 255, 255, 0.03)',

  // High-End Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textSubtle: 'rgba(255, 255, 255, 0.35)',

  // Atmospheric Cosmic Gradients
  sunny: ['#0C1E3C', '#1E3A8A', '#0284C7'],
  sunnyDay: ['#0369A1', '#0284C7', '#38BDF8'],
  cloudy: ['#0B132B', '#1E293B', '#334155'],
  rainy: ['#080E24', '#0F172A', '#1E3A5F'],
  stormy: ['#09090B', '#18181B', '#27272A'],
  snowy: ['#0C192E', '#1E293B', '#475569'],
  night: ['#030712', '#0A0F1D', '#0F172A'],

  // Status
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
};

// ============================================
// WEATHER CONDITION MAPPINGS
// ============================================
export const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️',
  '01n': '🌙',
  '02d': '⛅',
  '02n': '🌤️',
  '03d': '☁️',
  '03n': '☁️',
  '04d': '☁️',
  '04n': '☁️',
  '09d': '🌧️',
  '09n': '🌧️',
  '10d': '🌦️',
  '10n': '🌧️',
  '11d': '⛈️',
  '11n': '⛈️',
  '13d': '❄️',
  '13n': '❄️',
  '50d': '🌫️',
  '50n': '🌫️',
};

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
