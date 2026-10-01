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
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { WindCompassCard } from '../components/WindCompassCard';
import { SunArcCard } from '../components/SunArcCard';
import { PrecipitationChart } from '../components/PrecipitationChart';
import { FeelsLikeGauge } from '../components/FeelsLikeGauge';
import { COLORS, FONTS, WEATHER_ICONS } from '../constants';

const { width, height: screenH } = Dimensions.get('window');

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
      return ['#0C1833', '#143566', '#0B6DB5'];
    case 'night':
      return ['#020617', '#070E1F', '#0C1629'];
    case 'rainy':
      return ['#060C1C', '#0D1830', '#162D52'];
    case 'stormy':
      return ['#07070A', '#111115', '#1A1A20'];
    case 'snowy':
      return ['#0A1424', '#172033', '#293D56'];
    case 'cloudy':
    default:
      return ['#0A0F22', '#131D33', '#1D2D48'];
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
  const [selectedCityChip, setSelectedCityChip] = useState('My Location');
  const [isCurrentGps, setIsCurrentGps] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const { location, requestLocation } = useLocation();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Premium entrance animations
  const heroScale = useRef(new Animated.Value(0.9)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const chipsSlide = useRef(new Animated.Value(30)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;

  const {
    currentWeather,
    dailyForecast,
    hourlyForecast,
    isLoading,
    isRefreshing,
    unit,
    recentCities,
    fetchWeatherByCity,
    fetchWeatherByCoords,
    refreshWeather,
    loadSearchHistory,
    toggleUnit,
  } = useWeatherStore();

  const handleRequestGps = async () => {
    setIsLocating(true);
    try {
      const coords = await requestLocation();
      if (coords) {
        setIsCurrentGps(true);
        setSelectedCityChip('My Location');
        await fetchWeatherByCoords(coords.lat, coords.lon);
      }
    } catch {
      // ignore
    } finally {
      setIsLocating(false);
    }
  };

  // Auto-detect GPS location on startup with smart fallback
  useEffect(() => {
    loadSearchHistory();
    (async () => {
      setIsLocating(true);
      try {
        const coords = await requestLocation();
        if (coords) {
          setIsCurrentGps(true);
          setSelectedCityChip('My Location');
          await fetchWeatherByCoords(coords.lat, coords.lon);
          return;
        }
      } catch {
        // fallback
      } finally {
        setIsLocating(false);
      }

      // If location is denied or unavailable, check recently searched cities
      try {
        const stored = await AsyncStorage.getItem('recent_cities');
        const recents = stored ? JSON.parse(stored) : [];
        if (recents && recents.length > 0) {
          setIsCurrentGps(false);
          setSelectedCityChip(recents[0]);
          await fetchWeatherByCity(recents[0]);
          return;
        }
      } catch {
        // ignore
      }

      // Default fallback
      setIsCurrentGps(false);
      setSelectedCityChip('Dhaka');
      await fetchWeatherByCity('Dhaka');
    })();
  }, []);

  // Premium entrance animation sequence
  useEffect(() => {
    if (currentWeather) {
      Animated.parallel([
        Animated.spring(heroScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: false }),
        Animated.timing(heroOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(headerSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(chipsSlide, { toValue: 0, duration: 600, delay: 100, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(contentSlide, { toValue: 0, duration: 700, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]).start();
    }
  }, [currentWeather?.name]);

  useEffect(() => {
    if (location) {
      setIsCurrentGps(true);
      fetchWeatherByCoords(location.lat, location.lon);
    }
  }, [location?.lat, location?.lon]);

  const onRefresh = useCallback(() => {
    refreshWeather();
  }, [refreshWeather]);

  const handleCitySelect = (city: string) => {
    setIsCurrentGps(false);
    setSelectedCityChip(city);
    // Reset animations
    heroScale.setValue(0.95);
    heroOpacity.setValue(0.3);
    contentSlide.setValue(20);

    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: false }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 400, useNativeDriver: false }),
      Animated.timing(contentSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
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

  // Prepare precipitation data from hourly forecast
  const precipData = hourlyForecast.slice(0, 12).map((h) => ({
    time: h.time,
    pop: h.pop || 0,
    icon: h.icon,
  }));

  return (
    <LinearGradient
      colors={gradient}
      style={styles.root}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
    >
      {/* High-End Animated Weather Particle Layer */}
      <AnimatedWeatherBackground condition={conditionType} />

      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea}>

        {/* Ultra-Premium App Header */}
        <Animated.View style={[styles.header, { transform: [{ translateY: headerSlide }] }]}>
          <TouchableOpacity onPress={() => setSearchVisible(true)} activeOpacity={0.8}>
            <Text style={styles.appName}>WeatherNow</Text>
            {currentWeather ? (
              <Text style={styles.locationLabel}>
                {isCurrentGps ? '📍 My Location · ' : '🌍 '}{currentWeather.name}, {currentWeather.sys.country} ▾
              </Text>
            ) : (
              <Text style={styles.locationLabel}>📍 Detecting location...</Text>
            )}
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.unitBtn}
              onPress={toggleUnit}
              activeOpacity={0.7}
            >
              <Text style={styles.unitText}>{unit === 'imperial' ? '°F' : '°C'}</Text>
            </TouchableOpacity>

            {/* AI Push Notification Bell */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setNotificationVisible(true)}
              accessibilityLabel="In-App Weather Alerts"
            >
              <Text style={styles.iconBtnText}>🔔</Text>
              {hasUnread && <View style={styles.notificationDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, isLocating && styles.iconBtnActive]}
              onPress={handleRequestGps}
              accessibilityLabel="Use my GPS location"
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <Text style={styles.iconBtnText}>📍</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setSearchVisible(true)}
              accessibilityLabel="Search any location"
            >
              <Text style={styles.iconBtnText}>🔍</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Tab Router Switcher */}
        {activeTab === 'radar' ? (
          <RadarView
            cityName={currentWeather?.name || 'Dhaka'}
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
            cityName={currentWeather?.name || 'Dhaka'}
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
            {/* Quick Live Search Bar Trigger */}
            <View style={styles.searchTriggerRow}>
              <TouchableOpacity
                style={styles.searchTriggerBtn}
                onPress={() => setSearchVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.searchTriggerIcon}>🔍</Text>
                <Text style={styles.searchTriggerPlaceholder}>Search any city or country worldwide...</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gpsTriggerBtn, isLocating && styles.gpsTriggerBtnActive]}
                onPress={handleRequestGps}
                activeOpacity={0.7}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.gpsTriggerIcon}>📍</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Dynamic City Filter (Current Location + Recent Searches + Global Hubs) */}
            <Animated.View style={[styles.chipsContainer, { transform: [{ translateY: chipsSlide }] }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                {/* 1. Live GPS Location Chip */}
                <TouchableOpacity
                  style={[styles.cityChip, isCurrentGps && styles.cityChipGpsActive]}
                  onPress={handleRequestGps}
                  activeOpacity={0.8}
                >
                  <View style={[styles.gpsDot, isCurrentGps && styles.gpsDotActive]} />
                  <Text style={[styles.cityChipText, isCurrentGps && styles.cityChipTextActive]}>
                    My Location
                  </Text>
                </TouchableOpacity>

                {/* 2. Dynamic Recent Searched Cities */}
                {recentCities.map((city) => {
                  const isActive = !isCurrentGps && currentWeather?.name.toLowerCase() === city.toLowerCase();
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

                {/* 3. Global Popular Cities */}
                {['Dhaka', 'London', 'Tokyo', 'New York', 'Dubai', 'Paris']
                  .filter((c) => !recentCities.some((rc) => rc.toLowerCase() === c.toLowerCase()))
                  .map((city) => {
                    const isActive = !isCurrentGps && currentWeather?.name.toLowerCase().includes(city.toLowerCase());
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

                {/* 4. Search More Button */}
                <TouchableOpacity
                  style={[styles.cityChip, styles.cityChipSearchMore]}
                  onPress={() => setSearchVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cityChipTextSearchMore}>+ Search</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>

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
                  {/* ═══════════════════════════════════════════
                      HERO SECTION — Ultra-Premium Weather Display
                      ═══════════════════════════════════════════ */}
                  <Animated.View style={[
                    styles.heroSection,
                    {
                      transform: [{ scale: heroScale }],
                      opacity: heroOpacity,
                    },
                  ]}>
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
                      <View style={styles.heroPillDivider} />
                      <View style={styles.heroConditionPill}>
                        <Text style={styles.heroConditionPillText}>
                          H: {displayTemp(currentWeather.main.temp_max)}°  ·  L: {displayTemp(currentWeather.main.temp_min)}°
                        </Text>
                      </View>
                    </View>
                  </Animated.View>

                  {/* ═══════════════════════════════════════════
                      24-HOUR FORECAST TIMELINE
                      ═══════════════════════════════════════════ */}
                  <Animated.View style={{ transform: [{ translateY: contentSlide }] }}>
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

                    {/* ═══════════════════════════════════════════
                        PRECIPITATION BAR CHART
                        ═══════════════════════════════════════════ */}
                    {precipData.length > 0 && (
                      <PrecipitationChart hourlyData={precipData} />
                    )}

                    {/* ═══════════════════════════════════════════
                        UV INDEX & AIR QUALITY GAUGES
                        ═══════════════════════════════════════════ */}
                    <View style={styles.sectionMargin}>
                      <UvAirQualityCard
                        uvIndex={Math.round(currentWeather.main.temp > 25 ? 7 : 4)}
                        humidity={currentWeather.main.humidity}
                        dewPoint={currentWeather.main.temp - (100 - currentWeather.main.humidity) / 5}
                        unit={unit}
                      />
                    </View>

                    {/* ═══════════════════════════════════════════
                        7-DAY FORECAST — Apple Weather Style
                        ═══════════════════════════════════════════ */}
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

                    {/* ═══════════════════════════════════════════
                        WIND COMPASS + FEELS LIKE GAUGE — Side by Side
                        ═══════════════════════════════════════════ */}
                    <View style={styles.dualCardRow}>
                      <View style={{ flex: 1 }}>
                        <WindCompassCard
                          speed={currentWeather.wind.speed}
                          direction={currentWeather.wind.deg || 0}
                          gustSpeed={currentWeather.wind.gust}
                          unit={unit}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <FeelsLikeGauge
                          feelsLike={currentWeather.main.feels_like}
                          actual={currentWeather.main.temp}
                          unit={unit}
                        />
                      </View>
                    </View>

                    {/* ═══════════════════════════════════════════
                        WEATHER DETAILS — 2x2 GRID
                        ═══════════════════════════════════════════ */}
                    <View style={styles.sectionMargin}>
                      <View style={styles.statsGrid}>
                        <StatCard
                          icon="💧"
                          label="Humidity"
                          value={`${currentWeather.main.humidity}%`}
                          subtext={`Dew point ${displayTemp(currentWeather.main.temp - 6)}°`}
                          accentColor={COLORS.cyan}
                          gaugeProgress={currentWeather.main.humidity / 100}
                        />
                        <StatCard
                          icon="👁️"
                          label="Visibility"
                          value={getVisibility(currentWeather.visibility)}
                          subtext="Clear view of horizon"
                          accentColor={COLORS.emerald}
                        />
                        <StatCard
                          icon="🌡️"
                          label="Pressure"
                          value={getPressure(currentWeather.main.pressure)}
                          subtext="Barometer is steady"
                          accentColor={COLORS.violet}
                        />
                        <StatCard
                          icon="🌬️"
                          label="Wind Speed"
                          value={getWindSpeed(currentWeather.wind.speed)}
                          unit={getWindDirection(currentWeather.wind.deg)}
                          subtext="Current gusts"
                          accentColor={COLORS.teal}
                        />
                      </View>
                    </View>

                    {/* ═══════════════════════════════════════════
                        SUN ARC — Sunrise/Sunset SVG Visualization
                        ═══════════════════════════════════════════ */}
                    <SunArcCard
                      sunrise={currentWeather.sys.sunrise}
                      sunset={currentWeather.sys.sunset}
                    />

                    {/* Bottom spacer for tab bar */}
                    <View style={{ height: 110 }} />
                  </Animated.View>
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

      {/* Dynamic Worldwide Search Modal */}
      <SearchBar
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onRequestGps={handleRequestGps}
        isLocating={isLocating}
      />
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

  // ── HEADER ────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
  appName: {
    fontSize: 26,
    color: '#FFF',
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  unitText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#0A0F1D',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  iconBtnText: {
    fontSize: 16,
  },

  // ── CITY CHIPS ────────────────────
  chipsContainer: {
    marginBottom: 6,
  },
  chipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cityChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cityChipText: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: COLORS.accent,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },

  // ── HERO SECTION ────────────────────
  heroSection: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  weatherIcon: {
    fontSize: 88,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  temperature: {
    fontSize: 104,
    fontFamily: FONTS.light,
    fontWeight: '200',
    color: '#FFF',
    lineHeight: 108,
    letterSpacing: -4,
  },
  tempDegree: {
    fontSize: 40,
    fontFamily: FONTS.light,
    fontWeight: '300',
    color: COLORS.accent,
    marginTop: 6,
  },
  weatherCondition: {
    fontSize: 22,
    color: '#FFF',
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  heroConditionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroPillDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroConditionPillText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },

  // ── CONTENT SECTIONS ────────────────
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionMargin: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  cardEncapsulated: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  forecastList: {
    borderRadius: 18,
    overflow: 'hidden',
  },

  // ── DUAL CARD ROW ────────────────
  dualCardRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -5,
  },

  // ── LOADING ────────────────────
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
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 14,
  },

  // ── SEARCH & GPS TRIGGERS ────────────
  searchTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  searchTriggerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    paddingHorizontal: 14,
    height: 44,
  },
  searchTriggerIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchTriggerPlaceholder: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },
  gpsTriggerBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.30)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsTriggerBtnActive: {
    backgroundColor: COLORS.accent,
  },
  gpsTriggerIcon: {
    fontSize: 18,
  },
  iconBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.20)',
    borderColor: COLORS.accent,
  },
  cityChipGpsActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.textMuted,
    marginRight: 6,
  },
  gpsDotActive: {
    backgroundColor: COLORS.cyan,
  },
  cityChipSearchMore: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderStyle: 'dashed',
  },
  cityChipTextSearchMore: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    color: COLORS.accent,
  },
});
