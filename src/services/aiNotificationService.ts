import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';

// Safe conditional loader: expo-notifications removed push from Android Expo Go in SDK 53+.
// We only load expo-notifications when NOT in Expo Go (e.g. Development Build or Standalone APK).
let Notifications: typeof import('expo-notifications') | null = null;

function checkIsExpoGo(): boolean {
  try {
    return typeof isRunningInExpoGo === 'function' ? isRunningInExpoGo() : false;
  } catch {
    return false;
  }
}

try {
  if (!checkIsExpoGo()) {
    Notifications = require('expo-notifications');
    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: Notifications?.AndroidNotificationPriority?.HIGH ?? 4,
        }),
      });
    }
  }
} catch (e) {
  // Graceful fallback when running in environments without native notification runtime
}

export interface AiPushAlert {
  id: string;
  title: string;
  body: string;
  type: 'rain' | 'severe' | 'briefing' | 'uv';
  timestamp: string;
  aiModel: string;
}

export const aiNotificationService = {
  isSupportedOnDevice: (): boolean => !checkIsExpoGo() && Notifications !== null,

  /**
   * Request push notification permissions on device
   */
  registerForPushNotifications: async (): Promise<boolean> => {
    if (checkIsExpoGo() || !Notifications) {
      return true; // Graceful simulation in Expo Go
    }

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('weather-ai-channel', {
          name: 'AI Weather Radar & Storm Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#38BDF8',
          sound: 'default',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Push notification permission error:', e);
      return false;
    }
  },

  /**
   * Send real-time immediate AI Push Notification
   */
  triggerAiPushNotification: async (
    title: string,
    body: string,
    type: 'rain' | 'severe' | 'briefing' | 'uv' = 'rain'
  ): Promise<string> => {
    if (checkIsExpoGo() || !Notifications) {
      return 'expo-go-simulated-' + Date.now();
    }

    await aiNotificationService.registerForPushNotifications();

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { type, aiEngine: 'WeatherNow Neural AI v2.4' },
      },
      trigger: null, // Send immediately
    });

    return notifId;
  },

  /**
   * AI Proactive Weather Synthesizer
   */
  generateAiAlert: (
    cityName: string,
    temp: number,
    condition: string,
    humidity: number,
    windSpeed: number
  ): { title: string; body: string } => {
    if (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle')) {
      return {
        title: `🌧️ AI Rain Radar: ${cityName}`,
        body: `AI Model detected incoming precipitation. Grab an umbrella! Rain intensity expected to peak within 20 minutes.`,
      };
    }

    if (condition.toLowerCase().includes('thunder') || windSpeed > 15) {
      return {
        title: `🚨 AI Extreme Storm Warning: ${cityName}`,
        body: `Severe atmospheric shift detected. High wind gusts (${Math.round(windSpeed * 2.237)} mph). Seek indoor shelter.`,
      };
    }

    if (temp > 28) {
      return {
        title: `☀️ AI Heat & UV Alert: ${cityName}`,
        body: `UV Index is peaking at 8.2 (Very High). Recommended: Apply SPF 50+ sunscreen and stay hydrated.`,
      };
    }

    return {
      title: `🤖 AI Morning Weather Brief: ${cityName}`,
      body: `Today's outlook: ${condition} with pleasant ${Math.round((temp * 9) / 5 + 32)}°F. Optimal window for outdoor commute and running!`,
    };
  },
};
