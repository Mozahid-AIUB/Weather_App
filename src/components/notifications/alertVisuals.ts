import type { AlertKind } from '../../store/settingsStore';
import type { Severity } from '../../services/alertEngine';
import type { Palette } from '../../theme/tokens';
import type { GlyphName, Motion } from '../ui/AnimatedGlyph';

export const ALERT_ICON: Record<AlertKind, { icon: GlyphName; motion: Motion }> = {
  storm: { icon: 'weather-lightning-rainy', motion: 'pulse' },
  rain: { icon: 'umbrella-outline', motion: 'swing' },
  snow: { icon: 'snowflake', motion: 'spin' },
  heat: { icon: 'thermometer-high', motion: 'pulse' },
  cold: { icon: 'snowflake-thermometer', motion: 'float' },
  wind: { icon: 'weather-windy', motion: 'sway' },
  visibility: { icon: 'weather-fog', motion: 'sway' },
  change: { icon: 'weather-partly-cloudy', motion: 'float' },
  brief: { icon: 'white-balance-sunny', motion: 'spin' },
};

export const severityColor = (severity: Severity, kind: AlertKind, colors: Palette) => {
  if (kind === 'brief') return colors.icon.sun;
  if (severity === 'severe') return colors.danger;
  if (severity === 'warning') return colors.warning;
  return colors.accent;
};
