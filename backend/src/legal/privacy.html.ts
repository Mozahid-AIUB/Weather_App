// Public privacy policy for the WeatherNow app (linked from Google Play and the app).
export const PRIVACY_UPDATED = '14 October 2026';

export const PRIVACY_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WeatherNow Privacy Policy</title>
<style>
  :root { color-scheme: light dark; --bg:#FFFCF6; --text:#2A2118; --muted:#6E5F4E; --line:rgba(110,80,40,.12); --accent:#E5762F; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0A1124; --text:#F3F1EC; --muted:#A9B3C7; --line:rgba(255,255,255,.1); --accent:#9DB4FF; } }
  body { margin:0; background:var(--bg); color:var(--text); font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  main { max-width:760px; margin:0 auto; padding:40px 20px 64px; }
  h1 { font-size:30px; margin:0 0 4px; letter-spacing:-.4px; }
  h2 { font-size:19px; margin:32px 0 8px; }
  p, li { color:var(--text); }
  .muted { color:var(--muted); font-size:14px; }
  ul { padding-left:20px; }
  li { margin:6px 0; }
  table { width:100%; border-collapse:collapse; margin-top:8px; font-size:15px; }
  th, td { text-align:left; vertical-align:top; padding:10px 8px; border-bottom:1px solid var(--line); }
  th { color:var(--muted); font-weight:600; }
  a { color:var(--accent); }
</style>
</head>
<body>
<main>
  <h1>WeatherNow Privacy Policy</h1>
  <p class="muted">Developer: Mozahid Software · Last updated: ${PRIVACY_UPDATED}</p>

  <p>WeatherNow shows live weather, forecasts, radar maps and weather alerts for the places you choose.
  This policy explains what information the app uses, why, and the choices you have. WeatherNow has no
  user accounts, shows no ads and never sells personal information.</p>

  <h2>Information the app uses</h2>
  <table>
    <tr><th>Information</th><th>Why it is used</th><th>Where it goes</th></tr>
    <tr><td>Device location (precise or approximate), only if you allow it</td>
        <td>To show the weather and the name of the area where you are, and to send weather alerts for that area.</td>
        <td>Sent to weather and map services to fetch data for that spot. If notifications are on, your rounded location is stored on our server to send alerts.</td></tr>
    <tr><td>Places you search for</td>
        <td>To show weather for those places and keep your recent places on your phone.</td>
        <td>Saved on your phone. The place name and coordinates are also sent to our server without any personal identifier, to understand which places are popular.</td></tr>
    <tr><td>Your first name, only if you enter it</td>
        <td>To greet you in the morning and evening messages.</td>
        <td>Saved on your phone. If notifications are on, it is stored with your notification settings so messages sent from our server can greet you.</td></tr>
    <tr><td>Notification token and notification settings</td>
        <td>To deliver weather alerts and the daily messages you turned on, at the hours you chose.</td>
        <td>Stored on our server together with your units, chosen hours, time zone offset and alert preferences.</td></tr>
    <tr><td>App settings (theme, units, alert choices)</td>
        <td>To remember your preferences.</td>
        <td>Saved only on your phone, except the notification settings above.</td></tr>
  </table>

  <h2>Services we rely on</h2>
  <p>To provide weather data, maps, place names and notifications, the app contacts these services, which
  receive the coordinates or place names needed to answer each request:</p>
  <ul>
    <li>OpenWeather and Open-Meteo: weather conditions and forecasts</li>
    <li>RainViewer and Esri: radar and map imagery</li>
    <li>OpenStreetMap Nominatim and BigDataCloud: names of places from coordinates</li>
    <li>Expo push service and Google Firebase Cloud Messaging: delivery of notifications</li>
  </ul>
  <p>Each service handles data under its own privacy policy.</p>

  <h2>What we do not do</h2>
  <ul>
    <li>We do not sell or rent your information.</li>
    <li>We do not show ads or use advertising identifiers.</li>
    <li>We do not track you across other apps or websites.</li>
    <li>We do not collect your contacts, photos, files or messages.</li>
  </ul>

  <h2>How long data is kept</h2>
  <ul>
    <li>Notification registrations are kept while notifications are enabled and are removed automatically
        once the phone stops accepting them, for example after the app is uninstalled.</li>
    <li>Anonymous search records (place name and coordinates) are kept for statistics.</li>
    <li>Everything stored on your phone is deleted when you uninstall the app or clear its data.</li>
  </ul>

  <h2>Your choices</h2>
  <ul>
    <li>You can deny or remove location permission at any time in your phone settings and search for places instead.</li>
    <li>You can turn notifications off in the app's Settings or in your phone settings.</li>
    <li>You can remove your name in Settings.</li>
    <li>To ask us to delete server data linked to your device, email us at the address below.</li>
  </ul>

  <h2>Security</h2>
  <p>Data is sent over encrypted HTTPS connections. Server data is stored on a private server, and access to
  stored records is restricted to the developer.</p>

  <h2>Children</h2>
  <p>WeatherNow is a general-audience utility and is not directed at children under 13. We do not knowingly
  collect personal information from children.</p>

  <h2>Changes</h2>
  <p>If this policy changes, we will update this page and the date above.</p>

  <h2>Contact</h2>
  <p>Mozahid Software · <a href="mailto:mozahidul.islam.ai@gmail.com">mozahidul.islam.ai@gmail.com</a></p>
</main>
</body>
</html>`;
