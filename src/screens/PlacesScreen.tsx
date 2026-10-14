import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme, useStyles, useTheme } from '../theme/ThemeProvider';
import { samePlace, useWeatherStore } from '../store/weatherStore';
import { useSettingsStore } from '../store/settingsStore';
import { weatherService } from '../services/weatherService';
import { locationService } from '../services/locationService';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PressableScale } from '../components/ui/PressableScale';
import { AnimatedGlyph } from '../components/ui/AnimatedGlyph';
import { WeatherIcon } from '../components/weather/WeatherIcon';
import { TAB_BAR_SPACE } from '../components/TabBar';
import { countryFlag, localeRegion, popularFor } from '../constants';
import { capitalize, formatClock, toTemp } from '../utils/format';
import type { CurrentWeather, Place } from '../types/weather';

interface Props {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onSelect: () => void;
}

const key = (p: Place) => `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`;

const PlaceCard: React.FC<{
  place: Place;
  weather?: CurrentWeather;
  active: boolean;
  index: number;
  onPress: () => void;
  onRemove?: () => void;
  badge?: string;
}> = ({ place, weather, active, index, onPress, onRemove, badge }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const unit = useSettingsStore((s) => s.unit);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(450).springify().damping(18)} exiting={FadeOut.duration(200)} layout={LinearTransition.springify()}>
      <PressableScale onPress={onPress} scaleTo={0.97} style={[styles.card, active && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
        <View style={styles.cardLeft}>
          <View style={styles.nameRow}>
            {badge ? <AnimatedGlyph name="navigation-variant" size={13} color={colors.accent} motion="pulse" /> : null}
            <Text style={styles.name} numberOfLines={1}>
              {place.name}
            </Text>
          </View>
          <Text style={styles.region} numberOfLines={1}>
            {badge || place.region || place.country}
            {weather ? ` · ${formatClock(Math.floor(Date.now() / 1000), weather.timezone)}` : ''}
          </Text>
          <Text style={styles.condition} numberOfLines={1}>
            {weather ? capitalize(weather.weather[0]?.description || '') : 'Loading…'}
          </Text>
        </View>
        <View style={styles.cardRight}>
          {weather ? (
            <>
              <WeatherIcon icon={weather.weather[0]?.icon || '01d'} size={44} animated={index < 6} />
              <Text style={styles.temp}>{toTemp(weather.main.temp, unit)}°</Text>
            </>
          ) : (
            <View style={styles.tempSkeleton} />
          )}
        </View>
        {onRemove ? (
          <PressableScale onPress={onRemove} style={styles.remove} hitSlop={10} accessibilityLabel={`Remove ${place.name}`}>
            <MaterialCommunityIcons name="close" size={14} color={colors.textMuted} />
          </PressableScale>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
};

export const PlacesScreen: React.FC<Props> = ({ onOpenSearch, onOpenNotifications, onSelect }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const places = useWeatherStore((s) => s.places);
  const active = useWeatherStore((s) => s.place);
  const isGps = useWeatherStore((s) => s.isGps);
  const current = useWeatherStore((s) => s.current);
  const loadPlace = useWeatherStore((s) => s.loadPlace);
  const locate = useWeatherStore((s) => s.locate);
  const removePlace = useWeatherStore((s) => s.removePlace);
  const homeCountry = useWeatherStore((s) => s.homeCountry);
  const [weather, setWeather] = useState<Record<string, CurrentWeather>>({});

  // Live conditions for every saved place, fetched in parallel.
  useEffect(() => {
    let alive = true;
    places.forEach((p) => {
      if (weather[key(p)]) return;
      weatherService
        .getCurrent(p.lat, p.lon)
        .then((w) => alive && setWeather((prev) => ({ ...prev, [key(p)]: w })))
        .catch(() => {});
    });
    return () => {
      alive = false;
    };
  }, [places]);

  const select = (p: Place) => {
    loadPlace(p, { save: true });
    onSelect();
  };

  const saved = places.filter((p) => !(isGps && samePlace(p, active)));

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="Places"
        subtitle="Your locations around the world"
        onBellPress={onOpenNotifications}
        right={
          <PressableScale onPress={onOpenSearch} style={styles.add} accessibilityLabel="Add a place">
            <MaterialCommunityIcons name="plus" size={22} color={colors.onAccent} />
          </PressableScale>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isGps && active ? (
          <PlaceCard place={active} weather={current || undefined} active index={0} onPress={onSelect} badge="Current location" />
        ) : (
          <Animated.View entering={FadeInDown.duration(400)}>
            <PressableScale
              onPress={async () => {
                const result = await locate('always');
                if (result === 'ok') onSelect();
                else if (result === 'blocked') locationService.openSettings();
              }}
              style={[styles.card, styles.locateCard]}
              scaleTo={0.97}
            >
              <View style={[styles.locateIcon, { backgroundColor: colors.accentSoft }]}>
                <AnimatedGlyph name="crosshairs-gps" size={22} color={colors.accent} motion="pulse" />
              </View>
              <View style={styles.cardLeft}>
                <Text style={styles.name}>Use current location</Text>
                <Text style={styles.region}>Weather for exactly where you are</Text>
              </View>
            </PressableScale>
          </Animated.View>
        )}

        {saved.length > 0 && <Text style={styles.section}>Saved</Text>}
        {saved.map((p, i) => (
          <PlaceCard
            key={key(p)}
            place={p}
            weather={weather[key(p)]}
            active={!isGps && samePlace(p, active)}
            index={i + 1}
            onPress={() => select(p)}
            onRemove={() => removePlace(p)}
          />
        ))}

        {saved.length === 0 && (
          <Animated.View entering={FadeInDown.delay(150).duration(450)} style={styles.empty}>
            <AnimatedGlyph name="map-marker-plus-outline" size={40} color={colors.accent} motion="float" />
            <Text style={styles.emptyTitle}>Add places you care about</Text>
            <Text style={styles.emptyBody}>Home, work, family abroad. Check them all at a glance.</Text>
            <View style={styles.chips}>
              {popularFor(homeCountry || localeRegion() || 'BD')
                .places.slice(0, 6)
                .map((p) => (
                  <PressableScale key={p.name} onPress={() => select(p)} style={styles.chip} scaleTo={0.94}>
                    <Text style={styles.chipText}>
                      {countryFlag(p.country)} {p.name}
                    </Text>
                  </PressableScale>
                ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = ({ colors, fonts, spacing, radius }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: {
      paddingHorizontal: spacing.xl,
      paddingBottom: TAB_BAR_SPACE + spacing.lg,
    },
    add: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: {
      fontFamily: fonts.semiBold,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      boxShadow: colors.cardShadow,
    },
    locateCard: {
      paddingVertical: spacing.md,
    },
    locateIcon: {
      width: 46,
      height: 46,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardLeft: { flex: 1 },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    name: {
      fontFamily: fonts.semiBold,
      fontSize: 19,
      color: colors.text,
      flexShrink: 1,
    },
    region: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    condition: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    cardRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    temp: {
      fontFamily: fonts.light,
      fontSize: 42,
      color: colors.text,
      letterSpacing: -1.5,
      minWidth: 62,
      textAlign: 'right',
    },
    tempSkeleton: {
      width: 90,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.surfaceSunken,
    },
    remove: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surfaceSunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    empty: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.sm,
    },
    emptyTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 18,
      color: colors.text,
      marginTop: spacing.sm,
    },
    emptyBody: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.text,
    },
  });
