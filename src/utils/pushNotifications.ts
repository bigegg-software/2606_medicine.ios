import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { updateExtrInfo } from '@/api/user';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import { navigateWhenReady } from '@/utils/navigationRef';
import {
  parseNotificationSettings,
  type NotificationSettings,
} from '@/src/utils/notificationSettingsHelpers';

let notificationSoundEnabled = true;

const MEAL_TIP_TYPES = new Set([
  'health_diet_meal_tip',
  'health_diet_protein_streak_warning',
]);

const MEDICATION_TIP_TYPES = new Set([
  'health_medication_tip',
  'health_medication_remind_warning',
  'health_medication_missed_warning',
]);

const EXERCISE_TIP_TYPES = new Set([
  'health_exercise_streak_warning',
  'health_exercise_not_started_tip',
  'health_exercise_goal_complete_tip',
]);

const QUESTIONNAIRE_WARNING_TYPES = new Set([
  'health_fall_risk_warning',
  'health_daily_living_warning',
  'health_nutritional_risk_warning',
  'health_eq_index_warning',
]);

const ACTIVITY_TIP_TYPES = new Set([
  'activity_will_start_tip',
  'activity_change_notify',
]);

const LIVE_TIP_TYPES = new Set([
  'live_reservation_start_tip',
  'live_change_notify',
]);

const IGNORED_TAP_TYPES = new Set([
  'activiey_cancel',
]);

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

type PushPayloadData = {
  type?: unknown;
  bizId?: unknown;
  userId?: unknown;
  aps?: {
    type?: unknown;
    bizId?: unknown;
    userId?: unknown;
  };
};

function readPayloadValue(payload: unknown, key: 'type' | 'bizId' | 'userId') {
  if (!payload || typeof payload !== 'object') return undefined;
  const root = payload as PushPayloadData;
  const rootValue = root[key];
  if (rootValue != null && String(rootValue).trim()) {
    return String(rootValue).trim();
  }
  const apsValue = root.aps?.[key];
  if (apsValue != null && String(apsValue).trim()) {
    return String(apsValue).trim();
  }
  return undefined;
}

export function getNotificationPayload(notification: Notifications.Notification) {
  const contentData = notification.request.content.data;
  const trigger = notification.request.trigger;
  const triggerPayload = trigger && typeof trigger === 'object' && 'payload' in trigger
    ? (trigger as { payload?: unknown }).payload
    : undefined;

  const type = readPayloadValue(contentData, 'type')
    ?? readPayloadValue(triggerPayload, 'type');
  const bizId = readPayloadValue(contentData, 'bizId')
    ?? readPayloadValue(triggerPayload, 'bizId');
  const userId = readPayloadValue(contentData, 'userId')
    ?? readPayloadValue(triggerPayload, 'userId');

  return { type, bizId, userId };
}

export function handlePushNotificationNavigation(notification: Notifications.Notification) {
  const { type, bizId, userId } = getNotificationPayload(notification);
  if (!type || IGNORED_TAP_TYPES.has(type)) return;

  if (MEAL_TIP_TYPES.has(type)) {
    navigateWhenReady('NutritionPage', { tab: 'prescription' });
    return;
  }

  if (MEDICATION_TIP_TYPES.has(type)) {
    navigateWhenReady('Medication', { tab: 'medication' });
    return;
  }

  if (EXERCISE_TIP_TYPES.has(type)) {
    navigateWhenReady('MainTabs', { screen: 'Schedule' });
    return;
  }

  if (QUESTIONNAIRE_WARNING_TYPES.has(type)) {
    const parts = bizId
      ? bizId.split(':').map(part => part.trim()).filter(Boolean)
      : [];
    const questionId = parts.length > 1 ? (parts[parts.length - 1] ?? '') : (bizId ?? '');
    const patientUserId =
      userId
      || (parts.length >= 3 ? parts[1] : '');
    if (!questionId) {
      navigateWhenReady('QuestionnaireList');
      return;
    }
    navigateWhenReady('QuestionnaireDetail', {
      id: questionId,
      ...(patientUserId ? { patientUserId, readOnly: true } : {}),
    });
    return;
  }

  if (ACTIVITY_TIP_TYPES.has(type)) {
    if (!bizId) return;
    navigateWhenReady('ActivityDetail', { id: bizId });
    return;
  }

  if (LIVE_TIP_TYPES.has(type)) {
    if (!bizId) return;
    navigateWhenReady('LiveDetail', { liveId: bizId });
  }
}

export function addPushNotificationListeners() {
  const receivedSub = Notifications.addNotificationReceivedListener(notification => {
    if (__DEV__) {
      console.log('[Push] received:', getNotificationPayload(notification));
    }
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    if (__DEV__) {
      console.log('[Push] tapped:', getNotificationPayload(response.notification));
    }
    handlePushNotificationNavigation(response.notification);
  });

  void Notifications.getLastNotificationResponseAsync().then(response => {
    if (!response) return;
    handlePushNotificationNavigation(response.notification);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
