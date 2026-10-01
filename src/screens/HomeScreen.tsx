import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  FlatList,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeatherStore } from '../store/weatherStore';
import { useLocation } from '../hooks/useLocation';
import { ForecastCard } from '../components/ForecastCard';
import { HourlyForecastCard } from '../components/HourlyForecastCard';
import { StatCard } from '../components/StatCard';
import { UvAirQualityCard } from '../components/UvAirQualityCard';
import { AnimatedWeatherBackground } from '../components/AnimatedWeatherBackground';
import { BottomTabBar, TabKey } from '../components/BottomTabBar';
import { RadarView } from '../components/RadarView';
import { SavedCitiesView } from '../components/SavedCitiesView';
import { InsightsView } from '../components/InsightsView';
import { SettingsView } from '../components/SettingsView';
import { AiPushControlModal } from '../components/AiPushControlModal';
import { SearchBar } from '../components/SearchBar';
import { COLORS, WEATHER_ICONS } from '../constants';

const { width } = Dimensions.get('window');

// Curated US Top Metro Cities
const US_POPULAR_CITIES = ['New York', 'Los Angeles', 'Miami', 'Chicago', 'Dallas', 'San Francisco', 'Seattle', 'Las Vegas'];

const getWeatherConditionType = (iconCode: string): string => {
  if (!iconCode) return 'night';
  if (iconCode.includes('01')) return iconCode.endsWith('n') ? 'night' : 'sunny';
  if (iconCode.includes('13')) return 'snowy';
  if (iconCode.includes('11')) return 'stormy';
  if (['09', '10'].some((c) => iconCode.includes(c))) return 'rainy';
  if (['03', '04', '50'].some((c) => iconCode.includes(c))) return 'cloudy';
  return iconCode.endsWith('n') ? 'night' : 'sunny';
};

const getGradientForWeather = (conditionType: string): string[] => {
  switch (conditionType) {
    case 'sunny':
      return ['#0F2B48', '#1A4870', '#0284C7'];
    case 'night':
      return ['#030712', '#0A1128', '#111E38'];
    case 'rainy':
      return ['#081224', '#0F213A', '#1E3A5F'];
    case 'stormy':
      return ['#09090B', '#18181B', '#27272A'];
    case 'snowy':
      return ['#0C192E', '#1E293B', '#334155'];
    case 'cloudy':
    default:
      return ['#0B132B', '#16223B', '#24344E'];
  }
};

const formatTime = (unix: number) => {
  if (!unix) return '--:--';
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('weather');
  const [searchVisible, setSearchVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [selectedCityChip, setSelectedCityChip] = useState('New York');
  const { location, requestLocation } = useLocation();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const {
    currentWeather,
    dailyForecast,
    hourlyForecast,
    isLoading,
    isRefreshing,
    unit,
    fetchWeatherByCity,
    fetchWeatherByCoords,
    refreshWeather,
    loadSearchHistory,
    toggleUnit,
  } = useWeatherStore();

  useEffect(() => {
    loadSearchHistory();
    // Default initial fetch for US market
    fetchWeatherByCity('New York');
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeatherByCoords(location.lat, location.lon);
    }
  }, [location]);

  const onRefresh = useCallback(() => {
    refreshWeather();
  }, [refreshWeather]);

  const handleCitySelect = (city: string) => {
    setSelectedCityChip(city);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 150, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
    ]).start();
    fetchWeatherByCity(city);
    setActiveTab('weather');
  };

  const iconCode = currentWeather?.weather[0]?.icon || '01d';
  const conditionType = getWeatherConditionType(iconCode);
  const gradient = getGradientForWeather(conditionType) as [string, string, ...string[]];

  const displayTemp = (celsius: number) => {
    if (celsius === undefined || celsius === null) return '--';
    return unit === 'imperial'
      ? Math.round((celsius * 9) / 5 + 32)
      : Math.round(celsius);
  };

  const getWindSpeed = (speedMs: number = 0) => {
    return unit === 'imperial'
      ? `${Math.round(speedMs * 2.237)} mph`
      : `${Math.round(speedMs)} m/s`;
  };

  const getVisibility = (visMeters: number = 10000) => {
    return unit === 'imperial'
      ? `${(visMeters / 1609.34).toFixed(1)} mi`
      : `${(visMeters / 1000).toFixed(1)} km`;
  };

  const getPressure = (pressureHpa: number = 1013) => {
    return unit === 'imperial'
      ? `${(pressureHpa * 0.02953).toFixed(2)} inHg`
      : `${pressureHpa} hPa`;
  };

  const getWindDirection = (deg: number = 0) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  // Find min and max for week temperature range calculation
  const minWeek = dailyForecast.length > 0
    ? Math.min(...dailyForecast.map((d) => unit === 'imperial' ? Math.round((d.low * 9) / 5 + 32) : d.low))
    : 50;
  const maxWeek = dailyForecast.length > 0
    ? Math.max(...dailyForecast.map((d) => unit === 'imperial' ? Math.round((d.high * 9) / 5 + 32) : d.high))
    : 85;

  return (
    <LinearGradient
      colors={gradient}
      style={styles.root}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* High-End Animated Weather Particle Layer */}
      <AnimatedWeatherBackground condition={conditionType} />

      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea}>

        {/* Ultra-Sleek App Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>WeatherNow</Text>
            {currentWeather && (
              <Text style={styles.locationLabel}>
                📍 {currentWeather.name}, {currentWeather.sys.country}
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.unitBtn}
              onPress={toggleUnit}
              activeOpacity={0.7}
            >
              <Text style={styles.unitText}>{unit === 'imperial' ? '°F' : '°C'}</Text>
            </TouchableOpacity>

            {/* In-App Notification Bell Button */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setNotificationVisible(true)}
              accessibilityLabel="In-App Weather Alerts"
            >
              <Text style={styles.iconBtnText}>🔔</Text>
              {hasUnread && <View style={styles.notificationDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => requestLocation()}
              accessibilityLabel="Use my GPS location"
            >
              <Text style={styles.iconBtnText}>📍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setSearchVisible(true)}
              accessibilityLabel="Search city"
            >
              <Text style={styles.iconBtnText}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Router Switcher */}
        {activeTab === 'radar' ? (
          <RadarView
            cityName={currentWeather?.name || 'New York'}
            temp={currentWeather?.main.temp || 20}
            condition={conditionType}
            unit={unit}
          />
        ) : activeTab === 'cities' ? (
          <SavedCitiesView
            unit={unit}
            onSelectCity={handleCitySelect}
            onOpenSearch={() => setSearchVisible(true)}
          />
        ) : activeTab === 'insights' ? (
          <InsightsView
            cityName={currentWeather?.name || 'New York'}
            unit={unit}
          />
        ) : activeTab === 'settings' ? (
          <SettingsView
            unit={unit}
            onToggleUnit={toggleUnit}
          />
        ) : (
          /* Main Weather View */
          <>
            {/* US Metro Quick City Filter */}
            <View style={styles.chipsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                {US_POPULAR_CITIES.map((city) => {
                  const isActive = currentWeather?.name.toLowerCase().includes(city.toLowerCase());
                  return (
                    <TouchableOpacity
                      key={city}
                      style={[styles.cityChip, isActive && styles.cityChipActive]}
                      onPress={() => handleCitySelect(city)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.cityChipText, isActive && styles.cityChipTextActive]}>
                        {city}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Main Content Area */}
            {isLoading && !currentWeather ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Fetching real-time weather...</Text>
              </View>
            ) : currentWeather ? (
              <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefreshing}
                      onRefresh={onRefresh}
                      tintColor={COLORS.accent}
                      colors={[COLORS.accent]}
                    />
                  }
                >
                  {/* Hero Weather Section */}
                  <View style={styles.heroSection}>
                    <Text style={styles.weatherIcon}>
                      {WEATHER_ICONS[iconCode] || '🌤️'}
                    </Text>
                    <View style={styles.tempRow}>
                      <Text style={styles.temperature}>
                        {displayTemp(currentWeather.main.temp)}
                      </Text>
                      <Text style={styles.tempDegree}>°</Text>
                    </View>

                    <Text style={styles.weatherCondition}>
                      {currentWeather.weather[0]?.description
                        ? currentWeather.weather[0].description
                            .split(' ')
                            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ')
                        : 'Clear'}
                    </Text>

                    <View style={styles.heroBadgeRow}>
                      <View style={styles.heroConditionPill}>
                        <Text style={styles.heroConditionPillText}>
                          Feels like {displayTemp(currentWeather.main.feels_like)}°
                        </Text>
                      </View>
                      <View style={styles.heroConditionPill}>
                        <Text style={styles.heroConditionPillText}>
                          H: {displayTemp(currentWeather.main.temp_max)}°  ·  L: {displayTemp(currentWeather.main.temp_min)}°
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 24-Hour Forecast Timeline */}
                  {hourlyForecast.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>🕒</Text>
                        <Text style={styles.cardSectionTitle}>HOURLY FORECAST</Text>
                      </View>
                      <FlatList
                        data={hourlyForecast}
                        horizontal
                        keyExtractor={(_, i) => i.toString()}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                          <HourlyForecastCard item={item} isFirst={index === 0} unit={unit} />
                        )}
                        contentContainerStyle={{ paddingVertical: 4, paddingHorizontal: 2 }}
                      />
                    </View>
                  )}

                  {/* UV Index & Air Quality Section */}
                  <View style={styles.sectionMargin}>
                    <UvAirQualityCard
                      uvIndex={Math.round(currentWeather.main.temp > 25 ? 7 : 4)}
                      humidity={currentWeather.main.humidity}
                      dewPoint={currentWeather.main.temp - (100 - currentWeather.main.humidity) / 5}
                      unit={unit}
                    />
                  </View>

                  {/* 7-Day Apple Weather Style Forecast Card */}
                  {dailyForecast.length > 0 && (
                    <View style={styles.cardEncapsulated}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>📅</Text>
                        <Text style={styles.cardSectionTitle}>7-DAY FORECAST</Text>
                      </View>
                      <View style={styles.forecastList}>
                        {dailyForecast.map((item, index) => (
                          <ForecastCard
                            key={index}
                            item={item}
                            isToday={index === 0}
                            minTempWeek={minWeek}
                            maxTempWeek={maxWeek}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {/* 2x2 Weather Details Grid */}
                  <View style={styles.sectionMargin}>
                    <View style={styles.statsGrid}>
                      <StatCard
                        icon="💧"
                        label="Humidity"
                        value={`${currentWeather.main.humidity}%`}
                        subtext={`The dew point is ${displayTemp(currentWeather.main.temp - 6)}°`}
                      />
                      <StatCard
                        icon="💨"
                        label="Wind"
                        value={getWindSpeed(currentWeather.wind.speed)}
                        unit={getWindDirection(currentWeather.wind.deg)}
                        subtext="Gentle breeze today"
                      />
                      <StatCard
                        icon="👁️"
                        label="Visibility"
                        value={getVisibility(currentWeather.visibility)}
                        subtext="Clear view of horizon"
                      />
                      <StatCard
                        icon="🌡️"
                        label="Pressure"
                        value={getPressure(currentWeather.main.pressure)}
                        subtext="Barometer is steady"
                      />
                    </View>
                  </View>

                  {/* Solar Schedule Card */}
                  <View style={styles.cardEncapsulated}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardIcon}>☀️</Text>
                      <Text style={styles.cardSectionTitle}>SOLAR CYCLE</Text>
                    </View>
                    <View style={styles.sunRow}>
                      <View style={styles.sunCard}>
                        <Text style={styles.sunIcon}>🌅</Text>
                        <Text style={styles.sunLabel}>Sunrise</Text>
                        <Text style={styles.sunTime}>{formatTime(currentWeather.sys.sunrise)}</Text>
                      </View>
                      <View style={styles.sunDivider} />
                      <View style={styles.sunCard}>
                        <Text style={styles.sunIcon}>🌇</Text>
                        <Text style={styles.sunLabel}>Sunset</Text>
                        <Text style={styles.sunTime}>{formatTime(currentWeather.sys.sunset)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ height: 110 }} />
                </ScrollView>
              </Animated.View>
            ) : null}
          </>
        )}

        {/* Floating Glassmorphic Bottom Tab Bar */}
        <BottomTabBar activeTab={activeTab} onSelectTab={setActiveTab} />
      </SafeAreaView>

      {/* AI Push Notification Control Center */}
      <AiPushControlModal
        visible={notificationVisible}
        onClose={() => {
          setNotificationVisible(false);
          setHasUnread(false);
        }}
        cityName={currentWeather?.name || 'New York'}
        temp={currentWeather?.main.temp || 20}
        condition={currentWeather?.weather[0]?.description || 'Clear sky'}
        humidity={currentWeather?.main.humidity || 55}
        windSpeed={currentWeather?.wind.speed || 4}
      />

      {/* Search Modal */}
      <Modal
        visible={searchVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSearchVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSearchVisible(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Search Any City</Text>
          <SearchBar onClose={() => setSearchVisible(false)} />
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  appName: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  locationLabel: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  unitText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#0A0F1D',
  },
  iconBtnText: {
    fontSize: 16,
  },
  chipsContainer: {
    marginBottom: 8,
  },
  chipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  cityChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  cityChipText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  weatherIcon: {
    fontSize: 82,
    marginBottom: 2,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  temperature: {
    fontSize: 96,
    fontWeight: '200',
    color: '#FFF',
    lineHeight: 100,
    letterSpacing: -2,
  },
  tempDegree: {
    fontSize: 38,
    fontWeight: '300',
    color: COLORS.accent,
    marginTop: 8,
  },
  weatherCondition: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  heroConditionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  heroConditionPillText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionMargin: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  cardEncapsulated: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 14,
  },
  cardSectionTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  forecastList: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -5,
  },
  sunRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  sunCard: {
    flex: 1,
    alignItems: 'center',
  },
  sunDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  sunIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  sunLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sunTime: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    minHeight: 300,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginTop: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalSheet: {
    backgroundColor: '#0A0F1D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    minHeight: 450,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '700',
    marginBottom: 16,
  },
});
