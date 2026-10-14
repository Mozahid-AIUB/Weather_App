import { StatusBar } from 'react-native';
import type { ThemeMode } from '../theme/tokens';

/**
 * Re-applies the status bar icon colour. Android resets it to light after a Modal closes without
 * telling React Native, so dark icons would vanish on the cream daytime theme.
 */
export const applyStatusBar = (mode: ThemeMode, overDarkScreen = false) => {
  StatusBar.setBarStyle(overDarkScreen || mode === 'night' ? 'light-content' : 'dark-content', true);
};
