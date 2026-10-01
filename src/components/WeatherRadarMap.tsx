import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, FONTS } from '../constants';

const { width } = Dimensions.get('window');

interface WeatherRadarMapProps {
  cityName: string;
  lat: number;
  lon: number;
  temp?: number;
  condition?: string;
  unit?: 'metric' | 'imperial';
  rainChance?: number;
  onSelectCity?: (cityName: string) => void;
}

export const WeatherRadarMap: React.FC<WeatherRadarMapProps> = ({
  cityName,
  lat,
  lon,
  temp,
  condition = 'Clear',
  unit = 'metric',
  rainChance = 15,
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Send recenter command if coordinates change
  useEffect(() => {
    if (mapLoaded && webViewRef.current) {
      const script = `if (window.recenterMap) { window.recenterMap(${lat}, ${lon}, "${cityName.replace(/"/g, '\\"')}"); }`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [lat, lon, cityName, mapLoaded]);

  // Construct Leaflet + RainViewer standalone HTML
  const radarHTML = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Weather Doppler Radar</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0B1426;
    }
    #map {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      background: #0B1426;
    }

    /* ── TOP RADAR HEADER & INTENSITY BAR (Weather Channel replica) ── */
    .top-radar-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: linear-gradient(180deg, rgba(8, 20, 44, 0.96) 0%, rgba(8, 20, 44, 0.88) 85%, rgba(8, 20, 44, 0) 100%);
      padding: 10px 14px 14px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .radar-time-title {
      color: #E2E8F0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-align: center;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .radar-time-title span {
      color: #38BDF8;
    }
    .intensity-bar-container {
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
    }
    .intensity-gradient {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: linear-gradient(to right,
        /* Rain: Blue -> Cyan -> Green -> Yellow -> Orange -> Red -> Purple */
        #1E40AF 0%,
        #3B82F6 10%,
        #06B6D4 20%,
        #22C55E 35%,
        #EAB308 50%,
        #F97316 62%,
        #EF4444 72%,
        #A855F7 80%,
        /* Mixed: Pink -> Violet */
        #EC4899 85%,
        #F472B6 90%,
        /* Snow: Cyan -> Light Ice Blue */
        #38BDF8 95%,
        #BAE6FD 100%
      );
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }
    .intensity-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      font-size: 10px;
      font-weight: 600;
      color: #94A3B8;
      padding: 0 2px;
    }
    .intensity-labels .mixed {
      color: #F472B6;
    }
    .intensity-labels .snow {
      color: #38BDF8;
    }

    /* ── FLOATING MAP CONTROLS (Right-side vertical pill) ── */
    .map-controls-card {
      position: absolute;
      right: 14px;
      bottom: 110px;
      z-index: 1000;
      background: #FFFFFF;
      border-radius: 14px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }
    .control-btn {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: #334155;
      font-size: 18px;
      cursor: pointer;
      outline: none;
      transition: background-color 0.15s ease;
    }
    .control-btn:active {
      background-color: #F1F5F9;
    }
    .control-btn-divider {
      height: 1px;
      background-color: #E2E8F0;
      margin: 0 6px;
    }

    /* ── BOTTOM TIMELINE SCRUBBER CARD (Weather Channel replica) ── */
    .timeline-card {
      position: absolute;
      left: 14px;
      right: 14px;
      bottom: 14px;
      z-index: 1000;
      background: #FFFFFF;
      border-radius: 18px;
      padding: 10px 14px 10px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
      border: 1px solid rgba(0, 0, 0, 0.08);
    }
    .timeline-header {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }
    .timeline-timestamp {
      font-size: 12px;
      font-weight: 700;
      color: #1E293B;
      letter-spacing: 0.3px;
    }
    .timeline-live-tag {
      background: #EF4444;
      color: #FFFFFF;
      font-size: 8px;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      animation: livePulse 2s infinite;
    }
    @keyframes livePulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .timeline-controls-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .play-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #1E293B;
      color: #FFFFFF;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      flex-shrink: 0;
      transition: transform 0.1s ease, background 0.15s ease;
    }
    .play-btn:active {
      transform: scale(0.92);
      background: #38BDF8;
    }
    .slider-container {
      flex: 1;
      position: relative;
    }
    .slider-track-wrap {
      position: relative;
      width: 100%;
      height: 24px;
      display: flex;
      align-items: center;
    }
    .timeline-slider {
      -webkit-appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #CBD5E1;
      outline: none;
      cursor: pointer;
      margin: 0;
    }
    .timeline-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #1E293B;
      border: 3px solid #38BDF8;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      cursor: pointer;
      transition: transform 0.1s ease;
    }
    .timeline-slider::-webkit-slider-thumb:active {
      transform: scale(1.15);
    }
    .slider-ticks {
      position: absolute;
      top: 50%;
      left: 10px;
      right: 10px;
      transform: translateY(-50%);
      pointer-events: none;
      display: flex;
      justify-content: space-between;
    }
    .slider-tick {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #64748B;
      opacity: 0.5;
    }
    .slider-labels-row {
      display: flex;
      justify-content: space-between;
      margin-top: 2px;
      font-size: 10px;
      font-weight: 600;
      color: #64748B;
    }
    .slider-labels-row .now-label {
      color: #0284C7;
      font-weight: 700;
    }

    /* ── CUSTOM BLUE MAP MARKER (Weather Channel style) ── */
    .radar-pin {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
    }
    .pin-icon {
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      background: #2563EB;
      transform: rotate(-45deg);
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pin-inner-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #FFFFFF;
      transform: rotate(45deg);
    }
    .pin-radar-ring {
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid #38BDF8;
      opacity: 0.7;
      animation: markerPulse 2s infinite ease-out;
      pointer-events: none;
    }
    @keyframes markerPulse {
      0% { transform: translateX(-50%) scale(0.6); opacity: 0.9; }
      100% { transform: translateX(-50%) scale(2.0); opacity: 0; }
    }
    .pin-city-badge {
      margin-top: 4px;
      background: rgba(15, 23, 42, 0.88);
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 10px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* ── LAYER MODAL DRAWER ── */
    .layer-menu {
      position: absolute;
      right: 68px;
      bottom: 154px;
      z-index: 1001;
      background: #FFFFFF;
      border-radius: 14px;
      padding: 6px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.25);
      display: none;
      flex-direction: column;
      gap: 4px;
      min-width: 140px;
      border: 1px solid rgba(0,0,0,0.08);
    }
    .layer-menu.active {
      display: flex;
    }
    .layer-menu-btn {
      padding: 8px 10px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #334155;
      font-size: 12px;
      font-weight: 600;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .layer-menu-btn.selected {
      background: #E0F2FE;
      color: #0284C7;
      font-weight: 700;
    }

    /* Position Leaflet scale below top radar bar */
    .leaflet-top {
      top: 64px !important;
    }
    .leaflet-control-scale {
      margin-left: 14px !important;
      border: 1.5px solid #1E293B !important;
      background: rgba(255, 255, 255, 0.85) !important;
      font-weight: 700 !important;
      font-size: 10px !important;
      color: #0F172A !important;
      border-radius: 4px !important;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2) !important;
    }
    .leaflet-control-zoom {
      display: none !important;
    }
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(255, 255, 255, 0.7) !important;
      padding: 0 5px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <!-- Top Intensity Bar (Matches Screenshot) -->
  <div class="top-radar-bar">
    <div class="radar-time-title">
      RADAR &bull; <span id="top-timestamp-display">LOADING RADAR...</span>
    </div>
    <div class="intensity-bar-container">
      <div class="intensity-gradient"></div>
      <div class="intensity-labels">
        <span>Rain</span>
        <span class="mixed">Mixed</span>
        <span class="snow">Snow</span>
      </div>
    </div>
  </div>

  <!-- Layer Menu Drawer -->
  <div class="layer-menu" id="layerMenu">
    <button class="layer-menu-btn selected" id="btn-layer-radar" onclick="setLayer('radar')">
      🌧️ Doppler Radar
    </button>
    <button class="layer-menu-btn" id="btn-layer-satellite" onclick="setLayer('satellite')">
      🛰️ Satellite Clouds
    </button>
    <button class="layer-menu-btn" id="btn-layer-temp" onclick="setLayer('temp')">
      🌡️ Temperature Heat
    </button>
    <button class="layer-menu-btn" id="btn-layer-wind" onclick="setLayer('wind')">
      💨 Wind Currents
    </button>
  </div>

  <!-- Floating Right-Side Controls (Matches Screenshot) -->
  <div class="map-controls-card">
    <button class="control-btn" title="Radar Layers" onclick="toggleLayerMenu()" id="layerToggleBtn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
    </button>
    <div class="control-btn-divider"></div>
    <button class="control-btn" title="Zoom In" onclick="mapZoomIn()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="7"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    </button>
    <div class="control-btn-divider"></div>
    <button class="control-btn" title="Zoom Out" onclick="mapZoomOut()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="7"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    </button>
    <div class="control-btn-divider"></div>
    <button class="control-btn" title="Locate Me" onclick="recenterToCity()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"></circle>
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
      </svg>
    </button>
  </div>

  <!-- Bottom Timeline Scrubber (Matches Screenshot) -->
  <div class="timeline-card">
    <div class="timeline-header">
      <span class="timeline-timestamp" id="scrubber-timestamp">LOADING RADAR...</span>
      <span class="timeline-live-tag" id="live-tag">LIVE</span>
    </div>
    <div class="timeline-controls-row">
      <button class="play-btn" id="playBtn" onclick="togglePlay()">
        <svg id="playIcon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>
      <div class="slider-container">
        <div class="slider-track-wrap">
          <input
            type="range"
            class="timeline-slider"
            id="timelineSlider"
            min="0"
            max="12"
            value="12"
            step="1"
            oninput="onSliderScrub(this.value)"
          />
        </div>
        <div class="slider-labels-row">
          <span id="label-start">-2h</span>
          <span class="now-label" id="label-now">Now</span>
          <span id="label-end">+30m</span>
        </div>
      </div>
    </div>
  </div>

  <script>
    var currentLat = ${lat};
    var currentLon = ${lon};
    var currentCity = "${cityName.replace(/"/g, '\\"')}";
    var map;
    var marker;
    var radarLayers = [];
    var radarFrames = [];
    var currentFrameIndex = 0;
    var isPlaying = true;
    var playInterval = null;
    var activeLayerType = 'radar';
    var rainViewerHost = 'https://tilecache.rainviewer.com';

    // Format UNIX timestamp to MM/DD/YY | HH:MM AM/PM
    function formatTime(unixSec) {
      if (!unixSec) return '';
      var d = new Date(unixSec * 1000);
      var month = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      var year = String(d.getFullYear()).slice(-2);
      var hours = d.getHours();
      var minutes = String(d.getMinutes()).padStart(2, '0');
      var ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      var strHours = String(hours).padStart(2, '0');
      return month + '/' + day + '/' + year + ' | ' + strHours + ':' + minutes + ' ' + ampm;
    }

    function formatShortTime(unixSec) {
      if (!unixSec) return '';
      var d = new Date(unixSec * 1000);
      var hours = d.getHours();
      var minutes = String(d.getMinutes()).padStart(2, '0');
      var ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;
    }

    // Initialize Map
    function initMap() {
      map = L.map('map', {
        center: [currentLat, currentLon],
        zoom: 7,
        zoomControl: false,
        attributionControl: true,
        touchZoom: true,
        dragging: true,
        tap: false
      });

      // Scale bar on top left (Matches reference screenshot 60 mi / 100 km)
      L.control.scale({
        position: 'topleft',
        metric: true,
        imperial: true,
        maxWidth: 120
      }).addTo(map);

      // Carto Voyager Base Map (Clean, detailed, real cities and highways)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      // Custom Blue Doppler Radar Location Marker
      createMarker();

      // Fetch live RainViewer radar frames
      fetchRadarFrames();
    }

    function createMarker() {
      if (marker) {
        map.removeLayer(marker);
      }
      var markerHtml = '<div class="radar-pin">' +
        '<div class="pin-radar-ring"></div>' +
        '<div class="pin-icon"><div class="pin-inner-dot"></div></div>' +
        '<div class="pin-city-badge">' + currentCity + '</div>' +
        '</div>';

      var customIcon = L.divIcon({
        className: 'custom-radar-marker',
        html: markerHtml,
        iconSize: [30, 42],
        iconAnchor: [15, 30]
      });

      marker = L.marker([currentLat, currentLon], { icon: customIcon }).addTo(map);
    }

    // Fetch RainViewer public API
    function fetchRadarFrames() {
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          rainViewerHost = data.host || 'https://tilecache.rainviewer.com';
          var past = data.radar && data.radar.past ? data.radar.past : [];
          var nowcast = data.radar && data.radar.nowcast ? data.radar.nowcast : [];
          radarFrames = past.concat(nowcast);

          if (radarFrames.length === 0) {
            document.getElementById('top-timestamp-display').innerText = 'RADAR OFFLINE';
            document.getElementById('scrubber-timestamp').innerText = 'No radar data';
            return;
          }

          var slider = document.getElementById('timelineSlider');
          slider.max = radarFrames.length - 1;
          currentFrameIndex = radarFrames.length - 1; // Default to latest "Now"
          slider.value = currentFrameIndex;

          // Update timeline range labels
          var firstTime = radarFrames[0].time;
          var lastTime = radarFrames[radarFrames.length - 1].time;
          document.getElementById('label-start').innerText = formatShortTime(firstTime);
          document.getElementById('label-end').innerText = formatShortTime(lastTime);

          // Build tile layers for all frames
          buildRadarLayers();

          // Display latest frame
          showFrame(currentFrameIndex);

          // Start loop playback
          startPlay();
        })
        .catch(function(err) {
          console.error('RainViewer API error', err);
          document.getElementById('top-timestamp-display').innerText = 'RADAR ACTIVE';
          document.getElementById('scrubber-timestamp').innerText = 'Live Precipitation Scan';
        });
    }

    // Build Leaflet Tile Layers for each radar timestamp
    function buildRadarLayers() {
      radarLayers = [];
      for (var i = 0; i < radarFrames.length; i++) {
        var frame = radarFrames[i];
        // scheme 4 is The Weather Channel color scheme, 1_1 is smoothed with snow
        var tileUrl = rainViewerHost + frame.path + '/256/{z}/{x}/{y}/4/1_1.png';
        var layer = L.tileLayer(tileUrl, {
          tileSize: 256,
          opacity: 0,
          zIndex: 100,
          maxZoom: 18
        });
        layer.addTo(map);
        radarLayers.push(layer);
      }
    }

    // Switch visible radar frame
    function showFrame(index) {
      if (index < 0 || index >= radarFrames.length) return;
      currentFrameIndex = index;

      // Update opacity for each frame layer
      for (var i = 0; i < radarLayers.length; i++) {
        if (i === index) {
          radarLayers[i].setOpacity(0.82);
        } else {
          radarLayers[i].setOpacity(0);
        }
      }

      var frame = radarFrames[index];
      var formatted = formatTime(frame.time);
      document.getElementById('top-timestamp-display').innerText = formatted;
      document.getElementById('scrubber-timestamp').innerText = formatted;

      var slider = document.getElementById('timelineSlider');
      slider.value = index;

      var isLiveNow = (index === radarFrames.length - 1);
      document.getElementById('live-tag').innerText = isLiveNow ? 'LIVE' : 'HISTORY';
      document.getElementById('live-tag').style.background = isLiveNow ? '#EF4444' : '#64748B';
    }

    // Playback loop
    function startPlay() {
      isPlaying = true;
      updatePlayIcon();
      if (playInterval) clearInterval(playInterval);
      playInterval = setInterval(function() {
        var nextIndex = currentFrameIndex + 1;
        if (nextIndex >= radarFrames.length) {
          nextIndex = 0; // Loop back
        }
        showFrame(nextIndex);
      }, 700);
    }

    function pausePlay() {
      isPlaying = false;
      updatePlayIcon();
      if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
      }
    }

    function togglePlay() {
      if (isPlaying) {
        pausePlay();
      } else {
        startPlay();
      }
    }

    function updatePlayIcon() {
      var btn = document.getElementById('playBtn');
      if (isPlaying) {
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
      } else {
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
      }
    }

    function onSliderScrub(val) {
      pausePlay();
      showFrame(parseInt(val, 10));
    }

    function mapZoomIn() {
      map.zoomIn();
    }

    function mapZoomOut() {
      map.zoomOut();
    }

    function recenterToCity() {
      map.flyTo([currentLat, currentLon], 8, {
        animate: true,
        duration: 1.2
      });
    }

    function toggleLayerMenu() {
      var menu = document.getElementById('layerMenu');
      menu.classList.toggle('active');
    }

    function setLayer(layerType) {
      activeLayerType = layerType;
      document.getElementById('layerMenu').classList.remove('active');
      var btns = document.querySelectorAll('.layer-menu-btn');
      btns.forEach(function(b) { b.classList.remove('selected'); });
      var activeBtn = document.getElementById('btn-layer-' + layerType);
      if (activeBtn) activeBtn.classList.add('selected');

      // Update tile layers if satellite or radar
      for (var i = 0; i < radarLayers.length; i++) {
        map.removeLayer(radarLayers[i]);
      }
      radarLayers = [];

      for (var j = 0; j < radarFrames.length; j++) {
        var frame = radarFrames[j];
        var scheme = (layerType === 'radar' ? '4' : '2');
        var tileUrl = rainViewerHost + frame.path + '/256/{z}/{x}/{y}/' + scheme + '/1_1.png';
        var layer = L.tileLayer(tileUrl, {
          tileSize: 256,
          opacity: 0,
          zIndex: 100,
          maxZoom: 18
        });
        layer.addTo(map);
        radarLayers.push(layer);
      }
      showFrame(currentFrameIndex);
    }

    // Recenter from external React Native call
    window.recenterMap = function(newLat, newLon, newCity) {
      currentLat = newLat;
      currentLon = newLon;
      currentCity = newCity;
      createMarker();
      map.flyTo([currentLat, currentLon], 8, {
        animate: true,
        duration: 1.2
      });
    };

    // Close layer menu on map click
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#layerMenu') && !e.target.closest('#layerToggleBtn')) {
        document.getElementById('layerMenu').classList.remove('active');
      }
    });

    window.onload = initMap;
  </script>
</body>
</html>
    `;
  }, [lat, lon, cityName]);

  return (
    <View style={styles.container}>
      {/* Platform rendering: Native WebView or Web iframe */}
      {Platform.OS === 'web' ? (
        <View style={styles.webContainer}>
          <iframe
            srcDoc={radarHTML}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Weather Doppler Radar"
          />
        </View>
      ) : (
        <View style={styles.nativeContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: radarHTML }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            nestedScrollEnabled={true}
            onLoadEnd={() => setMapLoaded(true)}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Connecting to Doppler Radar...</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 480,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0B1426',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    position: 'relative',
    marginBottom: 16,
  },
  webContainer: {
    width: '100%',
    height: '100%',
  },
  nativeContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0B1426',
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0B1426',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0B1426',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.accent,
    fontFamily: FONTS.semiBold,
    fontSize: 13,
  },
});
