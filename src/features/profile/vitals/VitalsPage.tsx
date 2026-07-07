import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, type ImageSourcePropType } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import GoalTargetModal from './components/GoalTargetModal';
import SyncDaysPickerModal from './components/SyncDaysPickerModal';
import AutoSyncPromptModal from './components/AutoSyncPromptModal';
import { useDispatch, useSelector } from 'react-redux';
import styles from '@/css/vitals/index';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppTheme } from '@/common/theme';
import updateHealthKit from '@/utils/healthKit';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';
import BloodPressureChart from '../components/BloodPressureChart';
import BloodGlucoseChart from '../components/BloodGlucoseChart';
import BloodOxygenChart from '../components/BloodOxygenChart';
import BodyTemperatureChart from '../components/BodyTemperatureChart';
import HeartRateChart from '../components/HeartRateChart';
import SleepPieChart from '../components/SleepPieChart';
import SleepBarChart from '../components/SleepBarChart';
import {
  getMeasureDataAllRecords,
  getMeasureDataDetailByDateRange,
  type MeasureDataAllRecordsResult,
  type MeasureDataItem,
  type MeasureDataRangeDetailResult,
  type VitalKey,
  VITAL_KEY_API_TYPE,
} from '@/api/measureData';
import {
  getWearableDataDetailByDateRange,
  WEARABLE_DATA_TYPES,
  type WearableDataItem,
  type WearableDataRangeResult,
  type WearableDataType,
} from '@/api/wearableData';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { updateExtrInfo } from '@/api/user';
import {
  VITALS_NAV_LIST,
  buildBloodPressureSeriesFromItems,
  buildSingleValueSeries,
  buildWearableHeartRateSeries,
  buildWearableOxygenSeries,
  flattenMeasureItems,
  formatBloodPressureFromItems,
  formatSingleValueFromItems,
  formatUricAcidFromItems,
  formatUricAcidCompareText,
  flattenAllMeasureRecords,
  formatBloodLipidsFromItems,
  normalizeMeasureRangeData,
  getBloodOxygenDisplay,
  getChartLabels,
  getDateRange,
  getEnergySummary,
  getHeartRateDisplay,
  getSleepFetchDateRange,
  getSleepSummary,
  getStepsSummary,
  sortWearableItems,
  toHourPoints,
  VITAL_KEYS,
  type VitalsRange,
} from './vitalsHelpers';

const EMPTY_MEASURE_DATA: Record<VitalKey, MeasureDataItem[]> = {
  bloodPressure: [],
  bloodGlucose: [],
  bodyTemperature: [],
  uricAcid: [],
  bloodLipids: [],
};

const DEFAULT_SLEEP_TARGET_HOURS = 8;
const DEFAULT_STEP_TARGET = 10000;
const DEFAULT_ENERGY_TARGET = 2000;
const ENERGY_GOAL_MAX = 5000;

export default function VitalsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation: any = useNavigation();
  const uploading = useSelector((state: RootState) => state.upload.uploading);
  const userGender = useSelector((state: RootState) => state.user.info?.gender);
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const synWdataDays = userExtr?.synWdataDays ?? 0;
  const [activeNav, setActiveNav] = useState<VitalsRange>('today');
  const [loading, setLoading] = useState(false);
  const [measureData, setMeasureData] = useState<Record<VitalKey, MeasureDataItem[]>>(EMPTY_MEASURE_DATA);
  const [wearableSleep, setWearableSleep] = useState<WearableDataItem[]>([]);
  const [wearableSteps, setWearableSteps] = useState<WearableDataItem[]>([]);
  const [wearableOxygen, setWearableOxygen] = useState<WearableDataItem[]>([]);
  const [wearableHeartRate, setWearableHeartRate] = useState<WearableDataItem[]>([]);
  const [wearableActiveEnergy, setWearableActiveEnergy] = useState<WearableDataItem[]>([]);
  const [wearableBasalEnergy, setWearableBasalEnergy] = useState<WearableDataItem[]>([]);
  const [uricAcidCompare, setUricAcidCompare] = useState<{ text: string; color: string } | null>(null);
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
  const [pendingSyncDays, setPendingSyncDays] = useState<number | null>(null);
  const openAutoSyncAfterDayPickerRef = useRef(false);

  useEffect(() => {
    if (userExtr?.sleepGoals != null && userExtr.sleepGoals > 0) {
      setSleepTarget(Math.round((userExtr.sleepGoals / 60) * 2) / 2);
    }
    if (userExtr?.stepGoals != null && userExtr.stepGoals >= 0) {
      setStepTarget(Math.round(userExtr.stepGoals / 500) * 500);
    }
    if (userExtr?.energyGoals != null && userExtr.energyGoals >= 0) {
      setEnergyTarget(Math.round(userExtr.energyGoals / 50) * 50);
    }
  }, [userExtr?.sleepGoals, userExtr?.stepGoals, userExtr?.energyGoals]);

  const chartLabels = useMemo(() => getChartLabels(activeNav), [activeNav]);

  const loadMeasureData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(activeNav);

    const fetchWearableItems = async (type: WearableDataType, dateRange = { startDate, endDate }) => {
      try {
        const res = (await getWearableDataDetailByDateRange({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          type,
        })) as unknown as WearableDataRangeResult;
        if (!isResourceApiOk(res)) return [];
        const data = apiResourceData<WearableDataItem[]>(res);
        return sortWearableItems(Array.isArray(data) ? data : []);
      } catch {
        return [];
      }
    };

    const sleepDateRange = getSleepFetchDateRange(activeNav);

    try {
      const [
        measureEntries,
        sleepItems,
        stepsItems,
        oxygenItems,
        heartRateItems,
        activeEnergyItems,
        basalEnergyItems,
        uricAcidRecordsRes,
      ] = await Promise.all([
        Promise.all(
          VITAL_KEYS.map(async key => {
            try {
              const res = (await getMeasureDataDetailByDateRange({
                startDate,
                endDate,
                type: VITAL_KEY_API_TYPE[key],
              })) as unknown as MeasureDataRangeDetailResult;
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
        fetchWearableItems(WEARABLE_DATA_TYPES.sleep, sleepDateRange),
        fetchWearableItems(WEARABLE_DATA_TYPES.steps),
        fetchWearableItems(WEARABLE_DATA_TYPES.oxygen),
        fetchWearableItems(WEARABLE_DATA_TYPES.heartRate),
        fetchWearableItems(WEARABLE_DATA_TYPES.activeEnergy),
        fetchWearableItems(WEARABLE_DATA_TYPES.basalEnergy),
        getMeasureDataAllRecords({ type: '尿酸', pageSize: 20, pageNum: 1 }).catch(() => null),
      ]);

      setMeasureData({
        ...EMPTY_MEASURE_DATA,
        ...(Object.fromEntries(measureEntries) as Record<VitalKey, MeasureDataItem[]>),
      });
      setWearableSleep(sleepItems);
      setWearableSteps(stepsItems);
      setWearableOxygen(oxygenItems);
      setWearableHeartRate(heartRateItems);
      setWearableActiveEnergy(activeEnergyItems);
      setWearableBasalEnergy(basalEnergyItems);

      if (uricAcidRecordsRes && isResourceApiOk(uricAcidRecordsRes as { code?: number })) {
        const rows = (uricAcidRecordsRes as MeasureDataAllRecordsResult).rows;
        setUricAcidCompare(formatUricAcidCompareText(flattenAllMeasureRecords(rows)));
      } else {
        setUricAcidCompare(null);
      }
    } finally {
      setLoading(false);
    }
  }, [activeNav]);

  const loadMeasureDataRef = useRef(loadMeasureData);
  loadMeasureDataRef.current = loadMeasureData;
  const hasMountedRef = useRef(false);

  useEffect(() => {
    loadMeasureData();
  }, [loadMeasureData]);

  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
        return;
      }
      loadMeasureDataRef.current();
    }, []),
  );

  const bloodPressureSeries = useMemo(
    () => buildBloodPressureSeriesFromItems(measureData.bloodPressure, activeNav),
    [measureData.bloodPressure, activeNav],
  );
  const bloodPressure = useMemo(
    () => formatBloodPressureFromItems(measureData.bloodPressure, activeNav),
    [measureData.bloodPressure, activeNav],
  );

  const glucoseSeries = useMemo(
    () => buildSingleValueSeries(measureData.bloodGlucose, activeNav),
    [measureData.bloodGlucose, activeNav],
  );
  const glucose = useMemo(
    () => formatSingleValueFromItems(measureData.bloodGlucose, '血糖', activeNav),
    [measureData.bloodGlucose, activeNav],
  );

  const heartRateSeries = useMemo(
    () => buildWearableHeartRateSeries(wearableHeartRate, activeNav),
    [wearableHeartRate, activeNav],
  );
  const heartRate = useMemo(() => getHeartRateDisplay(wearableHeartRate), [wearableHeartRate]);

  const sleepSummary = useMemo(
    () => getSleepSummary(wearableSleep, activeNav),
    [wearableSleep, activeNav],
  );
  const stepsSummary = useMemo(
    () => getStepsSummary(wearableSteps, activeNav, stepTarget),
    [wearableSteps, activeNav, stepTarget],
  );
  const energySummary = useMemo(
    () => getEnergySummary(wearableActiveEnergy, wearableBasalEnergy, activeNav),
    [wearableActiveEnergy, wearableBasalEnergy, activeNav],
  );
  const stepsBarData = useMemo(
    () => stepsSummary.barSeries.map(item => ({ label: item.label, value: item.value })),
    [stepsSummary.barSeries],
  );
  const energyBarData = useMemo(
    () => energySummary.barSeries.map(item => ({ label: item.label, value: item.value })),
    [energySummary.barSeries],
  );
  const sleepBarData = useMemo(
    () => sleepSummary.barSeries.map(item => ({ label: item.label, value: item.value })),
    [sleepSummary.barSeries],
  );

  const bloodOxygenSeries = useMemo(
    () => buildWearableOxygenSeries(wearableOxygen, activeNav),
    [wearableOxygen, activeNav],
  );
  const bloodOxygen = useMemo(() => getBloodOxygenDisplay(wearableOxygen), [wearableOxygen]);

  const bodyTemperatureSeries = useMemo(
    () => buildSingleValueSeries(measureData.bodyTemperature, activeNav),
    [measureData.bodyTemperature, activeNav],
  );
  const bodyTemperature = useMemo(
    () => formatSingleValueFromItems(measureData.bodyTemperature, '体温', activeNav),
    [measureData.bodyTemperature, activeNav],
  );

  const uricAcid = useMemo(
    () => formatUricAcidFromItems(measureData.uricAcid, activeNav, userGender),
    [measureData.uricAcid, activeNav, userGender],
  );

  const bloodLipids = useMemo(
    () => formatBloodLipidsFromItems(measureData.bloodLipids, activeNav),
    [measureData.bloodLipids, activeNav],
  );

  const stageIconStyles = [styles.icon1, styles.icon2, styles.icon3, styles.icon4];

  function VitalCard({ label, icon, unit, value, status, statusColor, chart, onAdd, onAll, onPress }: {
    label: string; icon: ImageSourcePropType; unit: string; value: string; status: string; statusColor: string; chart: React.ReactNode; onAdd?: () => void; onAll?: () => void;
    onPress?: () => void;
  }) {
    return (
      <View style={styles.vCard}>
        <Flex justify="between" align="center">
          <Flex>
            <Image source={icon} style={styles.vIcon} />
            <Text style={styles.vLabel}>{label}</Text>
          </Flex>
          <Flex>
            {onAdd ? (
              <TouchableOpacity onPress={onAdd}>
                <Text style={styles.vMore}>新增记录</Text>
              </TouchableOpacity>
            ) : null}
            {onAll ? (
              <TouchableOpacity onPress={onAll}>
                <Text style={styles.vMore}>全部记录</Text>
              </TouchableOpacity>
            ) : null}
          </Flex>
        </Flex>
        <TouchableOpacity onPress={onPress}>
          <Flex style={styles.vValueBox} justify="between" align="center">
            <View>
              <Text style={styles.vValue}>{value}</Text>
              <Text style={styles.vUnit}>{unit}</Text>
              {status ? <Text style={[styles.vStatus, { color: statusColor }]}>{status}</Text> : null}
            </View>
            {chart}
          </Flex>
        </TouchableOpacity>
      </View>
    );
  }

  const runHealthKitSync = useCallback(async (days: number | null) => {
    if (uploading) return;
    try {
      const res = (await updateHealthKit(days)) as { code?: number; msg?: string } | undefined;
      if (res && 'code' in res && res.code != null && !isResourceApiOk(res) && res.code !== 0) {
        Alert.alert('同步失败', res.msg ?? '请稍后重试');
        return;
      }
      await loadMeasureDataRef.current();
    } catch {
      Alert.alert('错误', '健康数据同步失败，请稍后重试');
    }
  }, [uploading]);

  const syncData = useCallback((days: number) => {
    setTimeout(() => {
      void runHealthKitSync(days);
    }, 300);
  }, [runHealthKitSync]);

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

      setPendingSyncDays(days);
      openAutoSyncAfterDayPickerRef.current = true;
      setDayPickerVisible(false);
    } catch {
      Alert.alert('错误', '保存同步周期失败，请稍后重试');
    } finally {
      setSavingSynWdataDays(false);
    }
  }, [dispatch, userExtr]);

  const handleDayPickerDismissed = useCallback(() => {
    if (!openAutoSyncAfterDayPickerRef.current) return;
    openAutoSyncAfterDayPickerRef.current = false;
    setAutoSyncPromptVisible(true);
  }, []);

  const handleDayPickerCancel = useCallback(() => {
    openAutoSyncAfterDayPickerRef.current = false;
    setDayPickerVisible(false);
  }, []);

  const handleAutoSyncClose = useCallback(() => {
    setAutoSyncPromptVisible(false);
    setPendingSyncDays(null);
  }, []);

  const handleAutoSyncCancel = useCallback(() => {
    const days = pendingSyncDays ?? (synWdataDays || 7);
    setAutoSyncPromptVisible(false);
    syncData(days);
    setPendingSyncDays(null);
  }, [pendingSyncDays, synWdataDays, syncData]);

  const handleAutoSyncConfirm = useCallback(async () => {
    const days = pendingSyncDays ?? (synWdataDays || 7);
    setAutoSyncPromptVisible(false);
    syncData(days);
    setPendingSyncDays(null);

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
  }, [dispatch, pendingSyncDays, synWdataDays, syncData, userExtr]);

  const handleSaveSleepTarget = useCallback(async (target: number) => {
    setSavingSleep(true);
    try {
      const sleepGoalsMinutes = Math.round(target * 60);
      const res = await updateExtrInfo({ sleepGoals: sleepGoalsMinutes });
      if (isResourceApiOk(res as { code?: number })) {
        setSleepTarget(target);
        if (userExtr) {
          dispatch({ type: SET_USER_EXTR, payload: { ...userExtr, sleepGoals: sleepGoalsMinutes } });
        }
        Alert.alert('成功', '睡眠目标已保存');
        setShowSleepTargetModal(false);
        await loadMeasureDataRef.current();
      } else {
        Alert.alert('失败', (res as { msg?: string })?.msg ?? '保存失败，请稍后重试');
      }
    } catch {
      Alert.alert('错误', '保存睡眠目标失败，请稍后重试');
    } finally {
      setSavingSleep(false);
    }
  }, [dispatch, userExtr]);

  const handleSaveStepTarget = useCallback(async (target: number) => {
    setSavingStep(true);
    try {
      const res = await updateExtrInfo({ stepGoals: target });
      if (isResourceApiOk(res as { code?: number })) {
        setStepTarget(target);
        if (userExtr) {
          dispatch({ type: SET_USER_EXTR, payload: { ...userExtr, stepGoals: target } });
        }
        Alert.alert('成功', '步数目标已保存');
        setShowStepTargetModal(false);
        await loadMeasureDataRef.current();
      } else {
        Alert.alert('失败', (res as { msg?: string })?.msg ?? '保存失败，请稍后重试');
      }
    } catch {
      Alert.alert('错误', '保存步数目标失败，请稍后重试');
    } finally {
      setSavingStep(false);
    }
  }, [dispatch, userExtr]);

  const handleSaveEnergyTarget = useCallback(async (target: number) => {
    setSavingEnergy(true);
    try {
      const res = await updateExtrInfo({ energyGoals: target });
      if (isResourceApiOk(res as { code?: number })) {
        setEnergyTarget(target);
        if (userExtr) {
          dispatch({ type: SET_USER_EXTR, payload: { ...userExtr, energyGoals: target } });
        }
        Alert.alert('成功', '消耗目标已保存');
        setShowEnergyTargetModal(false);
        await loadMeasureDataRef.current();
      } else {
        Alert.alert('失败', (res as { msg?: string })?.msg ?? '保存失败，请稍后重试');
      }
    } catch {
      Alert.alert('错误', '保存消耗目标失败，请稍后重试');
    } finally {
      setSavingEnergy(false);
    }
  }, [dispatch, userExtr]);

  return (
    <PageLayout style={styles.container}>
      <Flex style={styles.navBox}>
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
      </Flex>

      {loading ? (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.body}>
        <VitalCard
          label="血压"
          icon={require('@/assets/images/home/bp.png')}
          unit="mmHg"
          value={bloodPressure.value}
          status={bloodPressure.status}
          statusColor={bloodPressure.statusColor}
          onAdd={() => navigation.navigate('AddDataPage', { type: '血压' })}
          onAll={() => navigation.navigate('AllDataPage', { type: '血压' })}
          onPress={() => navigation.navigate('BloodPressurePage')}
          chart={<BloodPressureChart data={bloodPressureSeries} labels={chartLabels} />}
        />

        <VitalCard
          label="血糖"
          icon={require('@/assets/images/home/xt.png')}
          unit="mmol/L"
          value={glucose.value}
          status={glucose.status}
          statusColor={glucose.statusColor}
          onAdd={() => navigation.navigate('AddDataPage', { type: '血糖' })}
          onAll={() => navigation.navigate('AllDataPage', { type: '血糖' })}
          onPress={() => navigation.navigate('BloodSugarPage')}
          chart={<BloodGlucoseChart data={toHourPoints(glucoseSeries)} labels={chartLabels} />}
        />

        <VitalCard
          label="心率"
          icon={require('@/assets/images/home/xl.png')}
          unit="次/分钟"
          value={heartRate.value}
          status={heartRate.status}
          statusColor={heartRate.statusColor}
          onAll={() => navigation.navigate('AllDataPage', { type: '心率' })}
          onPress={() => navigation.navigate('HeartRatePage')}
          chart={<HeartRateChart data={toHourPoints(heartRateSeries)} />}
        />

        <View style={styles.vCard}>
          <Flex justify="between" align="center">
            <Flex>
              <Image source={require('@/assets/images/home/sleep.png')} style={styles.vIcon} />
              <Text style={styles.vLabel}>睡眠</Text>
            </Flex>
            <Flex>
              <TouchableOpacity onPress={() => setShowSleepTargetModal(true)}>
                <Text style={styles.vMore}>目标</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.vMore}>全部记录</Text>
              </TouchableOpacity>
            </Flex>
          </Flex>
          <TouchableOpacity onPress={() => navigation.navigate('SleepPage')}>

            <Flex
              style={styles.vValueBox}
              justify="between"
              align="center">
              <View>
                <Text style={styles.vValue}>{sleepSummary.duration}</Text>
                <Text style={styles.vUnit}>夜间睡眠</Text>
                {sleepSummary.quality.label ? (
                  <Text style={[styles.vStatus, { color: sleepSummary.quality.color }]}>
                    {sleepSummary.quality.label}
                  </Text>
                ) : null}
              </View>
              {activeNav === 'today' ? (
                <>
                  <SleepPieChart data={sleepSummary.pieSegments} />
                  <View>
                    {sleepSummary.stages.map((stage, index) => (
                      <Flex key={stage.name}>
                        <View style={stageIconStyles[index]} />
                        <Text style={styles.sleepTitle}>{stage.name}</Text>
                        <Text style={styles.sleepText}>{stage.duration}</Text>
                      </Flex>
                    ))}
                  </View>
                </>
              ) : (
                <SleepBarChart data={sleepBarData} />
              )}
            </Flex>
          </TouchableOpacity>
        </View>

        <VitalCard
          label="血氧"
          icon={require('@/assets/images/home/xy.png')}
          unit="百分比"
          value={bloodOxygen.value}
          status={bloodOxygen.status}
          statusColor={bloodOxygen.statusColor}
          onAll={() => navigation.navigate('AllDataPage', { type: '血氧' })}
          onPress={() => navigation.navigate('BloodOxygenPage')}
          chart={<BloodOxygenChart data={toHourPoints(bloodOxygenSeries)} labels={chartLabels} />}
        />

        <VitalCard
          label="体温"
          icon={require('@/assets/images/home/tw.png')}
          unit="℃"
          value={bodyTemperature.value}
          status={bodyTemperature.status}
          statusColor={bodyTemperature.statusColor}
          onAdd={() => navigation.navigate('AddDataPage', { type: '体温' })}
          onAll={() => navigation.navigate('AllDataPage', { type: '体温' })}
          onPress={() => navigation.navigate('BodyTemperaturePage')}
          chart={<BodyTemperatureChart data={toHourPoints(bodyTemperatureSeries)} />}
        />

        <View style={styles.vCard}>
          <Flex justify="between" align="center">
            <Flex>
              <Image source={require('@/assets/images/home/bs.png')} style={styles.vIcon} />
              <Text style={styles.vLabel}>步数</Text>
            </Flex>
            <Flex>
              <TouchableOpacity onPress={() => setShowStepTargetModal(true)}>
                <Text style={styles.vMore}>目标</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginLeft: 12 }}
                onPress={() => navigation.navigate('AllDataPage', { type: '步数' })}>
                <Text style={styles.vMore}>全部记录</Text>
              </TouchableOpacity>
            </Flex>
          </Flex>
          <TouchableOpacity onPress={() => navigation.navigate('StepsPage')}>
            <Flex
              direction={activeNav === 'today' ? 'column' : 'row'}
              style={styles.vValueBox}
              justify={activeNav === 'today' ? 'center' : 'between'}
              align="center">
              <View style={activeNav === 'today' ? { alignItems: 'center' } : undefined}>
                <Text style={styles.vValue1}>{stepsSummary.value}</Text>
                <Text style={styles.vUnit}>{stepsSummary.unit}</Text>
                <Text style={[styles.vText, { color: stepsSummary.statusColor }]}>
                  {stepsSummary.status}
                </Text>
              </View>
              {activeNav !== 'today' ? (
                <SleepBarChart data={stepsBarData} metricLabel="步数" valueUnit="步" />
              ) : null}
            </Flex>
          </TouchableOpacity>
        </View>

        <View style={styles.vCard}>
          <Flex justify="between" align="center">
            <Flex>
              <Image source={require('@/assets/images/home/rl.png')} style={styles.vIcon} />
              <Text style={styles.vLabel}>消耗</Text>
            </Flex>
            <Flex>
              <TouchableOpacity onPress={() => setShowEnergyTargetModal(true)}>
                <Text style={styles.vMore}>目标</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginLeft: 12 }}
                onPress={() => navigation.navigate('AllDataPage', { type: '消耗' })}>
                <Text style={styles.vMore}>全部记录</Text>
              </TouchableOpacity>
            </Flex>
          </Flex>
          <TouchableOpacity onPress={() => navigation.navigate('ConsumptionPage')}>
            <Flex style={styles.vValueBox} justify="between" align="center">
              <View>
                <Text style={styles.vUnit}>{energySummary.totalLabel ?? '总消耗'}</Text>
                <Text style={[styles.vValue, { fontSize: 20, lineHeight: 20 }]}>{energySummary.total}</Text>
                <Text style={styles.vUnit}>千卡</Text>
              </View>
              {energySummary.showBreakdown ? (
                <Flex justify="around" style={styles.vRightBox}>
                  <View>
                    <Text style={styles.vText1}>静息消耗</Text>
                    <Text style={styles.vText2}>{energySummary.basal}</Text>
                    <Text style={styles.vText1}>千卡</Text>
                  </View>
                  <View>
                    <Text style={styles.vText1}>活动消耗</Text>
                    <Text style={styles.vText2}>{energySummary.active}</Text>
                    <Text style={styles.vText1}>千卡</Text>
                  </View>
                </Flex>
              ) : (
                <SleepBarChart data={energyBarData} metricLabel="消耗" valueUnit="千卡" />
              )}
            </Flex>
          </TouchableOpacity>
        </View>
        <View style={styles.vCard}>
          <Flex justify="between" align="center">
            <Flex>
              <Image source={require('@/assets/images/home/xy.png')} style={styles.vIcon} />
              <Text style={styles.vLabel}>尿酸</Text>
            </Flex>
            <Flex>
              <TouchableOpacity onPress={() => navigation.navigate('AddDataPage', { type: '尿酸' })}>
                <Text style={styles.vMore}>新增记录</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('AllDataPage', { type: '尿酸' })}>
                <Text style={styles.vMore}>全部记录</Text>
              </TouchableOpacity>
            </Flex>
          </Flex>
          <Flex style={styles.vValueBox} justify="between" align="center">
            <View>
              <Text style={[styles.vValue, { fontSize: 20, lineHeight: 20 }]}>{uricAcid.value}</Text>
              <Text style={styles.vUnit}>μmol/L</Text>
            </View>
            {uricAcid.statusLabel || uricAcid.recordTime ? (
              <View style={{ alignItems: 'flex-end' }}>
                {uricAcid.statusLabel ? (
                  <Text style={[styles.vText, { color: uricAcid.statusColor, marginTop: 0 }]}>
                    {uricAcid.statusLabel}
                  </Text>
                ) : null}
                {uricAcid.recordTime ? (
                  <Text style={[styles.vUnit, { marginTop: 4, textAlign: 'right' }]}>{uricAcid.recordTime}</Text>
                ) : null}
              </View>
            ) : null}
          </Flex>
          {uricAcidCompare && uricAcid.value !== '--' ? (
            <Flex style={styles.bjBox}>
              <Text style={[styles.bjText, { color: uricAcidCompare.color }]}>{uricAcidCompare.text}</Text>
            </Flex>
          ) : null}
        </View>

        <View style={styles.vCard}>
          <Flex justify="between" align="center">
            <Flex>
              <Image source={require('@/assets/images/home/xy.png')} style={styles.vIcon} />
              <Text style={styles.vLabel}>血脂</Text>
            </Flex>
            <Flex>
              <TouchableOpacity onPress={() => navigation.navigate('AddDataPage', { type: '血脂' })}>
                <Text style={styles.vMore}>新增记录</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('AllDataPage', { type: '血脂' })}>
                <Text style={styles.vMore}>全部记录</Text>
              </TouchableOpacity>
            </Flex>
          </Flex>
          <Flex style={styles.vValueBox} justify="between" align="center">
            <View>
              <Text style={styles.vUnit}>总胆固醇 TC</Text>
              <Text style={styles.vValue}>{bloodLipids.tcValue}</Text>
              <Text style={styles.vUnit}>mmol/L</Text>
              {bloodLipids.status ? (
                <Text style={[styles.vStatus, { color: bloodLipids.statusColor }]}>{bloodLipids.status}</Text>
              ) : null}
            </View>
            <View style={styles.vRightBox}>
              <Flex justify="between" style={{ marginBottom: 6 }}>
                <Text style={styles.vText1}>TG</Text>
                <Text style={styles.vText2}>{bloodLipids.tgValue}</Text>
              </Flex>
              <Flex justify="between" style={{ marginBottom: 6 }}>
                <Text style={styles.vText1}>HDL-C</Text>
                <Text style={styles.vText2}>{bloodLipids.hdlValue}</Text>
              </Flex>
              <Flex justify="between">
                <Text style={styles.vText1}>LDL-C</Text>
                <Text style={styles.vText2}>{bloodLipids.ldlValue}</Text>
              </Flex>
            </View>
          </Flex>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={[styles.addBtn, uploading && { opacity: 0.5 }]}
        onPress={handleUploadData}
        disabled={uploading}
        activeOpacity={0.8}>
        <Flex justify="center" align="center" style={{ flex: 1 }}>
          <Text style={styles.addText}>上传体征数据</Text>
        </Flex>
      </TouchableOpacity>

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
        title="设置消耗目标"
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
    </PageLayout>
  );
}
