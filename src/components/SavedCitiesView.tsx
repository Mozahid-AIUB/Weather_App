import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../constants';

interface SavedCityData {
  city: string;
  state: string;
  temp: number;
  condition: string;
  high: number;
  low: number;
  icon: string;
  time: string;
  gradient: [string, string];
}

const DEFAULT_CITIES: SavedCityData[] = [
  { city: 'New York', state: 'NY', temp: 68, condition: 'Partly Cloudy', high: 72, low: 58, icon: '🌤️', time: '11:42 AM', gradient: ['#1a365d', '#2d5f8a'] },
  { city: 'Los Angeles', state: 'CA', temp: 78, condition: 'Sunny', high: 84, low: 64, icon: '☀️', time: '8:42 AM', gradient: ['#7c3aed', '#4f46e5'] },
  { city: 'Miami', state: 'FL', temp: 85, condition: 'Scattered Showers', high: 88, low: 76, icon: '🌦️', time: '11:42 AM', gradient: ['#0e7490', '#0891b2'] },
  { city: 'Chicago', state: 'IL', temp: 62, condition: 'Breezy & Clear', high: 66, low: 52, icon: '💨', time: '10:42 AM', gradient: ['#334155', '#475569'] },
  { city: 'Dallas', state: 'TX', temp: 82, condition: 'Clear Sky', high: 86, low: 70, icon: '☀️', time: '10:42 AM', gradient: ['#b45309', '#d97706'] },
  { city: 'Seattle', state: 'WA', temp: 58, condition: 'Light Rain', high: 62, low: 48, icon: '🌧️', time: '8:42 AM', gradient: ['#1e3a5f', '#2d4a7c'] },
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
        <TouchableOpacity style={styles.addBtn} onPress={onOpenSearch} activeOpacity={0.7}>
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
              style={styles.cityCardWrap}
              onPress={() => onSelectCity(c.city)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={c.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cityCard}
              >
                {/* Background accent glow */}
                <View style={styles.cardGlow} />

                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.cityName}>{c.city}</Text>
                    <Text style={styles.stateTime}>{c.state} · {c.time}</Text>
                  </View>
                  <Text style={styles.temp}>{displayTemp}°</Text>
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.conditionRow}>
                    <Text style={styles.conditionIcon}>{c.icon}</Text>
                    <Text style={styles.conditionText}>{c.condition}</Text>
                  </View>
                  <Text style={styles.hiLow}>H:{displayH}° L:{displayL}°</Text>
                </View>
              </LinearGradient>
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
    fontSize: 24,
    color: COLORS.textPrimary,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  addBtnText: {
    color: COLORS.accent,
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  cityCardWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cityCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cityName: {
    fontSize: 22,
    color: '#FFF',
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  stateTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  temp: {
    fontSize: 44,
    color: '#FFF',
    fontFamily: FONTS.light,
    fontWeight: '200',
    letterSpacing: -2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionIcon: {
    fontSize: 16,
  },
  conditionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  hiLow: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});
