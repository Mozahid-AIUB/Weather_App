# WeatherNow Ultra 🌤️⚡

> A flagship, ultra-premium Weather App built with **React Native (Expo)**, **TypeScript**, and **NestJS + PostgreSQL**. Designed for the **US Market** and ready for deployment to **Apple App Store** and **Google Play Store**.

---

## 🌟 Key Features

- 🤖 **Neural AI Push Notifications:** Proactive rain radar anticipation, severe storm defense (NWS), and personalized daily morning commute briefings.
- 🌌 **Atmospheric Live Particle Animations:** Realistic rain drops, swirling snowflakes, radiant sun glows, and twinkling starry night skies.
- 🛰️ **Next-Gen Doppler Radar & Satellite View:** Interactive precipitation cells, wind stream telemetry, and thermal heatmap layers.
- 📊 **Apple Weather Style 7-Day Continuous Range Bars:** Day-by-day continuous gradient temperature bars with min/max dots and rain chance percentages.
- 🕒 **24-Hour Hourly Forecast Carousel:** Frosted glass pills with live status and pop probability.
- ☀️ **UV Index & Air Quality (AQI):** US EPA standard rating scales and health guidelines.
- 📍 **US Metro Quick Selector:** Instant one-tap access to New York, Los Angeles, Miami, Chicago, Dallas, San Francisco, Seattle, and Las Vegas.
- 🌙 **Insights & Environmental Intelligence:** Lunar phases (illuminance %), pollen counts (Tree, Grass, Ragweed), and outdoor activity comfort scoring.
- 📱 **Floating Glassmorphic Bottom Dock:** iOS 18 style floating navigation between Weather, Radar, Cities, Insights, and Settings.
- 🌡️ **Dual Unit System:** Full support for Fahrenheit (°F / mph / inHg / mi) and Celsius (°C / m/s / hPa / km).

---

## 🏗️ Architecture

```
weather/
├── App.tsx                          # Root App Component with Safe Area & Fonts
├── src/
│   ├── components/
│   │   ├── AnimatedWeatherBackground.tsx # Physics-based weather particles
│   │   ├── AiPushControlModal.tsx        # AI Push Notification Control Hub
│   │   ├── BottomTabBar.tsx              # Floating glassmorphic dock
│   │   ├── ForecastCard.tsx              # Apple Weather style range bar row
│   │   ├── HourlyForecastCard.tsx        # 24-hour frosted glass pill
│   │   ├── InsightsView.tsx              # Lunar cycle & pollen outlook
│   │   ├── RadarView.tsx                 # Doppler radar & satellite layer
│   │   ├── SavedCitiesView.tsx           # Favorite US Metros
│   │   ├── SettingsView.tsx              # Push alerts & unit preferences
│   │   ├── StatCard.tsx                  # 2x2 atmospheric details grid
│   │   └── UvAirQualityCard.tsx          # UV & Air Quality gauge widgets
│   ├── screens/
│   │   └── HomeScreen.tsx                # Flagship Weather Screen
│   ├── services/
│   │   ├── aiNotificationService.ts      # Neural AI Push Engine (expo-notifications)
│   │   ├── weatherService.ts             # OpenWeather & Open-Meteo Fallback API
│   │   └── backendService.ts             # NestJS API Client
│   └── store/
│       └── weatherStore.ts               # Zustand Global State Management
└── backend/                              # NestJS + PostgreSQL Enterprise API
    ├── src/
    │   ├── main.ts                       # Swagger & NestJS bootstrap
    │   ├── app.module.ts                 # TypeORM & Root Config
    │   ├── search-history/               # Search History CRUD
    │   └── analytics/                    # Weather Views Analytics
    └── DEPLOY.md                         # VPS & Cloud Deployment Guide
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Expo Development Server
```bash
npx expo start
```
- Press `w` for Web Browser preview.
- Scan QR code using **Expo Go** on iOS or Android.

### 3. Run Backend (Optional)
```bash
cd backend
npm install
npm run start:dev
```
- Swagger documentation: `http://localhost:3000/docs`

---

## 📦 Store Deployment (EAS)

```bash
# Build Android APK / AAB
eas build --platform android

# Build iOS IPA
eas build --platform ios
```

---

## 📄 License
MIT License. Crafted with visual excellence.
