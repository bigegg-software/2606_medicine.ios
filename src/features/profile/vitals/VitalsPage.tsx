import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, DeviceEventEmitter, type ImageSourcePropType } from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import GoalTargetModal from './components/GoalTargetModal';
import SyncDaysPickerModal from './components/SyncDaysPickerModal';
import AutoSyncPromptModal from './components/AutoSyncPromptModal';
import { useDispatch, useSelector } from 'react-redux';
import styles from '@/css/vitals/index';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '@/route/router';
import {
  resolveVitalsViewMode,
  withVitalsViewParams,
} from '@/src/features/profile/vitals/utils/vitalsViewMode';
import { AppTheme } from '@/common/theme';
import updateHealthKit, { HEALTH_KIT_SYNC_COMPLETED } from '@/utils/healthKit';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';
import BloodPressureChart from '../components/BloodPressureChart';
import BloodGlucoseChart from '../components/BloodGlucoseChart';
import BloodOxygenChart from '../components/BloodOxygenChart';
import BodyTemperatureChart from '../components/BodyTemperatureChart';
import BloodLipidChart from '../components/BloodLipidChart';
import HeartRateChart from '../components/HeartRateChart';
import WeightChart from '../components/WeightChart';
import UricAcidChart from '../components/UricAcidChart';
import {
  formatWeightFromItemsForVitals,
  formatWeightVitalsDisplay,
} from './detail/helpers/weight';
import SleepStageChart from '../components/SleepStageChart';
import SleepBarChart from '../components/SleepBarChart';
import StepsChart from '../components/StepsChart';
import {
  getMeasureDataDetailByDate,
  getMeasureDataDetailByDateRange,
  getMeasureDataLatestByType,
  type MeasureDataDetailResult,
  type MeasureDataItem,
  type MeasureDataLatestResult,
  type MeasureDataRangeDetailResult,
  type MeasureDataType,
  type VitalKey,
  VITAL_KEY_API_TYPE,
} from '@/api/measureData';
import {
  getWearableDataDetailByDateRange,
  getWearableDataLatestByType,
  WEARABLE_DATA_TYPES,
  type WearableDataItem,
  type WearableDataDetailResult,
  type WearableDataRangeResult,
  type WearableDataType,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { updateExtrInfo } from '@/api/user';
import {
  getGoalSaveErrorMessage,
  getGoalSaveSuccessMessage,
  resolveEnergyTarget,
  resolveSleepTargetHours,
  resolveStepTarget,
  saveVitalsGoalTarget,
} from './detail/helpers/vitalsGoalTargets';
import {
  VITALS_NAV_LIST,
  buildBloodPressureSeriesFromItems,
  buildBloodGlucoseSeriesFromItems,
  buildSingleValueSeries,
  buildWearableHeartRateSeries,
  buildWearableOxygenSeries,
  flattenMeasureItems,
  formatBloodPressureFromItems,
  formatSingleValueFromItems,
  formatUricAcidFromItems,
  formatBloodLipidsFromItems,
  formatBloodOxygenFromItem,
  formatBodyTemperatureDisplay,
  formatHeartRateFromItem,
  formatMeasureDataTime,
  formatMeasureDisplay,
  getLatestMeasureDataTime,
  getHeartRateDisplayDataTime,
  getBloodOxygenDisplayDataTime,
  getStepsDisplayDataTime,
  getSleepDisplayDataTime,
  normalizeMeasureRangeData,
  getBloodOxygenDisplay,
  getChartLabels,
  getDateRange,
  getEnergySummary,
  getEnergyDisplayDataTime,
  pickWearableTodayOrDataDayItems,
  getHeartRateDisplay,
  getSleepFetchDateRange,
  getSleepSummary,
  getStepsSummary,
  getLatestWearableItem,
  wrapWearableLatestItem,
  getWearableReturnOriginalDataParam,
  sortWearableItems,
  toHourPoints,
  buildBloodLipidTcSeries,
  VITAL_KEYS,
  type VitalsRange,
} from './vitalsHelpers';
import {
  formatVitalsSortStatus,
  resolveVitalsDisplayOrder,
  type VitalIndexKey,
  type VitalsSortItem,
} from './vitalsSortHelpers';
import FamilyRelationHeaderBadge from '@/src/familyPage/components/FamilyRelationHeaderBadge';

const EMPTY_MEASURE_DATA: Record<VitalKey, MeasureDataItem[]> = {
  bloodPressure: [],
  bloodGlucose: [],
  bodyTemperature: [],
  uricAcid: [],
  bloodLipids: [],
};

type LatestMeasureData = Partial<Record<VitalKey, MeasureDataItem>>;

const DEFAULT_SLEEP_TARGET_HOURS = 8;
const DEFAULT_STEP_TARGET = 10000;
const DEFAULT_ENERGY_TARGET = 2000;
const ENERGY_GOAL_MAX = 5000;

export default function VitalsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation: any = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'VitalsPage'>>();
  const { readOnly, patientUserId, relationLabel, viewNavParams } = resolveVitalsViewMode(route.params);
  const insets = useSafeAreaInsets();
  const uploading = useSelector((state: RootState) => state.upload.uploading);
  const userGender = useSelector((state: RootState) => state.user.info?.gender);
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const synWdataDays = userExtr?.synWdataDays ?? 0;
  const [activeNav, setActiveNav] = useState<VitalsRange>('today');
  const [loading, setLoading] = useState(true);
  const [measureData, setMeasureData] = useState<Record<VitalKey, MeasureDataItem[]>>(EMPTY_MEASURE_DATA);
  const [latestMeasure, setLatestMeasure] = useState<LatestMeasureData>({});
  const [weightData, setWeightData] = useState<MeasureDataItem[]>([]);
  const [latestWeight, setLatestWeight] = useState<MeasureDataItem | undefined>();
  const [wearableSleep, setWearableSleep] = useState<WearableDataItem[]>([]);
  const [wearableSteps, setWearableSteps] = useState<WearableDataItem[]>([]);
  const [wearableOxygen, setWearableOxygen] = useState<WearableDataItem[]>([]);
  const [wearableHeartRate, setWearableHeartRate] = useState<WearableDataItem[]>([]);
  const [wearableActiveEnergy, setWearableActiveEnergy] = useState<WearableDataItem[]>([]);
  const [showSleepTargetModal, setShowSleepTargetModal] = useState(false);
  const [showStepTargetModal, setShowStepTargetModal] = useState(false);
  const [showEnergyTargetModal, setShowEnergyTargetModal] = useState(false);
  const [sleepTarget, setSleepTarget] = useState(DEFAULT_SLEEP_TARGET_HOURS);
  const [stepTarget, setStepTarget] = useState(DEFAULT_STEP_TARGET);
  const [energyTarget, setEnergyTarget] = useState(DEFAULT_ENERGY_TARGET);
  const [savingSleep, setSavingSleep] = useState(false);
  const [savingStep, setSavingStep] = useState(false);
  const [savingEnergy, setSavingEnergy] = useState(false);
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [autoSyncPromptVisible, setAutoSyncPromptVisible] = useState(false);
  const [savingSynWdataDays, setSavingSynWdataDays] = useState(false);
  const pendingSyncDaysRef = useRef<number | null>(null);
  const syncAfterDayPickerRef = useRef(false);
  const promptAutoSyncAfterSyncRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);
  const prevActiveNavRef = useRef(activeNav);
  const prevPatientUserIdRef = useRef(patientUserId);

  useEffect(() => {
    if (userExtr?.sleepGoals != null && userExtr.sleepGoals > 0) {
      setSleepTarget(resolveSleepTargetHours(userExtr.sleepGoals));
    }
    if (userExtr?.stepGoals != null && userExtr.stepGoals >= 0) {
      setStepTarget(resolveStepTarget(userExtr.stepGoals));
    }
    if (userExtr?.energyGoals != null && userExtr.energyGoals >= 0) {
      setEnergyTarget(resolveEnergyTarget(userExtr.energyGoals));
    }
  }, [userExtr?.sleepGoals, userExtr?.stepGoals, userExtr?.energyGoals]);

  const chartLabels = useMemo(() => getChartLabels(activeNav), [activeNav]);

  const loadMeasureData = useCallback(async (mode: 'initial' | 'silent' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    }
    const { startDate, endDate } = getDateRange(activeNav);

    const patientOpts = patientUserId ? { patientUserId } : undefined;

    const fetchWearableItems = async (type: WearableDataType, dateRange = { startDate, endDate }) => {
      try {
        const res = (await getWearableDataDetailByDateRange({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          type,
          ...getWearableReturnOriginalDataParam(activeNav),
        }, patientOpts)) as unknown as WearableDataRangeResult;
        if (!isResourceApiOk(res)) return [];
        const data = apiResourceData<WearableDataItem[]>(res);
        return sortWearableItems(Array.isArray(data) ? data : []);
      } catch {
        return [];
      }
    };

    const fetchLatestMeasure = async (type: MeasureDataType) => {
      try {
        const res = (await getMeasureDataLatestByType(type, patientOpts)) as unknown as MeasureDataLatestResult;
        if (!isResourceApiOk(res)) return undefined;
        return apiResourceData<MeasureDataItem>(res);
      } catch {
        return undefined;
      }
    };

    const fetchLatestWearable = async (type: WearableDataType) => {
      try {
        const res = (await getWearableDataLatestByType(type, patientOpts)) as unknown as WearableDataDetailResult;
        if (!isResourceApiOk(res)) return undefined;
        return apiResourceData<WearableDataItem>(res);
      } catch {
        return undefined;
      }
    };

    const fetchMeasureLatestAndDayItems = async (type: MeasureDataType) => {
      const latest = await fetchLatestMeasure(type);
      const latestDate = latest?.customerLocalDate?.trim();
      if (!latestDate) {
        return { latest, chartItems: latest ? [latest] : [] };
      }

      try {
        const res = (await getMeasureDataDetailByDate({
          customerLocalDate: latestDate,
          type,
        }, patientOpts)) as unknown as MeasureDataDetailResult;
        if (!isResourceApiOk(res)) {
          return { latest, chartItems: latest ? [latest] : [] };
        }
        const items = flattenMeasureItems(apiResourceData<MeasureDataItem[]>(res));
        return { latest, chartItems: items.length ? items : latest ? [latest] : [] };
      } catch {
        return { latest, chartItems: latest ? [latest] : [] };
      }
    };

    const fetchWearableLatestAndDayItems = async (type: WearableDataType) => {
      const latest = await fetchLatestWearable(type);
      const latestDate = latest?.customerLocalDate?.trim() || latest?.dataDate?.slice(0, 10);
      if (!latestDate) {
        return { latest, dayItems: latest ? [latest] : [] };
      }

      const dayItems = await fetchWearableItems(type, { startDate: latestDate, endDate: latestDate });
      return {
        latest,
        dayItems: dayItems.length ? dayItems : latest ? [latest] : [],
      };
    };

    const sleepDateRange = getSleepFetchDateRange(activeNav);

    try {
      if (activeNav === 'today') {
        const [
          measureResults,
          weightResult,
          latestSleep,
          latestSteps,
          stepsDayItems,
          latestOxygen,
          latestHeartRate,
          activeEnergyResult,
        ] = await Promise.all([
          Promise.all(
            VITAL_KEYS.map(async key => {
              const result = await fetchMeasureLatestAndDayItems(VITAL_KEY_API_TYPE[key]);
              return [key, result] as const;
            }),
          ),
          fetchMeasureLatestAndDayItems('体重'),
          fetchLatestWearable(WEARABLE_DATA_TYPES.sleep),
          fetchLatestWearable(WEARABLE_DATA_TYPES.steps),
          fetchWearableItems(WEARABLE_DATA_TYPES.steps),
          fetchLatestWearable(WEARABLE_DATA_TYPES.oxygen),
          fetchLatestWearable(WEARABLE_DATA_TYPES.heartRate),
          // 仅活动能量；不请求 basalEnergyBurned
          fetchWearableLatestAndDayItems(WEARABLE_DATA_TYPES.activeEnergy),
        ]);

        setMeasureData({
          ...EMPTY_MEASURE_DATA,
          ...(Object.fromEntries(
            measureResults.map(([key, result]) => [key, result.chartItems]),
          ) as Record<VitalKey, MeasureDataItem[]>),
        });
        setLatestMeasure(
          Object.fromEntries(measureResults.map(([key, result]) => [key, result.latest])) as LatestMeasureData,
        );
        setWeightData(weightResult.chartItems);
        setLatestWeight(weightResult.latest);
        setWearableSleep(wrapWearableLatestItem(latestSleep));
        setWearableSteps(stepsDayItems.length ? stepsDayItems : wrapWearableLatestItem(latestSteps));
        setWearableOxygen(wrapWearableLatestItem(latestOxygen));
        setWearableHeartRate(wrapWearableLatestItem(latestHeartRate));
        setWearableActiveEnergy(pickWearableTodayOrDataDayItems(activeEnergyResult.dayItems, activeEnergyResult.latest));
      } else {
        setLatestMeasure({});
        setLatestWeight(undefined);
        const [
          measureEntries,
          weightRangeItems,
          sleepItems,
          stepsItems,
          oxygenItems,
          heartRateItems,
          activeEnergyItems,
        ] = await Promise.all([
          Promise.all(
            VITAL_KEYS.map(async key => {
              try {
                const res = (await getMeasureDataDetailByDateRange({
                  startDate,
                  endDate,
                  type: VITAL_KEY_API_TYPE[key],
                }, patientOpts)) as unknown as MeasureDataRangeDetailResult;
                if (!isResourceApiOk(res)) {
                  return [key, []] as const;
                }
                const groups = normalizeMeasureRangeData(apiResourceData<unknown>(res));
                return [key, flattenMeasureItems(groups)] as const;
              } catch {
                return [key, []] as const;
              }
            }),
          ),
          (async () => {
            try {
              const res = (await getMeasureDataDetailByDateRange({
                startDate,
                endDate,
                type: '体重',
              }, patientOpts)) as unknown as MeasureDataRangeDetailResult;
              if (!isResourceApiOk(res)) return [];
              const groups = normalizeMeasureRangeData(apiResourceData<unknown>(res));
              return flattenMeasureItems(groups);
            } catch {
              return [];
            }
          })(),
          fetchWearableItems(WEARABLE_DATA_TYPES.sleep, sleepDateRange),
          fetchWearableItems(WEARABLE_DATA_TYPES.steps),
          fetchWearableItems(WEARABLE_DATA_TYPES.oxygen),
          fetchWearableItems(WEARABLE_DATA_TYPES.heartRate),
          fetchWearableItems(WEARABLE_DATA_TYPES.activeEnergy),
        ]);

        setMeasureData({
          ...EMPTY_MEASURE_DATA,
          ...(Object.fromEntries(measureEntries) as Record<VitalKey, MeasureDataItem[]>),
        });
        setWeightData(weightRangeItems);
        setWearableSleep(sleepItems);
        setWearableSteps(stepsItems);
        setWearableOxygen(oxygenItems);
        setWearableHeartRate(heartRateItems);
        setWearableActiveEnergy(activeEnergyItems);
      }
    } finally {
      hasLoadedOnceRef.current = true;
      if (mode === 'initial') {
        setLoading(false);
      }
    }
  }, [activeNav, patientUserId]);

  const loadMeasureDataRef = useRef(loadMeasureData);
  loadMeasureDataRef.current = loadMeasureData;

  useFocusEffect(
    useCallback(() => {
      void loadMeasureDataRef.current(hasLoadedOnceRef.current ? 'silent' : 'initial');

      // 同步上传完成后，仅在本页有焦点时刷新体征数据
      const sub = DeviceEventEmitter.addListener(HEALTH_KIT_SYNC_COMPLETED, () => {
        void loadMeasureDataRef.current('silent');
      });
      return () => sub.remove();
    }, []),
  );

  useEffect(() => {
    if (prevActiveNavRef.current === activeNav) return;
    prevActiveNavRef.current = activeNav;
    if (!hasLoadedOnceRef.current) return;
    void loadMeasureData('initial');
  }, [activeNav, loadMeasureData]);

  /** 右上角切换家人后刷新当前展示的体征数据。 */
  useEffect(() => {
    if (!readOnly || prevPatientUserIdRef.current === patientUserId) return;
    prevPatientUserIdRef.current = patientUserId;
    void loadMeasureData('initial');
  }, [loadMeasureData, patientUserId, readOnly]);

  const bloodPressureSeries = useMemo(
    () => buildBloodPressureSeriesFromItems(measureData.bloodPressure, activeNav),
    [measureData.bloodPressure, activeNav],
  );
  const bloodPressure = useMemo(
    () =>
      activeNav === 'today' && latestMeasure.bloodPressure
        ? formatMeasureDisplay(latestMeasure.bloodPressure, '血压')
        : formatBloodPressureFromItems(measureData.bloodPressure, activeNav),
    [activeNav, latestMeasure.bloodPressure, measureData.bloodPressure],
  );
  const bloodPressureDataTime = useMemo(
    () =>
      activeNav === 'today'
        ? formatMeasureDataTime(latestMeasure.bloodPressure)
        : getLatestMeasureDataTime(measureData.bloodPressure, activeNav),
    [activeNav, latestMeasure.bloodPressure, measureData.bloodPressure],
  );

  const glucoseSeries = useMemo(
    () => buildBloodGlucoseSeriesFromItems(measureData.bloodGlucose, activeNav),
    [measureData.bloodGlucose, activeNav],
  );
  const glucose = useMemo(
    () =>
      activeNav === 'today' && latestMeasure.bloodGlucose
        ? formatMeasureDisplay(latestMeasure.bloodGlucose, '血糖')
        : formatSingleValueFromItems(measureData.bloodGlucose, '血糖', activeNav),
    [activeNav, latestMeasure.bloodGlucose, measureData.bloodGlucose],
  );
  const glucoseDataTime = useMemo(
    () =>
      activeNav === 'today'
        ? formatMeasureDataTime(latestMeasure.bloodGlucose)
        : getLatestMeasureDataTime(measureData.bloodGlucose, activeNav),
    [activeNav, latestMeasure.bloodGlucose, measureData.bloodGlucose],
  );

  const heartRateSeries = useMemo(
    () => buildWearableHeartRateSeries(wearableHeartRate, activeNav),
    [wearableHeartRate, activeNav],
  );
  const heartRate = useMemo(
    () =>
      activeNav === 'today'
        ? formatHeartRateFromItem(getLatestWearableItem(wearableHeartRate))
        : getHeartRateDisplay(wearableHeartRate),
    [activeNav, wearableHeartRate],
  );
  const heartRateDataTime = useMemo(
    () => getHeartRateDisplayDataTime(wearableHeartRate, activeNav),
    [wearableHeartRate, activeNav],
  );

  const sleepSummary = useMemo(
    () => getSleepSummary(wearableSleep, activeNav),
    [wearableSleep, activeNav],
  );
  const sleepChartTimeline = useMemo(
    () => sleepSummary.stageTimeline,
    [sleepSummary.stageTimeline],
  );
  const sleepDataTime = useMemo(
    () => getSleepDisplayDataTime(wearableSleep, activeNav),
    [wearableSleep, activeNav],
  );
  const stepsSummary = useMemo(
    () => getStepsSummary(wearableSteps, activeNav, stepTarget),
    [wearableSteps, activeNav, stepTarget],
  );
  const energySummary = useMemo(
    () => getEnergySummary(wearableActiveEnergy, [], activeNav, energyTarget),
    [wearableActiveEnergy, activeNav, energyTarget],
  );
  const stepsBarData = useMemo(
    () => stepsSummary.barSeries.map(item => ({ label: item.label, value: item.value })),
    [stepsSummary.barSeries],
  );
  const stepsDataTime = useMemo(
    () => getStepsDisplayDataTime(wearableSteps, activeNav),
    [wearableSteps, activeNav],
  );
  const stepsChart = useMemo(
    () => <StepsChart data={stepsBarData} hideXAxis />,
    [stepsBarData],
  );
  const energyBarData = useMemo(
    () => energySummary.barSeries.map(item => ({ label: item.label, value: item.value })),
    [energySummary.barSeries],
  );
  const energyDataTime = useMemo(
    () => getEnergyDisplayDataTime(wearableActiveEnergy, [], activeNav),
    [wearableActiveEnergy, activeNav],
  );
  const energyChart = useMemo(
    () => <StepsChart data={energyBarData} hideXAxis metricLabel="活动消耗" valueUnit="千卡" />,
    [energyBarData],
  );
  const sleepBarData = useMemo(
    () => sleepSummary.barSeries.map(item => ({ label: item.label, value: item.value })),
    [sleepSummary.barSeries],
  );
  const sleepChart = useMemo(
    () => (
      activeNav === 'today'
        ? <SleepStageChart data={sleepChartTimeline} />
        : <SleepBarChart data={sleepBarData} />
    ),
    [activeNav, sleepBarData, sleepChartTimeline],
  );

  const bloodOxygenSeries = useMemo(
    () => buildWearableOxygenSeries(wearableOxygen, activeNav),
    [wearableOxygen, activeNav],
  );
  const bloodOxygen = useMemo(
    () =>
      activeNav === 'today'
        ? formatBloodOxygenFromItem(getLatestWearableItem(wearableOxygen))
        : getBloodOxygenDisplay(wearableOxygen),
    [activeNav, wearableOxygen],
  );
  const bloodOxygenDataTime = useMemo(
    () => getBloodOxygenDisplayDataTime(wearableOxygen, activeNav),
    [wearableOxygen, activeNav],
  );

  const bodyTemperatureSeries = useMemo(
    () => buildSingleValueSeries(measureData.bodyTemperature, activeNav),
    [measureData.bodyTemperature, activeNav],
  );
  const bodyTemperature = useMemo(
    () =>
      activeNav === 'today' && latestMeasure.bodyTemperature
        ? formatBodyTemperatureDisplay(latestMeasure.bodyTemperature)
        : formatSingleValueFromItems(measureData.bodyTemperature, '体温', activeNav),
    [activeNav, latestMeasure.bodyTemperature, measureData.bodyTemperature],
  );
  const bodyTemperatureDataTime = useMemo(
    () =>
      activeNav === 'today'
        ? formatMeasureDataTime(latestMeasure.bodyTemperature)
        : getLatestMeasureDataTime(measureData.bodyTemperature, activeNav),
    [activeNav, latestMeasure.bodyTemperature, measureData.bodyTemperature],
  );

  const uricAcid = useMemo(
    () =>
      activeNav === 'today' && latestMeasure.uricAcid
        ? formatUricAcidFromItems([latestMeasure.uricAcid], activeNav, userGender)
        : formatUricAcidFromItems(measureData.uricAcid, activeNav, userGender),
    [activeNav, latestMeasure.uricAcid, measureData.uricAcid, userGender],
  );
  const uricAcidSeries = useMemo(
    () => buildSingleValueSeries(measureData.uricAcid, activeNav),
    [measureData.uricAcid, activeNav],
  );
  const uricAcidDataTime = useMemo(
    () =>
      activeNav === 'today'
        ? formatMeasureDataTime(latestMeasure.uricAcid)
        : getLatestMeasureDataTime(measureData.uricAcid, activeNav),
    [activeNav, latestMeasure.uricAcid, measureData.uricAcid],
  );

  const bloodLipids = useMemo(
    () =>
      activeNav === 'today' && latestMeasure.bloodLipids
        ? formatBloodLipidsFromItems([latestMeasure.bloodLipids], activeNav)
        : formatBloodLipidsFromItems(measureData.bloodLipids, activeNav),
    [activeNav, latestMeasure.bloodLipids, measureData.bloodLipids],
  );
  const bloodLipidsSeries = useMemo(
    () => buildBloodLipidTcSeries(measureData.bloodLipids, activeNav),
    [measureData.bloodLipids, activeNav],
  );
  const bloodLipidsDataTime = useMemo(
    () =>
      activeNav === 'today'
        ? formatMeasureDataTime(latestMeasure.bloodLipids)
        : getLatestMeasureDataTime(measureData.bloodLipids, activeNav),
    [activeNav, latestMeasure.bloodLipids, measureData.bloodLipids],
  );

  const weightSeries = useMemo(
    () => buildSingleValueSeries(weightData, activeNav),
    [weightData, activeNav],
  );
  const weight = useMemo(
    () =>
      activeNav === 'today' && latestWeight
        ? formatWeightVitalsDisplay(latestWeight)
        : formatWeightFromItemsForVitals(weightData, activeNav),
    [activeNav, latestWeight, weightData],
  );
  const weightDataTime = useMemo(
    () =>
      activeNav === 'today'
        ? formatMeasureDataTime(latestWeight)
        : getLatestMeasureDataTime(weightData, activeNav),
    [activeNav, latestWeight, weightData],
  );

  const orderedVitalKeys = useMemo(
    () => resolveVitalsDisplayOrder(readOnly ? undefined : userExtr?.healthIndexShowList),
    [readOnly, userExtr?.healthIndexShowList],
  );

  const vitalsSortItems = useMemo<VitalsSortItem[]>(() => {
    const statusMap: Record<VitalIndexKey, VitalsSortItem> = {
      心率: { key: '心率', status: heartRate.status, statusColor: heartRate.statusColor },
      消耗: { key: '消耗', status: energySummary.status, statusColor: energySummary.statusColor },
      血糖: { key: '血糖', status: glucose.status, statusColor: glucose.statusColor },
      血压: { key: '血压', status: bloodPressure.status, statusColor: bloodPressure.statusColor },
      步数: { key: '步数', status: stepsSummary.status, statusColor: stepsSummary.statusColor },
      睡眠: { key: '睡眠', status: sleepSummary.quality.label, statusColor: sleepSummary.quality.color },
      血氧: { key: '血氧', status: bloodOxygen.status, statusColor: bloodOxygen.statusColor },
      体温: { key: '体温', status: bodyTemperature.status, statusColor: bodyTemperature.statusColor },
      体重: { key: '体重', status: weight.status, statusColor: weight.statusColor },
      血脂: {
        key: '血脂',
        status: bloodLipids.tcStatus,
        statusColor: bloodLipids.tcStatusColor,
      },
      尿酸: { key: '尿酸', status: uricAcid.statusLabel, statusColor: uricAcid.statusColor },
    };
    return orderedVitalKeys.map(key => {
      const raw = statusMap[key];
      const status = formatVitalsSortStatus(raw.status);
      return {
        ...raw,
        status,
        statusColor: status === '暂无数据' ? '#999999' : raw.statusColor,
      };
    });
  }, [
    orderedVitalKeys,
    heartRate.status,
    heartRate.statusColor,
    energySummary.status,
    energySummary.statusColor,
    glucose.status,
    glucose.statusColor,
    bloodPressure.status,
    bloodPressure.statusColor,
    stepsSummary.status,
    stepsSummary.statusColor,
    sleepSummary.quality.label,
    sleepSummary.quality.color,
    bloodOxygen.status,
    bloodOxygen.statusColor,
    bodyTemperature.status,
    bodyTemperature.statusColor,
    weight.status,
    weight.statusColor,
    bloodLipids.tcStatus,
    bloodLipids.tcStatusColor,
    uricAcid.statusLabel,
    uricAcid.statusColor,
  ]);

  function VitalCard({ label, icon, unit, value, status, statusColor, chart, dataTime, onAdd, onAll, onPress }: {
    label: string; icon: ImageSourcePropType; unit: string; value: string; status: string; statusColor: string; chart: React.ReactNode; dataTime?: string; onAdd?: () => void; onAll?: () => void;
    onPress?: () => void;
  }) {
    return (
      <View style={styles.vCard}>
        <Flex justify="between" align="center">
          <Flex>
            <Image source={icon} style={styles.vIcon} />
            <Text style={styles.vLabel}>{label}</Text>
            {status ? <Flex justify='center' style={[styles.vStatusWrap, { borderColor: statusColor }]}>
              <Text style={[styles.vStatus, { color: statusColor }]}>{status}</Text>
            </Flex> : null}
          </Flex>
          {dataTime || onPress ? (
            <TouchableOpacity style={styles.rightBtn} onPress={onPress} disabled={!onPress}>
              <Flex align="center" justify='end'>
                {dataTime ? <Text style={styles.rightText}>{dataTime}</Text> : null}
                {onPress ? (
                  <Image style={{ width: 5, height: 7 }} source={require('@/assets/images/vitals/right.png')} />
                ) : null}
              </Flex>
            </TouchableOpacity>
          ) : null}
        </Flex>
        {/* <TouchableOpacity onPress={onPress} disabled={!onPress}> */}
        <Flex style={styles.vValueBox} justify="between" align="center">
          <View>
            <Text style={styles.vValue}>{value}</Text>
            <Text style={styles.vUnit}>{unit}</Text>
          </View>
          {chart}
        </Flex>
        {/* </TouchableOpacity> */}
      </View>
    );
  }

  const renderVitalSection = useCallback((key: VitalIndexKey) => {
    switch (key) {
      case '心率':
        return (
          <VitalCard
            label="心率"
            icon={require('@/assets/images/vitals/icon_xl.png')}
            unit="次/分钟"
            value={heartRate.value}
            status={heartRate.status}
            statusColor={heartRate.statusColor}
            dataTime={heartRateDataTime}
            onAll={() => navigation.navigate('AllDataPage', withVitalsViewParams({ type: '心率' }, viewNavParams))}
            onPress={() => navigation.navigate('HeartRatePage', viewNavParams)}
            chart={<HeartRateChart data={toHourPoints(heartRateSeries)} hideXAxis />}
          />
        );
      case '消耗':
        return (
          <VitalCard
            label="消耗"
            icon={require('@/assets/images/vitals/icon_xh.png')}
            unit={energySummary.unit}
            value={energySummary.total}
            status={energySummary.status.replace(/^・/, '')}
            statusColor={energySummary.statusColor}
            dataTime={energyDataTime}
            onAll={() => navigation.navigate('AllDataPage', withVitalsViewParams({ type: '消耗' }, viewNavParams))}
            onPress={() => navigation.navigate('ConsumptionPage', viewNavParams)}
            chart={energyChart}
          />
        );
      case '血糖':
        return (
          <VitalCard
            label="血糖"
            icon={require('@/assets/images/vitals/icon_xt.png')}
            unit="mmol/L"
            value={glucose.value}
            status={glucose.status}
            statusColor={glucose.statusColor}
            dataTime={glucoseDataTime}
            onAdd={readOnly ? undefined : () => navigation.navigate('AddDataPage', { type: '血糖' })}
            onAll={() => navigation.navigate('AllDataPage', withVitalsViewParams({ type: '血糖' }, viewNavParams))}
            onPress={() => navigation.navigate('BloodSugarPage', viewNavParams)}
            chart={<BloodGlucoseChart data={glucoseSeries} labels={chartLabels} hideXAxis />}
          />
        );
      case '血压':
        return (
          <VitalCard
            label="血压"
            icon={require('@/assets/images/vitals/icon_xy.png')}
            unit="mmHg"
            value={bloodPressure.value}
            status={bloodPressure.status}
            statusColor={bloodPressure.statusColor}
            dataTime={bloodPressureDataTime}
            onAdd={readOnly ? undefined : () => navigation.navigate('AddDataPage', { type: '血压' })}
            onAll={() => navigation.navigate('AllDataPage', withVitalsViewParams({ type: '血压' }, viewNavParams))}
            onPress={() => navigation.navigate('BloodPressurePage', viewNavParams)}
            chart={<BloodPressureChart data={bloodPressureSeries} labels={chartLabels} hideXAxis />}
          />
        );
      case '步数':
        return (
          <VitalCard
            label="步数"
            icon={require('@/assets/images/vitals/icon_bs.png')}
            unit={stepsSummary.unit}
            value={stepsSummary.value}
            status={stepsSummary.status.replace(/^・/, '')}
            statusColor={stepsSummary.statusColor}
            dataTime={stepsDataTime}
            onAll={() => navigation.navigate('AllDataPage', withVitalsViewParams({ type: '步数' }, viewNavParams))}
            onPress={() => navigation.navigate('StepsPage', viewNavParams)}
            chart={stepsChart}
          />
        );
      case '睡眠':
        return (
          <VitalCard
            label="睡眠"
            icon={require('@/assets/images/vitals/icon_sleep.png')}
            unit="小时"
            value={sleepSummary.duration}
            status={sleepSummary.quality.label}
            statusColor={sleepSummary.quality.color}
            dataTime={sleepDataTime}
            onPress={() => navigation.navigate('SleepPage', viewNavParams)}
            chart={sleepChart}
          />
        );
      case '血氧':
        return (
          <VitalCard
            label="血氧"
            icon={require('@/assets/images/vitals/icon_o2.png')}
            unit="%"
            value={bloodOxygen.value}
            status={bloodOxygen.status}
            statusColor={bloodOxygen.statusColor}
            dataTime={bloodOxygenDataTime}
            onAll={() => navigation.navigate('AllDataPage', withVitalsViewParams({ type: '血氧' }, viewNavParams))}
            onPress={() => navigation.navigate('BloodOxygenPage', viewNavParams)}
            chart={<BloodOxygenChart data={toHourPoints(bloodOxygenSeries)} labels={chartLabels} hideXAxis />}
          />
        );
      case '体温':
        return (
          <VitalCard
            label="体温"
            icon={require('@/assets/images/vitals/icon_tw.png')}
            unit="℃"
            value={bodyTemperature.value}
            status={bodyTemperature.status}
            statusColor={bodyTemperature.statusColor}
            dataTime={bodyTemperatureDataTime}
            onAdd={readOnly ? undefined : () => navigation.navigate('AddDataPage', { type: '体温' })}
            onAll={() => navigation.navigate('AllDataPage', withVitalsViewParams({ type: '体温' }, viewNavParams))}
            onPress={() => navigation.navigate('BodyTemperaturePage', viewNavParams)}
            chart={<BodyTemperatureChart data={toHourPoints(bodyTemperatureSeries)} labels={chartLabels} hideXAxis />}
          />
        );
      case '体重':
        return (
          <VitalCard
            label="体重"
            icon={require('@/assets/images/vitals/icon_tz.png')}
            unit="kg"
            value={weight.value}
            status={weight.status}
            statusColor={weight.statusColor}
            dataTime={weightDataTime}
            onAll={() => navigation.navigate('AllDataPage', withVitalsViewParams({ type: '体重' }, viewNavParams))}
            onPress={() => navigation.navigate('WeightPage', viewNavParams)}
            chart={<WeightChart data={toHourPoints(weightSeries)} labels={chartLabels} hideXAxis />}
          />
        );
      case '血脂':
        return (
          <VitalCard
            label="血脂"
            icon={require('@/assets/images/vitals/icon_xz.png')}
            unit="TC mmol/L"
            value={bloodLipids.tcValue}
            status={bloodLipids.tcStatus}
            statusColor={bloodLipids.tcStatusColor}
            dataTime={bloodLipidsDataTime}
            onAdd={readOnly ? undefined : () => navigation.navigate('AddDataPage', { type: '血脂' })}
            onAll={() => navigation.navigate('AllDataPage', withVitalsViewParams({ type: '血脂' }, viewNavParams))}
            onPress={() => navigation.navigate('BloodLipidPage', viewNavParams)}
            chart={
              <BloodLipidChart
                data={toHourPoints(bloodLipidsSeries)}
                labels={chartLabels}
                hideXAxis
              />
            }
          />
        );
      case '尿酸':
        return (
          <VitalCard
            label="尿酸"
            icon={require('@/assets/images/vitals/icon_ns.png')}
            unit="(μmol/L)"
            value={uricAcid.value}
            status={uricAcid.statusLabel}
            statusColor={uricAcid.statusColor}
            dataTime={uricAcidDataTime}
            onPress={() => navigation.navigate('UricAcidPage', viewNavParams)}
            chart={<UricAcidChart data={toHourPoints(uricAcidSeries)} labels={chartLabels} hideXAxis />}
          />
        );
      default:
        return null;
    }
  }, [
    bloodLipids,
    bloodLipidsDataTime,
    bloodLipidsSeries,
    bloodOxygen,
    bloodOxygenDataTime,
    bloodOxygenSeries,
    bloodPressure,
    bloodPressureDataTime,
    bloodPressureSeries,
    bodyTemperature,
    bodyTemperatureDataTime,
    bodyTemperatureSeries,
    chartLabels,
    energyChart,
    energyDataTime,
    energySummary,
    glucose,
    glucoseDataTime,
    glucoseSeries,
    heartRate,
    heartRateDataTime,
    heartRateSeries,
    navigation,
    sleepChart,
    sleepDataTime,
    sleepSummary,
    stepsChart,
    stepsDataTime,
    stepsSummary,
    uricAcid,
    uricAcidDataTime,
    uricAcidSeries,
    weight,
    weightDataTime,
    weightSeries,
    readOnly,
    viewNavParams,
    navigation,
  ]);

  const runHealthKitSync = useCallback(async (
    days: number | null,
    options?: { onAuthorized?: () => void },
  ) => {
    if (uploading) return;
    try {
      const res = (await updateHealthKit(days, options)) as { code?: number; msg?: string } | undefined;
      if (res?.code == 500) {
        Toast.show(res.msg ?? '同步失败');
        return;
      } else if (res && 'code' in res && res.code != null && !isResourceApiOk(res) && res.code !== 0) {
        Alert.alert('同步失败', res.msg ?? '请稍后重试');
        return;
      }
      await loadMeasureDataRef.current('silent');
    } catch {
      Alert.alert('错误', '健康数据同步失败，请稍后重试');
    }
  }, [uploading]);

  const handleUploadData = useCallback(() => {
    if (uploading) return;
    if (synWdataDays === 0) {
      setDayPickerVisible(true);
      return;
    }
    void runHealthKitSync(synWdataDays);
  }, [uploading, runHealthKitSync, synWdataDays]);

  const handleSaveSyncDays = useCallback(async (days: number) => {
    setSavingSynWdataDays(true);
    try {
      const res = await updateExtrInfo({ synWdataDays: days });
      if (!isResourceApiOk(res as { code?: number })) {
        Alert.alert('失败', (res as { msg?: string })?.msg ?? '保存同步周期失败，请稍后重试');
        return;
      }

      if (userExtr) {
        dispatch({
          type: SET_USER_EXTR,
          payload: { ...userExtr, synWdataDays: days },
        });
      }

      pendingSyncDaysRef.current = days;
      // 周期选择关闭后直接拉起健康授权/同步，避免再套一层弹窗挡住系统弹窗
      syncAfterDayPickerRef.current = true;
      promptAutoSyncAfterSyncRef.current = userExtr?.autoSyncData !== 1;
      setDayPickerVisible(false);
    } catch {
      Alert.alert('错误', '保存同步周期失败，请稍后重试');
    } finally {
      setSavingSynWdataDays(false);
    }
  }, [dispatch, userExtr]);

  const handleDayPickerDismissed = useCallback(() => {
    if (!syncAfterDayPickerRef.current) return;
    syncAfterDayPickerRef.current = false;
    const days = pendingSyncDaysRef.current ?? 7;
    pendingSyncDaysRef.current = null;

    void runHealthKitSync(days, {
      onAuthorized: () => {
        if (!promptAutoSyncAfterSyncRef.current) return;
        promptAutoSyncAfterSyncRef.current = false;
        setAutoSyncPromptVisible(true);
      },
    });
  }, [runHealthKitSync]);

  const handleDayPickerCancel = useCallback(() => {
    syncAfterDayPickerRef.current = false;
    promptAutoSyncAfterSyncRef.current = false;
    pendingSyncDaysRef.current = null;
    setDayPickerVisible(false);
  }, []);

  const handleAutoSyncClose = useCallback(() => {
    setAutoSyncPromptVisible(false);
  }, []);

  const handleAutoSyncCancel = useCallback(() => {
    setAutoSyncPromptVisible(false);
  }, []);

  const handleAutoSyncConfirm = useCallback(async () => {
    setAutoSyncPromptVisible(false);
    try {
      const res = await updateExtrInfo({ autoSyncData: 1 });
      if (isResourceApiOk(res as { code?: number }) && userExtr) {
        dispatch({
          type: SET_USER_EXTR,
          payload: { ...userExtr, autoSyncData: 1 },
        });
      }
    } catch {
      /* silent */
    }
  }, [dispatch, userExtr]);

  const handleSaveSleepTarget = useCallback(async (target: number) => {
    setSavingSleep(true);
    try {
      const result = await saveVitalsGoalTarget('sleep', target, userExtr, dispatch);
      if (result.ok) {
        setSleepTarget(target);
        Alert.alert('成功', getGoalSaveSuccessMessage('sleep'));
        setShowSleepTargetModal(false);
        await loadMeasureDataRef.current('silent');
      } else {
        Alert.alert('失败', result.message);
      }
    } catch {
      Alert.alert('错误', getGoalSaveErrorMessage('sleep'));
    } finally {
      setSavingSleep(false);
    }
  }, [dispatch, userExtr]);

  const handleSaveStepTarget = useCallback(async (target: number) => {
    setSavingStep(true);
    try {
      const result = await saveVitalsGoalTarget('steps', target, userExtr, dispatch);
      if (result.ok) {
        setStepTarget(target);
        Alert.alert('成功', getGoalSaveSuccessMessage('steps'));
        setShowStepTargetModal(false);
        await loadMeasureDataRef.current('silent');
      } else {
        Alert.alert('失败', result.message);
      }
    } catch {
      Alert.alert('错误', getGoalSaveErrorMessage('steps'));
    } finally {
      setSavingStep(false);
    }
  }, [dispatch, userExtr]);

  const handleSaveEnergyTarget = useCallback(async (target: number) => {
    setSavingEnergy(true);
    try {
      const result = await saveVitalsGoalTarget('energy', target, userExtr, dispatch);
      if (result.ok) {
        setEnergyTarget(target);
        Alert.alert('成功', getGoalSaveSuccessMessage('energy'));
        setShowEnergyTargetModal(false);
        await loadMeasureDataRef.current('silent');
      } else {
        Alert.alert('失败', result.message);
      }
    } catch {
      Alert.alert('错误', getGoalSaveErrorMessage('energy'));
    } finally {
      setSavingEnergy(false);
    }
  }, [dispatch, userExtr]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: readOnly
        ? () => <FamilyRelationHeaderBadge label={relationLabel} />
        : () => (
            <TouchableOpacity onPress={() => navigation.navigate('SortPage', { items: vitalsSortItems })}>
              <Image source={require('@/assets/images/vitals/sort.png')} style={{ width: 24, height: 24, marginRight: 8 }} />
            </TouchableOpacity>
          ),
    });
  }, [navigation, vitalsSortItems, readOnly, relationLabel]);
  return (
    <PageLayout style={styles.container} edges={[]}>
      {/* <Flex style={styles.navBox}>
        {VITALS_NAV_LIST.map(item => (
          <TouchableOpacity
            style={styles.navCol}
            key={item.value}
            onPress={() => {
              if (item.value === activeNav) return;
              setActiveNav(item.value);
            }}>
            <View style={styles.navItemWrap}>
              <Text style={[styles.navText, activeNav === item.value && styles.activeNavText]}>
                {item.label}
              </Text>
              {activeNav === item.value ? (
                <View style={styles.navIndicatorWrap}>
                  <Image source={require('@/assets/images/user/btm.png')} style={styles.navIndicator} />
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </Flex> */}

      {loading ? (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : null}

      <View style={styles.pageContent}>
        <ScrollView
          contentContainerStyle={[
            styles.body,
            readOnly ? { paddingBottom: 16 + insets.bottom } : null,
          ]}
        >
          {orderedVitalKeys.map(key => (
            <React.Fragment key={key}>{renderVitalSection(key)}</React.Fragment>
          ))}
        </ScrollView>
        {readOnly ? null : (
          <Flex
            justify="between"
            style={[
              styles.bottomBar,
              { height: 86 + insets.bottom, paddingBottom: insets.bottom },
            ]}
          >
            <TouchableOpacity
              style={[styles.bottomBarButtonLeft, { flex: 1 }, uploading && { opacity: 0.5 }]}
              onPress={handleUploadData}
              disabled={uploading}
              activeOpacity={0.8}
            >
              <Flex justify="center" style={{ flex: 1 }}>
                <Image
                  style={styles.bottomBarButtonImg}
                  source={require('@/assets/images/vitals/upload.png')}
                />
                <Text style={styles.bottomBarButtonTextLeft}>同步数据</Text>
              </Flex>
            </TouchableOpacity>
          </Flex>
        )}
      </View>

      {readOnly ? null : (
        <>
          <GoalTargetModal
            visible={showSleepTargetModal}
            title="设置睡眠目标"
            label="每日目标（小时）"
            unit="小时"
            initialValue={sleepTarget}
            saving={savingSleep}
            min={1}
            max={10}
            step={0.5}
            majorStep={1}
            onCancel={() => setShowSleepTargetModal(false)}
            onConfirm={handleSaveSleepTarget}
          />

          <GoalTargetModal
            visible={showStepTargetModal}
            title="设置步数目标"
            label="每日目标（步）"
            unit="步"
            initialValue={stepTarget}
            saving={savingStep}
            min={0}
            max={20000}
            step={500}
            patternUnitSize={1000}
            formatDisplay={value => value.toLocaleString()}
            onCancel={() => setShowStepTargetModal(false)}
            onConfirm={handleSaveStepTarget}
          />

          <GoalTargetModal
            visible={showEnergyTargetModal}
            title="设置活动能量消耗"
            label="每日目标（千卡）"
            unit="千卡"
            initialValue={energyTarget}
            saving={savingEnergy}
            min={0}
            max={ENERGY_GOAL_MAX}
            step={50}
            patternUnitSize={100}
            formatDisplay={value => value.toLocaleString()}
            onCancel={() => setShowEnergyTargetModal(false)}
            onConfirm={handleSaveEnergyTarget}
          />

          <SyncDaysPickerModal
            visible={dayPickerVisible}
            initialValue={synWdataDays > 0 ? synWdataDays : 7}
            saving={savingSynWdataDays}
            onCancel={handleDayPickerCancel}
            onConfirm={handleSaveSyncDays}
            onDismissed={handleDayPickerDismissed}
          />

          <AutoSyncPromptModal
            visible={autoSyncPromptVisible}
            onClose={handleAutoSyncClose}
            onCancel={handleAutoSyncCancel}
            onConfirm={handleAutoSyncConfirm}
          />
        </>
      )}
    </PageLayout>
  );
}
