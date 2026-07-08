import type { UserExtr } from '@/api/user';

const PARAM_SOUND_KEY = 'notificationSound';
const PARAM_VIBRATION_KEY = 'notificationVibration';

export type NotificationSettings = {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

export function parseNotificationSettings(userExtr?: UserExtr | null): NotificationSettings {
  const params = userExtr?.params ?? {};

  return {
    enabled: userExtr?.isSendSysMsg !== 0,
    soundEnabled: params[PARAM_SOUND_KEY] !== 0,
    vibrationEnabled: params[PARAM_VIBRATION_KEY] === 1,
  };
}

export function buildNotificationSettingsPayload(
  settings: NotificationSettings,
  currentParams?: Record<string, unknown>,
) {
  return {
    isSendSysMsg: settings.enabled ? 1 : 0,
    params: {
      ...currentParams,
      [PARAM_SOUND_KEY]: settings.soundEnabled ? 1 : 0,
      [PARAM_VIBRATION_KEY]: settings.vibrationEnabled ? 1 : 0,
    },
  };
}
