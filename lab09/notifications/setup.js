import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const CHANNEL_ID = 'dam-lab9-reminders';

// Modulul este importat numai pe dispozitiv. Handler rapid, fără fetch sau stocare.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const isAllowed = settings => !!settings.granted ||
  settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

export async function ensureNotificationPermission() {
  if (Platform.OS === 'web') return { allowed: false, canAskAgain: false };
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Remindere laborator 9',
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
    });
  }
  let settings = await Notifications.getPermissionsAsync();
  if (!isAllowed(settings) && settings.canAskAgain !== false) {
    settings = await Notifications.requestPermissionsAsync();
  }
  return { allowed: isAllowed(settings), canAskAgain: settings.canAskAgain !== false };
}
