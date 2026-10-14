# WeatherNow — Google Play publishing kit

Everything needed to publish WeatherNow from the **MOZAHID SOFTWARE** Play Console account.
Copy the text exactly; tick answers as written.

| Item | Value |
| --- | --- |
| Package name | `com.weathernow.app` |
| App name | WeatherNow: Live Weather |
| Default language | English (United States) – en-US |
| App or game | App |
| Free or paid | Free |
| Category | Weather |
| Contact email | mozahidul.islam.ai@gmail.com |
| Privacy policy | https://weather-api.194.233.85.160.sslip.io/privacy |
| App bundle | Production `.aab` from EAS (link in the build page) |

Graphics (all in this folder):

| Play field | File |
| --- | --- |
| App icon (512×512) | `play-icon-512.png` |
| Feature graphic (1024×500) | `feature-graphic-1024x500.png` |
| Phone screenshots (1080×1920) | `screenshots/1-today.png` … `screenshots/6-messages.png` (upload in order) |

---

## 1. Store listing

**App name** (30 max)

```
WeatherNow: Live Weather
```

**Short description** (80 max)

```
Live weather for your exact area, smart rain alerts and a friendly daily note.
```

**Full description** (4000 max)

```
WeatherNow shows the weather for exactly where you are — your neighbourhood, town or village — in a calm, beautiful app that changes with the sky.

☀️ BRIGHT BY DAY, CALM BY NIGHT
The app follows the real sunrise and sunset where you are: a warm, easy-to-read look in daylight and a moonlit dark look after dark, with a living sky of sun, moon, stars, clouds and rain.

📍 PRECISE LOCAL WEATHER
See the name of your exact area, current conditions, feels-like temperature, humidity, wind, pressure, visibility and rain chance. Search any city, town or village worldwide and save the places you care about.

🕒 HOUR BY HOUR AND THE DAYS AHEAD
A smooth hourly temperature curve with rain chances, plus the next days with highs, lows and a clear temperature range.

🛰️ LIVE WEATHER MAPS
Animated precipitation radar, satellite view with live clouds, a temperature map and a wind-speed map.

🔔 SMART ALERTS, ONLY WHEN IT MATTERS
Get a heads-up before rain or a thunderstorm, and alerts for extreme heat, cold, strong wind and dense fog. Quiet hours keep the night peaceful unless something is severe.

💬 A FRIENDLY NOTE EVERY MORNING AND EVENING
Wake up to a short message about your day — when rain is likely and whether to take an umbrella, sunscreen or a jacket. In the evening, see how the night looks and what tomorrow needs. Add your name and it greets you personally.

🌍 MADE FOR YOU
°C or °F, km/h or mph, 12- or 24-hour clock — set automatically from your phone, changeable anytime. No account needed and no ads.

Weather data by OpenWeather and Open-Meteo. Radar by RainViewer.
```

**Tags** (pick up to 5): Weather · Forecast · Radar · Weather alerts · Rain

---

## 2. App content (Policy → App content)

### Privacy policy
`https://weather-api.194.233.85.160.sslip.io/privacy`

### Ads
**No, my app does not contain ads.**

### App access
**All functionality is available without any access restrictions.**

### Content rating (IARC questionnaire)
- Email: mozahidul.islam.ai@gmail.com
- Category: **All Other App Types**
- Violence: No · Sexuality: No · Language: No · Controlled substances: No · Crude humour: No · Fear: No · Gambling: No
- Users can interact or exchange content: **No**
- Shares users' current location with other users: **No**
- Allows purchase of digital goods: **No**
- Unrestricted internet access (web browser): **No**
- Expected result: **Everyone / PEGI 3**

### Target audience and content
- Target age groups: **13–15, 16–17, 18 and over** (do *not* select under 13 — that brings in Families policy requirements)
- Appeals to children: **No**

### News app: **No**  ·  Government app: **No**  ·  Financial features: **None**  ·  Health: **No health features**

### Data safety
Overview questions:
- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Yes**
- Do you provide a way for users to request that their data is deleted? **Yes** → URL: `https://weather-api.194.233.85.160.sslip.io/privacy` (contact section)

Data types — mark **Collected: Yes, Shared: No** for each (data sent to weather/map providers is processing on our behalf, which Play does not count as sharing):

| Data type | Collected | Processed ephemerally | Required or optional | Purposes |
| --- | --- | --- | --- | --- |
| Location → Approximate location | Yes | No | Optional | App functionality |
| Location → Precise location | Yes | No | Optional | App functionality |
| Personal info → Name | Yes | No | Optional | App functionality, Personalization |
| App activity → In-app search history | Yes | No | Optional | App functionality, Analytics |
| Device or other IDs | Yes (push token) | No | Optional | App functionality |

Everything else (financial, health, messages, photos, files, contacts, calendar, audio, web history, crash logs, diagnostics): **Not collected**.

### Permissions
Only foreground location and notifications are requested — no background-location or exact-alarm declaration is needed.

---

## 3. Testing → production (personal account rule)

New apps on personal accounts must run a **closed test with at least 12 testers for 14 continuous days** before production access is granted.

1. **Testing → Closed testing → Create track** (e.g. "Friends").
2. Add testers: create an email list with 12+ Gmail addresses (friends, family, StudyForce users).
3. Upload the `.aab`, release name `1.0.0 (1)`, release notes below, **Save → Review → Start rollout**.
4. Share the opt-in link from the track page; each tester must accept and install.
5. Keep at least 12 testers opted in for 14 days, then **Dashboard → Apply for production** and answer the short questionnaire.

**Release notes (en-US)**

```
First release of WeatherNow:
• Live weather for your exact area with a day and night look
• Hourly curve and the days ahead
• Live radar, satellite, temperature and wind maps
• Smart rain, storm, heat and wind alerts
• Good-morning and good-evening messages
```

---

## 4. Automatic future uploads (optional)

After the first manual upload, updates can be sent straight from the project with `eas submit`:

1. Google Cloud Console → IAM → **Service accounts** → create `weathernow-play-upload` → **Keys → Add key → JSON**.
2. Play Console → **Users and permissions → Invite new user** → the service account email → app access **WeatherNow** → permissions **Release to testing tracks** (and **Release to production** later).
3. Save the JSON as `play-service-account.json` in the project root (it is gitignored).
4. Then: `npx eas-cli submit --platform android --profile production --latest`
