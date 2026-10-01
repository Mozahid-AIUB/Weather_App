import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  Keyboard,
  FlatList,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { COLORS, FONTS } from '../constants';
import { weatherService } from '../services/weatherService';
import { useWeatherStore } from '../store/weatherStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onRequestGps?: () => void;
  isLocating?: boolean;
}

const GLOBAL_POPULAR = [
  'Dhaka',
  'Tokyo',
  'London',
  'New York',
  'Dubai',
  'Paris',
  'Singapore',
  'Sydney',
];

export const SearchModal: React.FC<Props> = ({
  visible,
  onClose,
  onRequestGps,
  isLocating = false,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const fetchWeatherByCity = useWeatherStore((s) => s.fetchWeatherByCity);
  const recentCities = useWeatherStore((s) => s.recentCities);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setQuery('');
      setSuggestions([]);
    }
  }, [visible]);

  const searchCities = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const results = await weatherService.searchCities(text.trim());
      setSuggestions(results || []);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const selectCity = async (cityName: string) => {
    setQuery(cityName);
    setSuggestions([]);
    Keyboard.dismiss();
    onClose();
    await fetchWeatherByCity(cityName);
  };

  const handleUseGps = () => {
    Keyboard.dismiss();
    onClose();
    onRequestGps?.();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeContainer}>
          <View style={styles.container}>
            {/* Header bar */}
            <View style={styles.topBar}>
              <View style={styles.titleWrap}>
                <Text style={styles.headerTitle}>Search Location</Text>
                <Text style={styles.headerSubtitle}>Explore live weather for any city worldwide</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Input Row */}
            <View style={styles.inputRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Search any city, country (e.g. Dhaka, London)..."
                placeholderTextColor={COLORS.textMuted}
                value={query}
                onChangeText={searchCities}
                returnKeyType="search"
                onSubmitEditing={() => query.trim() && selectCity(query.trim())}
                autoCorrect={false}
              />
              {searching && (
                <ActivityIndicator size="small" color={COLORS.accent} style={{ marginRight: 8 }} />
              )}
              {query.length > 0 && !searching && (
                <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }}>
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Current GPS Quick Button */}
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleUseGps}
              activeOpacity={0.8}
            >
              <View style={styles.gpsIconCircle}>
                <Text style={styles.gpsIcon}>📍</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.gpsTitle}>Use Current Location (GPS)</Text>
                <Text style={styles.gpsSubtitle}>Auto-detect live weather at your physical location</Text>
              </View>
              {isLocating && <ActivityIndicator size="small" color={COLORS.cyan} />}
            </TouchableOpacity>

            {/* Suggestions list */}
            {suggestions.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionLabel}>GLOBAL SEARCH RESULTS ({suggestions.length})</Text>
                <FlatList
                  data={suggestions}
                  keyExtractor={(_, i) => i.toString()}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => selectCity(item.country ? `${item.name}, ${item.country}` : item.name)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.suggestionLeft}>
                        <Text style={styles.suggestionPin}>🌍</Text>
                        <View>
                          <Text style={styles.suggestionCity}>{item.name}</Text>
                          <Text style={styles.suggestionDetails}>
                            {[item.state, item.country].filter(Boolean).join(', ')}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.selectArrow}>›</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* Recent Searches & Global Hubs when not searching */}
            {suggestions.length === 0 && (
              <FlatList
                data={[]}
                renderItem={null}
                ListHeaderComponent={
                  <>
                    {/* Recent Cities */}
                    {recentCities.length > 0 && (
                      <View style={styles.sectionWrap}>
                        <Text style={styles.sectionLabel}>RECENT SEARCHES</Text>
                        <View style={styles.chipGrid}>
                          {recentCities.slice(0, 8).map((city, idx) => (
                            <TouchableOpacity
                              key={idx}
                              style={styles.historyChip}
                              onPress={() => selectCity(city)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.historyIcon}>🕒</Text>
                              <Text style={styles.historyText} numberOfLines={1}>
                                {city}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Global Popular Hubs */}
                    <View style={styles.sectionWrap}>
                      <Text style={styles.sectionLabel}>GLOBAL POPULAR CITIES</Text>
                      <View style={styles.chipGrid}>
                        {GLOBAL_POPULAR.map((city) => (
                          <TouchableOpacity
                            key={city}
                            style={styles.popularChip}
                            onPress={() => selectCity(city)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.popularText}>{city}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </>
                }
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export const SearchBar = SearchModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.94)',
  },
  safeContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 17,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
  },
  clearBtn: {
    fontSize: 15,
    color: COLORS.textMuted,
    padding: 6,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.30)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  gpsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsIcon: {
    fontSize: 18,
  },
  gpsTitle: {
    color: COLORS.accent,
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  gpsSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionPin: {
    fontSize: 18,
    marginRight: 12,
  },
  suggestionCity: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  suggestionDetails: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  selectArrow: {
    fontFamily: FONTS.light,
    fontSize: 22,
    color: COLORS.accent,
    marginLeft: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  historyIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  historyText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textPrimary,
    maxWidth: 140,
  },
  popularChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.20)',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  popularText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.sky,
  },
});
