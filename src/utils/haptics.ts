import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const native = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptic = {
  tap: () => {
    if (native) Haptics.selectionAsync().catch(() => {});
  },
  soft: () => {
    if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  success: () => {
    if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning: () => {
    if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
};
