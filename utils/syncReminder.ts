import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { getLatestWearableUploadTime } from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export const LAST_BACKGROUND_TIME_KEY = 'lastBackgroundTime';
export const SYNC_REMINDER_SHOWN_DATE_KEY = 'syncReminderShownDate';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export async function recordAppBackgroundTime() {
  await AsyncStorage.setItem(LAST_BACKGROUND_TIME_KEY, String(Date.now()));
}

export async function shouldShowSyncReminder(): Promise<{ shouldShow: boolean; today: string }> {
  const today = moment().format('YYYY-MM-DD');
  const now = Date.now();

  const lastBgTimeStr = await AsyncStorage.getItem(LAST_BACKGROUND_TIME_KEY);
  const lastBgTime = lastBgTimeStr ? Number(lastBgTimeStr) : null;
  if (!lastBgTime) {
    return { shouldShow: false, today };
  }

  const lastBgDate = moment(lastBgTime).format('YYYY-MM-DD');
  if (lastBgDate === today) {
    return { shouldShow: false, today };
  }

  if (now - lastBgTime < SIX_HOURS_MS) {
    return { shouldShow: false, today };
  }

  const res = await getLatestWearableUploadTime();
  const latestUploadTimestamp = isResourceApiOk(res as { code?: number })
    ? apiResourceData<string | number | null>(res as { code?: number; data?: string | number | null })
    : null;

  const lastUploadedDate = latestUploadTimestamp
    ? moment(latestUploadTimestamp).format('YYYY-MM-DD')
    : null;

  if (lastUploadedDate === today) {
    return { shouldShow: false, today };
  }

  const shownDate = await AsyncStorage.getItem(SYNC_REMINDER_SHOWN_DATE_KEY);
  if (shownDate === today) {
    return { shouldShow: false, today };
  }

  return { shouldShow: true, today };
}

export async function markSyncReminderShown(today: string) {
  await AsyncStorage.setItem(SYNC_REMINDER_SHOWN_DATE_KEY, today);
}
