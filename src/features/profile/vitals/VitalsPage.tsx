import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, type ImageSourcePropType } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '@/css/vitals/index';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppTheme } from '@/common/theme';
import BloodPressureChart from '@/src/features/home/components/BloodPressureChart';
import BloodGlucoseChart from '@/src/features/home/components/BloodGlucoseChart';
import BloodOxygenChart from '@/src/features/home/components/BloodOxygenChart';
import BodyTemperatureChart from '@/src/features/home/components/BodyTemperatureChart';
import HeartRateChart from '@/src/features/home/components/HeartRateChart';
import SleepPieChart from '@/src/features/home/components/SleepPieChart';
import SleepBarChart from '@/src/features/home/components/SleepBarChart';
import {
  getMeasureDataDetailByDateRange,
  type MeasureDataDayGroup,
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
import {
  VITALS_NAV_LIST,
  buildBloodPressureSeriesFromItems,
  buildSingleValueSeries,
  buildWearableHeartRateSeries,
  buildWearableOxygenSeries,
  flattenMeasureItems,
  formatBloodPressureFromItems,
  formatSingleValueFromItems,
  getBloodOxygenDisplay,
  getChartLabels,
  getDateRange,
  getEnergyDisplay,
  getHeartRateDisplay,
  getSleepSummary,
  getStepsDisplay,
  sortWearableItems,
  toHourPoints,
  VITAL_KEYS,
  type VitalsRange,
} from './vitalsHelpers';

const EMPTY_MEASURE_DATA: Record<VitalKey, MeasureDataItem[]> = {
  bloodPressure: [],
  bloodGlucose: [],
  bodyTemperature: [],
};

export default function VitalsPage() {
  const navigation: any = useNavigation();
  const [activeNav, setActiveNav] = useState<VitalsRange>('today');
  const [loading, setLoading] = useState(false);
  const [measureData, setMeasureData] = useState<Record<VitalKey, MeasureDataItem[]>>(EMPTY_MEASURE_DATA);
  const [wearableSleep, setWearableSleep] = useState<WearableDataItem[]>([]);
  const [wearableSteps, setWearableSteps] = useState<WearableDataItem[]>([]);
  const [wearableOxygen, setWearableOxygen] = useState<WearableDataItem[]>([]);
  const [wearableHeartRate, setWearableHeartRate] = useState<WearableDataItem[]>([]);

  const chartLabels = useMemo(() => getChartLabels(activeNav), [activeNav]);

  const loadMeasureData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(activeNav);

    const fetchWearableItems = async (type: WearableDataType) => {
      try {
        const res = (await getWearableDataDetailByDateRange({
          startDate,
          endDate,
          type,
        })) as unknown as WearableDataRangeResult;
        if (!isResourceApiOk(res)) return [];
        const data = apiResourceData<WearableDataItem[]>(res);
        return sortWearableItems(Array.isArray(data) ? data : []);
      } catch {
        return [];
      }
    };

    try {
      const [measureEntries, sleepItems, stepsItems, oxygenItems, heartRateItems] = await Promise.all([
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
              const groups = apiResourceData<MeasureDataDayGroup[]>(res);
              return [key, flattenMeasureItems(groups)] as const;
            } catch {
              return [key, []] as const;
            }
          }),
        ),
        fetchWearableItems(WEARABLE_DATA_TYPES.sleep),
        fetchWearableItems(WEARABLE_DATA_TYPES.steps),
        fetchWearableItems(WEARABLE_DATA_TYPES.oxygen),
        fetchWearableItems(WEARABLE_DATA_TYPES.heartRate),
      ]);

      setMeasureData({
        ...EMPTY_MEASURE_DATA,
        ...(Object.fromEntries(measureEntries) as Record<VitalKey, MeasureDataItem[]>),
      });
      setWearableSleep(sleepItems);
      setWearableSteps(stepsItems);
      setWearableOxygen(oxygenItems);
      setWearableHeartRate(heartRateItems);
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
    () => formatBloodPressureFromItems(measureData.bloodPressure),
    [measureData.bloodPressure],
  );

  const glucoseSeries = useMemo(
    () => buildSingleValueSeries(measureData.bloodGlucose, activeNav),
    [measureData.bloodGlucose, activeNav],
  );
  const glucose = useMemo(
    () => formatSingleValueFromItems(measureData.bloodGlucose, '血糖'),
    [measureData.bloodGlucose],
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
  const stepsDisplay = useMemo(() => getStepsDisplay(wearableSteps), [wearableSteps]);
  const energyDisplay = useMemo(() => getEnergyDisplay(wearableSteps), [wearableSteps]);
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
    () => formatSingleValueFromItems(measureData.bodyTemperature, '体温'),
    [measureData.bodyTemperature],
  );

  const stageIconStyles = [styles.icon1, styles.icon2, styles.icon3, styles.icon4];

  function VitalCard({ label, icon, unit, value, status, statusColor, chart, onAdd, onAll }: {
    label: string; icon: ImageSourcePropType; unit: string; value: string; status: string; statusColor: string; chart: React.ReactNode; onAdd?: () => void; onAll?: () => void;
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
        <Flex style={styles.vValueBox} justify="between" align="center">
          <View>
            <Text style={styles.vValue}>{value}</Text>
            <Text style={styles.vUnit}>{unit}</Text>
            {status ? <Text style={[styles.vStatus, { color: statusColor }]}>{status}</Text> : null}
          </View>
          {chart}
        </Flex>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
          chart={<BloodGlucoseChart data={toHourPoints(glucoseSeries)} />}
        />

        <VitalCard
          label="心率"
          icon={require('@/assets/images/home/xl.png')}
          unit="次/分钟"
          value={heartRate.value}
          status={heartRate.status}
          statusColor={heartRate.statusColor}
          chart={<HeartRateChart data={toHourPoints(heartRateSeries)} />}
        />

        <View style={styles.vCard}>
          <Flex justify="between" align="center">
            <Flex>
              <Image source={require('@/assets/images/home/sleep.png')} style={styles.vIcon} />
              <Text style={styles.vLabel}>睡眠</Text>
            </Flex>
            <Flex>
              <TouchableOpacity>
                <Text style={styles.vMore}>详情</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginLeft: 12 }}>
                <Text style={styles.vMore}>全部记录</Text>
              </TouchableOpacity>
            </Flex>
          </Flex>
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
        </View>

        <VitalCard
          label="血氧"
          icon={require('@/assets/images/home/xy.png')}
          unit="百分比"
          value={bloodOxygen.value}
          status={bloodOxygen.status}
          statusColor={bloodOxygen.statusColor}
          chart={<BloodOxygenChart data={toHourPoints(bloodOxygenSeries)} />}
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
          chart={<BodyTemperatureChart data={toHourPoints(bodyTemperatureSeries)} />}
        />

        <View style={styles.vCard}>
          <Flex justify="between" align="center">
            <Flex>
              <Image source={require('@/assets/images/home/bs.png')} style={styles.vIcon} />
              <Text style={styles.vLabel}>步数</Text>
            </Flex>
            <Flex>
              <TouchableOpacity>
                <Text style={styles.vMore}>目标</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginLeft: 12 }}>
                <Text style={styles.vMore}>全部记录</Text>
              </TouchableOpacity>
            </Flex>
          </Flex>
          <Flex direction="column" style={styles.vValueBox} justify="center" align="center">
            <Text style={styles.vValue1}>{stepsDisplay.value}</Text>
            <Text style={styles.vUnit}>步</Text>
            <Text style={[styles.vText, { color: stepsDisplay.statusColor }]}>
              {stepsDisplay.status}
            </Text>
          </Flex>
        </View>

        <View style={styles.vCard}>
          <Flex justify="between" align="center">
            <Flex>
              <Image source={require('@/assets/images/home/rl.png')} style={styles.vIcon} />
              <Text style={styles.vLabel}>消耗</Text>
            </Flex>
            <Flex>
              <TouchableOpacity>
                <Text style={styles.vMore}>目标</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginLeft: 12 }}>
                <Text style={styles.vMore}>全部记录</Text>
              </TouchableOpacity>
            </Flex>
          </Flex>
          <Flex style={styles.vValueBox} justify="between" align="center">
            <View>
              <Text style={styles.vUnit}>总消耗</Text>
              <Text style={[styles.vValue, { fontSize: 20, lineHeight: 20 }]}>{energyDisplay.total}</Text>
              <Text style={styles.vUnit}>千卡</Text>
            </View>
            <Flex justify="around" style={styles.vRightBox}>
              <View>
                <Text style={styles.vText1}>静息消耗</Text>
                <Text style={styles.vText2}>{energyDisplay.basal}</Text>
                <Text style={styles.vText1}>千卡</Text>
              </View>
              <View>
                <Text style={styles.vText1}>活动消耗</Text>
                <Text style={styles.vText2}>{energyDisplay.active}</Text>
                <Text style={styles.vText1}>千卡</Text>
              </View>
            </Flex>
          </Flex>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
