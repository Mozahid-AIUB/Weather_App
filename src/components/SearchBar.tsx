import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { COLORS } from '../constants';
import { weatherService } from '../services/weatherService';
import { useWeatherStore } from '../store/weatherStore';

interface Props {
  onClose?: () => void;
}

export const SearchBar: React.FC<Props> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const fetchWeatherByCity = useWeatherStore((s) => s.fetchWeatherByCity);
  const recentCities = useWeatherStore((s) => s.recentCities);
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const onFocus = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  };

  const searchCities = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const results = await weatherService.searchCities(text);
      setSuggestions(results);
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
    await fetchWeatherByCity(cityName);
    onClose?.();
  };

  const handleSubmit = () => {
    if (query.trim()) selectCity(query.trim());
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.inputRow, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Search city..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={searchCities}
          onFocus={onFocus}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoFocus
        />
        {searching && (
          <ActivityIndicator size="small" color={COLORS.accent} style={{ marginRight: 12 }} />
        )}
        {query.length > 0 && !searching && (
          <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          <FlatList
            data={suggestions}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => selectCity(`${item.name},${item.country}`)}
              >
                <Text style={styles.suggestionCity}>📍 {item.name}</Text>
                <Text style={styles.suggestionCountry}>{item.state ? `${item.state}, ` : ''}{item.country}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Recent Cities */}
      {suggestions.length === 0 && query.length === 0 && recentCities.length > 0 && (
        <View style={styles.recentBox}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          {recentCities.slice(0, 5).map((city, i) => (
            <TouchableOpacity key={i} style={styles.recentItem} onPress={() => selectCity(city)}>
              <Text style={styles.recentCity}>🕐 {city}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontFamily: 'Outfit_400Regular',
  },
  clearBtn: {
    fontSize: 16,
    color: COLORS.textMuted,
    paddingHorizontal: 8,
  },
  suggestionsBox: {
    marginTop: 8,
    backgroundColor: 'rgba(13,27,62,0.98)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    maxHeight: 240,
  },
  suggestionItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionCity: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
  },
  suggestionCountry: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  recentBox: {
    marginTop: 12,
  },
  recentTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  recentItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  recentCity: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
});
