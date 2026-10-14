import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme, useStyles, useTheme } from '../theme/ThemeProvider';
import { Sheet } from './ui/Sheet';
import { PressableScale } from './ui/PressableScale';
import { AnimatedGlyph, GlyphName, Motion } from './ui/AnimatedGlyph';
import { weatherService } from '../services/weatherService';
import { locationService } from '../services/locationService';
import { useWeatherStore } from '../store/weatherStore';
import { countryFlag, localeRegion, popularFor, POPULAR_WORLD } from '../constants';
import type { Place } from '../types/weather';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after a place (or GPS) was chosen. */
  onPicked?: () => void;
}

const placeKey = (p: Place) => `${p.name.toLowerCase()}|${p.country.toUpperCase()}`;

const PlaceIcon: React.FC<{ country: string; color: string; style: object; flagStyle: object }> = ({ country, color, style, flagStyle }) => {
  const flag = countryFlag(country);
  return <View style={style}>{flag ? <Text style={flagStyle}>{flag}</Text> : <MaterialCommunityIcons name="map-marker-outline" size={20} color={color} />}</View>;
};

const ChipRow: React.FC<{
  title: string;
  icon: GlyphName;
  motion: Motion;
  tint: string;
  places: Place[];
  onPick: (p: Place) => void;
  delay: number;
}> = ({ title, icon, motion, tint, places, onPick, delay }) => {
  const styles = useStyles(makeStyles);
  if (!places.length) return null;
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(360)}>
      <View style={styles.sectionRow}>
        <AnimatedGlyph name={icon} size={14} color={tint} motion={motion} />
        <Text style={styles.section}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.chipScroll} contentContainerStyle={styles.chips}>
        {places.map((p) => (
          <PressableScale key={placeKey(p)} onPress={() => onPick(p)} style={styles.chip} scaleTo={0.94} accessibilityLabel={p.name}>
            {countryFlag(p.country) ? <Text style={styles.flag}>{countryFlag(p.country)}</Text> : null}
            <Text style={styles.chipText}>{p.name}</Text>
          </PressableScale>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

export const SearchSheet: React.FC<Props> = ({ visible, onClose, onPicked }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateIssue, setLocateIssue] = useState<'denied' | 'blocked' | 'error' | null>(null);
  const loadPlace = useWeatherStore((s) => s.loadPlace);
  const locate = useWeatherStore((s) => s.locate);
  const places = useWeatherStore((s) => s.places);
  const homeCountry = useWeatherStore((s) => s.homeCountry);
  const home = homeCountry || localeRegion() || 'BD';
  const inputRef = useRef<TextInput>(null);
  const latest = useRef('');

  useEffect(() => {
    if (visible) {
      setLocateIssue(null);
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
    setQuery('');
    setResults([]);
  }, [visible]);

  // Debounced search; only the latest query may update the results.
  useEffect(() => {
    const q = query.trim();
    latest.current = q;
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const found = await weatherService.searchPlaces(q);
      if (latest.current === q) {
        setResults(found);
        setSearching(false);
      }
    }, 320);
    return () => clearTimeout(t);
  }, [query]);

  // Suggestions, most relevant first and never repeated across sections:
  // your own most-picked places (stored only on this device) → popular near you → around the world.
  // Other people's searches are never shown.
  const sections = useMemo(() => {
    const seen = new Set<string>();
    const take = (list: Place[], max: number) =>
      list
        .filter((p) => {
          const k = placeKey(p);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .slice(0, max);

    const mine = take([...places].sort((a, b) => (b.count ?? 0) - (a.count ?? 0) || (b.lastUsed ?? 0) - (a.lastUsed ?? 0)), 3);
    const local = popularFor(home);
    const near = take(local.places, 8);
    const world = local.places === POPULAR_WORLD ? [] : take(POPULAR_WORLD, 8);
    return { mine, nearLabel: local.label, near, world };
  }, [places, home]);

  const choose = (place: Place) => {
    Keyboard.dismiss();
    onClose();
    onPicked?.();
    loadPlace(place, { save: true });
  };

  const useGps = async () => {
    if (locateIssue === 'blocked') {
      locationService.openSettings();
      return;
    }
    setLocating(true);
    const result = await locate('always');
    setLocating(false);
    if (result === 'ok') {
      onClose();
      onPicked?.();
    } else setLocateIssue(result);
  };

  const showResults = query.trim().length >= 2;

  return (
    <Sheet visible={visible} onClose={onClose} title="Search" subtitle="Cities, towns, upazilas and villages worldwide" fullHeight>
      <View style={styles.inputRow}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Try Mirpur, Brooklyn or Montmartre"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          onSubmitEditing={() => results[0] && choose(results[0])}
        />
        {searching ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : query ? (
          <PressableScale onPress={() => setQuery('')} accessibilityLabel="Clear search">
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
          </PressableScale>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <PressableScale onPress={useGps} style={styles.gpsRow} scaleTo={0.98}>
          <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
            {locating ? <ActivityIndicator size="small" color={colors.accent} /> : <AnimatedGlyph name="crosshairs-gps" size={20} color={colors.accent} motion="pulse" />}
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Use my current location</Text>
            <Text style={[styles.rowSub, locateIssue && { color: colors.warning }]}>
              {locateIssue === 'blocked'
                ? 'Location is off for WeatherNow. Tap to open Settings.'
                : locateIssue === 'denied'
                  ? 'Location permission was not allowed. Tap to try again.'
                  : locateIssue === 'error'
                    ? "Couldn't get your location. Is GPS turned on?"
                    : 'Precise to your neighbourhood or village'}
            </Text>
          </View>
        </PressableScale>

        {showResults ? (
          <>
            {!searching && results.length === 0 && (
              <Animated.View entering={FadeIn} style={styles.noResults}>
                <AnimatedGlyph name="map-search-outline" size={30} color={colors.textMuted} motion="float" />
                <Text style={styles.noResultsText}>No places found for “{query.trim()}”</Text>
              </Animated.View>
            )}
            {results.map((p, i) => (
              <Animated.View key={`${p.lat},${p.lon}`} entering={FadeInDown.delay(i * 40).duration(300)}>
                <PressableScale onPress={() => choose(p)} style={styles.row} scaleTo={0.98}>
                  <PlaceIcon country={p.country} color={colors.textSecondary} style={styles.rowIcon} flagStyle={styles.rowFlag} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{p.name}</Text>
                    {p.region ? <Text style={styles.rowSub}>{p.region}</Text> : null}
                  </View>
                  <MaterialCommunityIcons name="arrow-top-left" size={18} color={colors.textMuted} />
                </PressableScale>
              </Animated.View>
            ))}
          </>
        ) : (
          <>
            {sections.mine.length > 0 && (
              <Animated.View entering={FadeInDown.duration(360)}>
                <View style={styles.sectionRow}>
                  <AnimatedGlyph name="history" size={14} color={colors.textMuted} motion="spin" />
                  <Text style={styles.section}>Your top searches</Text>
                </View>
                {sections.mine.map((p, i) => (
                  <PressableScale key={placeKey(p)} onPress={() => choose(p)} style={[styles.row, i === sections.mine.length - 1 && styles.rowLast]} scaleTo={0.98}>
                    <PlaceIcon country={p.country} color={colors.textSecondary} style={styles.rowIcon} flagStyle={styles.rowFlag} />
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{p.name}</Text>
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {[p.region, (p.count ?? 0) > 1 ? `${p.count} searches` : null].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
                  </PressableScale>
                ))}
              </Animated.View>
            )}

            <ChipRow title={sections.nearLabel} icon="star-outline" motion="pulse" tint={colors.icon.sun} places={sections.near} onPick={choose} delay={120} />
            <ChipRow title="Around the world" icon="earth" motion="spin" tint={colors.info} places={sections.world} onPick={choose} delay={180} />
          </>
        )}
      </ScrollView>
    </Sheet>
  );
};

const makeStyles = ({ colors, fonts, radius, spacing }: Theme) =>
  StyleSheet.create({
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.xl,
      paddingHorizontal: spacing.md,
      height: 50,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSunken,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 16,
      color: colors.text,
      height: '100%',
      outlineStyle: 'none',
    } as any,
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
    },
    gpsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.surfaceSunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowFlag: {
      fontSize: 20,
    },
    rowText: { flex: 1 },
    rowTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 15.5,
      color: colors.text,
    },
    rowSub: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 1,
    },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    section: {
      fontFamily: fonts.semiBold,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    chipScroll: {
      marginHorizontal: -spacing.xl,
    },
    chips: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    flag: {
      fontSize: 15,
    },
    chipText: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.text,
    },
    noResults: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
    },
    noResultsText: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
    },
  });
