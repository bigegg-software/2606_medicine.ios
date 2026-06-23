import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import moment from 'moment';
import { Toast } from '@ant-design/react-native';
import { getLatestWearableUploadTime } from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import updateHealthKit from '@/utils/healthKit';

export async function checkAutoSyncOnLaunch(userId: string | number, autoSyncData?: number) {
  if (autoSyncData !== 1 || userId == null || userId === '') return;

  const today = moment().format('YYYY-MM-DD');
  const needSync = await AsyncStorage.getItem('needAutoSyncNextLaunch');

  try {
    const res = await getLatestWearableUploadTime();
    const latestUploadTimestamp = isResourceApiOk(res as { code?: number })
      ? apiResourceData<string | number | null>(res as { code?: number; data?: string | number | null })
      : null;

    const lastUploadedDate = latestUploadTimestamp
      ? moment(latestUploadTimestamp).format('YYYY-MM-DD')
      : null;

    const shouldSync = needSync === '1' || lastUploadedDate == null || lastUploadedDate !== today;

    if (!shouldSync) return;

    await AsyncStorage.removeItem('needAutoSyncNextLaunch');

    setTimeout(() => {
      if (AppState.currentState !== 'active') return;
      void updateHealthKit(null).then(syncRes => {
        if (syncRes && 'code' in syncRes && !isResourceApiOk(syncRes as { code?: number }) && (syncRes as { code?: number }).code !== 0) {
          const msg = (syncRes as { msg?: string }).msg;
          if (msg) Toast.show(msg);
        }
      });
    }, 2500);
  } catch (err: unknown) {
    const msg = err && typeof err === 'object' && 'msg' in err ? String((err as { msg?: string }).msg) : '';
    if (msg) Toast.show(msg);
  }
}
