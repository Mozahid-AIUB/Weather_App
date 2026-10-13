# WeatherNow 🌤️

> A premium, animated weather app built with **React Native (Expo)**, **TypeScript**, **Reanimated** and an optional **NestJS + PostgreSQL** backend. Made for users in the **US, Bangladesh and Europe**.

---

## 🌟 Key Features

- 🌗 **Sun & moon theme:** a warm cream look from sunrise, a moonlit dark look after sunset, timed to the real sunrise/sunset of the place you are viewing (or pin Light / Dark in Settings).
- 🌌 **Living sky:** glowing sun, moon with stars, drifting clouds, rain, snow and lightning, all on the UI thread with Reanimated.
- ✨ **Animated icons everywhere:** layered weather icons (turning rays, drifting clouds, falling drops) and a micro-animation on every card icon.
- 🔔 **Real-time alerts:** each update (every 10 min, plus whenever you return to the app) is checked for storms, rain, snow, heat, cold, wind, fog and sudden changes. Alerts appear as an in-app toast and in the notification center, and as push notifications on web and in installed builds.
- ☀️ **Good-morning brief:** a friendly daily note at the hour you choose, written from the day's real forecast: sky outlook, when rain is likely, and whether to take an umbrella, sunscreen or a jacket. Personalised with your name.
- 📍 **Precise location:** GPS names the neighbourhood, thana/upazila, village or quarter (Mirpur, Dhanmondi, Brooklyn…). Search covers small towns and villages too.
- 🌍 **Locale aware:** °F/mph in the US, °C/km/h elsewhere; 12- or 24-hour clock from the device; times shown in each city's own timezone.
- 🛰️ **Live radar:** RainViewer precipitation over a Leaflet map with a timeline scrubber.
- 🗺️ **Places:** saved locations with live conditions at a glance.

---

## 🏗️ Architecture

```
weather/
├── App.tsx                      # Fonts, safe area, theme provider
├── src/
│   ├── theme/                   # Day / night palettes and ThemeProvider (sun-based auto theme)
│   ├── screens/                 # HomeScreen shell + Today, Radar, Places, Settings
│   ├── components/
│   │   ├── sky/                 # Animated sky background
│   │   ├── weather/             # Hero, hourly curve, daily range bars, details, sun arc, icons
│   │   ├── notifications/       # Toast, alert banner, notification center
│   │   ├── ui/                  # Card, sheet, segmented control, animated glyphs, header
│   │   ├── SearchSheet.tsx
│   │   ├── TabBar.tsx
│   │   └── WeatherRadarMap.tsx  # Leaflet + RainViewer radar
│   ├── hooks/useLiveWeather.ts  # Boot, 10-minute refresh, alert + morning-brief pipeline
│   ├── services/
│   │   ├── weatherService.ts    # OpenWeather with Open-Meteo fallback, place search
│   │   ├── locationService.ts   # GPS + precise reverse geocoding
│   │   ├── alertEngine.ts       # Alert rules and the morning-brief writer
│   │   ├── notificationService.ts # Web Notifications / expo-notifications
│   │   └── backendService.ts    # NestJS API client (optional)
│   └── store/                   # Zustand: weather, settings, notifications
└── backend/                     # NestJS + PostgreSQL API (search history, analytics)
```

> Push notifications need a browser that allows them (web) or an installed development/production build. Expo Go shows alerts in-app only.

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
MIT License.
