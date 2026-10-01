import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants';

interface SavedCityData {
  city: string;
  state: string;
  temp: number;
  condition: string;
  high: number;
  low: number;
  icon: string;
  time: string;
}

const DEFAULT_CITIES: SavedCityData[] = [
  { city: 'New York', state: 'NY', temp: 68, condition: 'Partly Cloudy', high: 72, low: 58, icon: '🌤️', time: '11:42 AM' },
  { city: 'Los Angeles', state: 'CA', temp: 78, condition: 'Sunny', high: 84, low: 64, icon: '☀️', time: '8:42 AM' },
  { city: 'Miami', state: 'FL', temp: 85, condition: 'Scattered Showers', high: 88, low: 76, icon: '🌦️', time: '11:42 AM' },
  { city: 'Chicago', state: 'IL', temp: 62, condition: 'Breezy & Clear', high: 66, low: 52, icon: '💨', time: '10:42 AM' },
  { city: 'Dallas', state: 'TX', temp: 82, condition: 'Clear Sky', high: 86, low: 70, icon: '☀️', time: '10:42 AM' },
  { city: 'Seattle', state: 'WA', temp: 58, condition: 'Light Rain', high: 62, low: 48, icon: '🌧️', time: '8:42 AM' },
];

interface Props {
  unit: 'metric' | 'imperial';
  onSelectCity: (city: string) => void;
  onOpenSearch: () => void;
}

export const SavedCitiesView: React.FC<Props> = ({ unit, onSelectCity, onOpenSearch }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Favorite Locations</Text>
          <Text style={styles.subtitle}>Manage & track US Metros</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onOpenSearch}>
          <Text style={styles.addBtnText}>+ Add City</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {DEFAULT_CITIES.map((c, idx) => {
          const displayTemp = unit === 'imperial' ? c.temp : Math.round(((c.temp - 32) * 5) / 9);
          const displayH = unit === 'imperial' ? c.high : Math.round(((c.high - 32) * 5) / 9);
          const displayL = unit === 'imperial' ? c.low : Math.round(((c.low - 32) * 5) / 9);

          return (
            <TouchableOpacity
              key={idx}
              style={styles.cityCard}
              onPress={() => onSelectCity(c.city)}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cityName}>{c.city}</Text>
                <Text style={styles.stateTime}>{c.state} · {c.time}</Text>
                <Text style={styles.conditionText}>{c.condition}</Text>
              </View>

              <View style={styles.cardRight}>
                <Text style={styles.icon}>{c.icon}</Text>
                <Text style={styles.temp}>{displayTemp}°</Text>
                <Text style={styles.hiLow}>H:{displayH}° L:{displayL}°</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  addBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  cityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardLeft: {
    justifyContent: 'space-between',
  },
  cityName: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  stateTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginVertical: 4,
  },
  conditionText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  icon: {
    fontSize: 24,
  },
  temp: {
    fontSize: 32,
    color: COLORS.textPrimary,
    fontWeight: '300',
  },
  hiLow: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
