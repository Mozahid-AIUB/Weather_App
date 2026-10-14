import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Theme, useStyles } from '../theme/ThemeProvider';
import { useWeatherStore } from '../store/weatherStore';
import { useSettingsStore } from '../store/settingsStore';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { WeatherRadarMap } from '../components/WeatherRadarMap';
import { TAB_BAR_SPACE } from '../components/TabBar';
import { defaultPlace } from '../constants';

interface Props {
  onOpenNotifications: () => void;
}

/** Live RainViewer precipitation radar centred on the current place. */
export const RadarScreen: React.FC<Props> = ({ onOpenNotifications }) => {
  const styles = useStyles(makeStyles);
  const place = useWeatherStore((s) => s.place) || defaultPlace();
  const current = useWeatherStore((s) => s.current);
  const forecast = useWeatherStore((s) => s.forecast);
  const unit = useSettingsStore((s) => s.unit);

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Radar" subtitle={`Live weather maps around ${place.name}`} onBellPress={onOpenNotifications} />
      <Animated.View entering={FadeInDown.duration(500).springify().damping(18)} style={styles.mapCard}>
        <WeatherRadarMap
          cityName={place.name}
          lat={place.lat}
          lon={place.lon}
          temp={current?.main.temp}
          condition={current?.weather[0]?.main}
          unit={unit}
          rainChance={Math.round((forecast[0]?.pop ?? 0) * 100)}
        />
      </Animated.View>
    </View>
  );
};

const makeStyles = ({ colors, spacing, radius }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    mapCard: {
      flex: 1,
      marginHorizontal: spacing.xl,
      marginBottom: TAB_BAR_SPACE,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      boxShadow: colors.cardShadow,
    },
  });
