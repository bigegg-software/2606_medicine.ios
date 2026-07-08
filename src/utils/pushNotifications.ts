import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { updateExtrInfo } from '@/api/user';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  parseNotificationSettings,
  type NotificationSettings,
} from '@/src/utils/notificationSettingsHelpers';

let notificationSoundEnabled = true;

export function applyNotificationSettings(settings: NotificationSettings) {
  notificationSoundEnabled = settings.soundEnabled;
}

export function syncNotificationSettingsFromUserExtr(
  userExtr?: { isSendSysMsg?: number; params?: Record<string, unknown> } | null,
) {
  applyNotificationSettings(parseNotificationSettings(userExtr));
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: notificationSoundEnabled,
    shouldSetBadge: true,
  }),
});

export function normalizeDevicePushToken(token: string) {
  return token.replace(/[<>\s]/g, '').toLowerCase();
}

export async function registerIosPushToken() {
  if (Platform.OS !== 'ios') return null;

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    permission = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
  }

  if (permission.status !== 'granted') {
    if (__DEV__) {
      console.warn('[Push] permission not granted:', permission.status);
    }
    return null;
  }

  const { data } = await Notifications.getDevicePushTokenAsync();
  const token = normalizeDevicePushToken(typeof data === 'string' ? data : String(data ?? ''));
  if (!token) return null;

  const res = await updateExtrInfo({ iphoneDeviceToken: token });
  if (!isResourceApiOk(res as { code?: number })) {
    if (__DEV__) {
      console.warn('[Push] upload token failed:', (res as { msg?: string })?.msg);
    }
    return null;
  }

  if (__DEV__) {
    console.log('[Push] token uploaded:', token);
  }

  return token;
}

export function addPushNotificationListeners() {
  const receivedSub = Notifications.addNotificationReceivedListener(notification => {
    if (__DEV__) {
      console.log('[Push] received:', notification.request.content);
    }
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    if (__DEV__) {
      console.log('[Push] tapped:', response.notification.request.content);
    }
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
