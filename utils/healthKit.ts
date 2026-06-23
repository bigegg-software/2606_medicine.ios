import moment from 'moment';
import { Alert, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleHealthKit from 'react-native-health';
import { getUserBaseInfo } from '@/api/patient';
import { uploadWearableData, type WearableUploadPayload } from '@/api/wearableData';
import store from '@/store/store';
import { SET_UPLOADING, SET_UPLOAD_PROGRESS } from '@/store/type/upload';
import filterData from '@/utils/filterData';
import { isResourceApiOk } from '@/src/utils/apiHelpers';

type HealthBatchItem = {
  type: string;
  data: WearableUploadPayload['data'];
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function chunkArray<T>(array: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

function toUploadPayload(item: HealthBatchItem, last = false): WearableUploadPayload {
  return {
    type: item.type,
    appType: 0,
    data: {
      ...item.data,
      last,
    },
  };
}

async function postBatch(item: HealthBatchItem, last = false) {
  return uploadWearableData(toUploadPayload(item, last));
}

export default async function updateHealthKit(syncDays: number | null = null) {
  if (Platform.OS !== 'ios') {
    Alert.alert('提示', '当前仅支持 iOS 健康数据同步');
    return;
  }

  const state = store.getState();
  if (state.upload.uploading) {
    return;
  }
  if (AppState.currentState !== 'active') {
    return;
  }

  const dispatch = store.dispatch;
  dispatch({ type: SET_UPLOADING, payload: true });
  dispatch({ type: SET_UPLOAD_PROGRESS, payload: 0 });

  const allResults: HealthBatchItem[] = [];
  const userRes = await getUserBaseInfo();
  const userId =
    (isResourceApiOk(userRes as { code?: number }) ? (userRes as { data?: { userId?: number } }).data?.userId : undefined) ??
    state.user.info?.userId ??
    (await AsyncStorage.getItem('userId'));
  const synWdataDays = syncDays ?? state.user.userExtr?.synWdataDays ?? 7;
  const loginExpired = state.login.loginExpired;
  const batchNum = generateUUID();

  return new Promise((resolve, reject) => {
    if (loginExpired) {
      dispatch({ type: SET_UPLOADING, payload: false });
      Alert.alert('提示', '登录已过期，请重新登录');
      resolve({ code: 401, msg: 'Login expired' });
      return;
    }

    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          AppleHealthKit.Constants.Permissions.RestingHeartRate,
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
          AppleHealthKit.Constants.Permissions.Electrocardiogram,
          AppleHealthKit.Constants.Permissions.HeartRateVariability,
          AppleHealthKit.Constants.Permissions.OxygenSaturation,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.AppleExerciseTime,
          AppleHealthKit.Constants.Permissions.HeartRate,
        ],
        write: [],
      },
    };

    const startTime = new Date(moment().format('YYYY-MM-DD')).getTime() - synWdataDays * 24 * 60 * 60 * 1000;
    const endTime = new Date(moment().format('YYYY-MM-DD')).getTime();
    const dayCount = Math.ceil((endTime - startTime) / (24 * 60 * 60 * 1000));
    const totalRequests = (dayCount + 1) * 11;
    let completedRequests = 0;
    let uploadedCount = 0;

    async function processResults() {
      if (store.getState().login.loginExpired) {
        dispatch({ type: SET_UPLOADING, payload: false });
        return;
      }

      try {
        const startData = allResults.slice(0, -1);
        const endData = allResults.at(-1);
        const batches = chunkArray(startData, 5);
        const today = moment().format('YYYY-MM-DD');
        const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
        const totalUploads = Math.max(allResults.length, 1);

        for (const batch of batches) {
          for (const item of batch) {
            try {
              const date = moment(item.data.startTime).format('YYYY-MM-DD');
              const cacheKey = `${userId}_${item.type}_${date}`;

              if (date === today || date === yesterday) {
                await postBatch(item);
                await AsyncStorage.setItem(cacheKey, 'true');
              } else {
                const isCached = await AsyncStorage.getItem(cacheKey);
                if (!isCached) {
                  await postBatch(item);
                  await AsyncStorage.setItem(cacheKey, 'true');
                }
              }

              uploadedCount += 1;
              dispatch({
                type: SET_UPLOAD_PROGRESS,
                payload: Math.min(99, Math.round((uploadedCount / totalUploads) * 100)),
              });
            } catch (err) {
              console.error('Error uploading batch:', err);
            }
          }
        }

        if (endData) {
          const date = moment(endData.data.startTime).format('YYYY-MM-DD');
          const cacheKey = `${userId}_${endData.type}_${date}`;
          const res = await postBatch(endData, true);
          await AsyncStorage.setItem(cacheKey, 'true');
          dispatch({ type: SET_UPLOAD_PROGRESS, payload: 100 });
          resolve(res);
          return;
        }

        dispatch({ type: SET_UPLOAD_PROGRESS, payload: 100 });
        resolve({ code: 1, msg: '' });
      } catch (error) {
        console.error('Upload failed:', error);
        reject(error);
      } finally {
        dispatch({ type: SET_UPLOADING, payload: false });
      }
    }

    function checkAllCompleted() {
      if (store.getState().login.loginExpired) {
        dispatch({ type: SET_UPLOADING, payload: false });
        return;
      }
      if (completedRequests === totalRequests) {
        if (allResults.length === 0) {
          dispatch({ type: SET_UPLOADING, payload: false });
          Alert.alert('提示', '暂无可同步的健康数据');
          resolve({ code: 0, msg: 'no data' });
          return;
        }
        void processResults();
      }
    }

    AppleHealthKit.initHealthKit(permissions, error => {
      if (error) {
        console.error('Error initializing Apple HealthKit:', error);
        dispatch({ type: SET_UPLOADING, payload: false });
        Alert.alert('提示', '无法访问 Apple 健康，请检查权限设置');
        reject(new Error(error));
        return;
      }

      for (let i = 0; i <= dayCount; i += 1) {
        const dayStartTime = startTime + i * 24 * 60 * 60 * 1000;
        const sleepStart = dayStartTime - 11 * 60 * 60 * 1000;
        const sleepEnd = dayStartTime + 13 * 60 * 60 * 1000;
        const day = moment(dayStartTime);
        const baseOptions = {
          startDate: day.clone().startOf('day').toISOString(),
          endDate: day.clone().endOf('day').toISOString(),
        };
        const formatRange = (start: string | number, end: string | number) => ({
          startTime: moment(new Date(start)).format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
          endTime: moment(new Date(end)).format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
        });

        AppleHealthKit.getRestingHeartRate(baseOptions, (_err, results: any) => {
          if (results.length > 0) {
            allResults.push({
              type: 'restingHeartRate',
              data: {
                batchNum,
                origin: filterData(results),
                ...formatRange(baseOptions.startDate, baseOptions.endDate),
              },
            });
          }
          completedRequests += 1;
          checkAllCompleted();
        });

        AppleHealthKit.getSleepSamples(
          { startDate: new Date(sleepStart).toISOString(), endDate: new Date(sleepEnd).toISOString() },
          (_err, results) => {
            if (results.length > 0) {
              allResults.push({
                type: 'sleepAnalysis',
                data: {
                  batchNum,
                  origin: filterData(results),
                  startTime: moment(moment(new Date(sleepStart)).format('YYYY-MM-DD') + ' 21:00:00').format(
                    'YYYY-MM-DDTHH:mm:ss.SSSZZ',
                  ),
                  endTime: moment(moment(new Date(sleepEnd)).format('YYYY-MM-DD') + ' 21:00:00').format(
                    'YYYY-MM-DDTHH:mm:ss.SSSZZ',
                  ),
                },
              });
            }
            completedRequests += 1;
            checkAllCompleted();
          },
        );

        AppleHealthKit.getBasalEnergyBurned(baseOptions, (_err, results) => {
          if (results.length > 0) {
            allResults.push({
              type: 'basalEnergyBurned',
              data: {
                batchNum,
                origin: filterData(results),
                ...formatRange(baseOptions.startDate, baseOptions.endDate),
              },
            });
          }
          completedRequests += 1;
          checkAllCompleted();
        });

        AppleHealthKit.getDailyStepCountSamples(baseOptions, (_err, results) => {
          if (results?.length > 0) {
            allResults.push({
              type: 'stepCount',
              data: {
                batchNum,
                origin: filterData(results),
                ...formatRange(baseOptions.startDate, baseOptions.endDate),
              },
            });
          }
          completedRequests += 1;
          checkAllCompleted();
        });

        AppleHealthKit.getElectrocardiogramSamples(baseOptions, (_err, results) => {
          if (results.length > 0) {
            allResults.push({
              type: 'electrocardiogram',
              data: {
                batchNum,
                origin: results,
                ...formatRange(baseOptions.startDate, baseOptions.endDate),
              },
            });
          }
          completedRequests += 1;
          checkAllCompleted();
        });

        AppleHealthKit.getHeartRateVariabilitySamples(baseOptions, (_err, results) => {
          if (results.length > 0) {
            allResults.push({
              type: 'heartRateVariability',
              data: {
                batchNum,
                origin: filterData(results),
                ...formatRange(baseOptions.startDate, baseOptions.endDate),
              },
            });
          }
          completedRequests += 1;
          checkAllCompleted();
        });

        AppleHealthKit.getOxygenSaturationSamples(baseOptions, (_err, results) => {
          if (results.length > 0) {
            allResults.push({
              type: 'oxygenSaturation',
              data: {
                batchNum,
                origin: filterData(results),
                ...formatRange(baseOptions.startDate, baseOptions.endDate),
              },
            });
          }
          completedRequests += 1;
          checkAllCompleted();
        });

        AppleHealthKit.getDistanceWalkingRunning({ date: new Date(dayStartTime).toISOString() }, (_err, results) => {
          if (Number(results.value) > 0) {
            allResults.push({
              type: 'distanceWalkingRunning',
              data: {
                batchNum,
                origin: [filterData(results)],
                ...formatRange(baseOptions.startDate, baseOptions.endDate),
              },
            });
          }
          completedRequests += 1;
          checkAllCompleted();
        });

        AppleHealthKit.getActiveEnergyBurned(baseOptions, (_err, results) => {
          if (results.length > 0) {
            allResults.push({
              type: 'activeEnergyBurned',
              data: {
                batchNum,
                origin: filterData(results),
                ...formatRange(baseOptions.startDate, baseOptions.endDate),
              },
            });
          }
          completedRequests += 1;
          checkAllCompleted();
        });

        AppleHealthKit.getAppleExerciseTime(baseOptions, (_err, results) => {
          if (results.length > 0) {
            allResults.push({
              type: 'appleExerciseTime',
              data: {
                batchNum,
                origin: filterData(results),
                ...formatRange(baseOptions.startDate, baseOptions.endDate),
              },
            });
          }
          completedRequests += 1;
          checkAllCompleted();
        });

        AppleHealthKit.getHeartRateSamples(baseOptions, (_err, results) => {
          if (results?.length > 0) {
            allResults.push({
              type: 'heartRate',
              data: {
                batchNum,
                origin: filterData(results),
                ...formatRange(baseOptions.startDate, baseOptions.endDate),
              },
            });
          }
          completedRequests += 1;
          checkAllCompleted();
        });
      }
    });
  });
}
