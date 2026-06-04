import React, { useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, type ImageSourcePropType } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '@/css/vitals/index';
import BloodPressureChart from '@/src/features/home/components/BloodPressureChart';
import BloodGlucoseChart from '@/src/features/home/components/BloodGlucoseChart';
import BloodOxygenChart from '@/src/features/home/components/BloodOxygenChart';
import BodyTemperatureChart from '@/src/features/home/components/BodyTemperatureChart';
import HeartRateChart from '@/src/features/home/components/HeartRateChart';
import {
  VITALS_NAV_LIST,
  buildBloodPressureSeries,
  buildLabeledSeries,
  formatBloodPressure,
  formatSingleValue,
  getChartLabels,
  toHourPoints,
  type VitalsRange,
} from './vitalsHelpers';

function VitalCard({ label, icon, unit, value, status, statusColor, chart, }: {
  label: string; icon: ImageSourcePropType; unit: string; value: string; status: string; statusColor: string; chart: React.ReactNode
}) {
  return (
    <View style={styles.vCard}>
      <Flex justify="between" align="center">
        <Flex>
          <Image source={icon} style={styles.vIcon} />
          <Text style={styles.vLabel}>{label}</Text>
        </Flex>
        <TouchableOpacity>
          <Text style={styles.vMore}>全部记录</Text>
        </TouchableOpacity>
      </Flex>
      <Flex style={styles.vValueBox} justify="between" align="center">
        <View>
          <Text style={styles.vValue}>{value}</Text>
          <Text style={styles.vUnit}>{unit}</Text>
          <Text style={[styles.vStatus, { color: statusColor }]}>{status}</Text>
        </View>
        {chart}
      </Flex>
    </View>
  );
}

export default function VitalsPage() {
  const [activeNav, setActiveNav] = useState<VitalsRange>('today');
  const chartLabels = useMemo(() => getChartLabels(activeNav), [activeNav]);

  const bloodPressureSeries = useMemo(() => buildBloodPressureSeries(activeNav), [activeNav]);
  const bloodPressure = useMemo(
    () => formatBloodPressure(bloodPressureSeries[bloodPressureSeries.length - 1]),
    [bloodPressureSeries],
  );

  const glucoseSeries = useMemo(() => buildLabeledSeries(activeNav, 6.5, 0.8), [activeNav]);
  const glucose = useMemo(
    () => formatSingleValue(glucoseSeries[glucoseSeries.length - 1].value, { high: 6.1 }),
    [glucoseSeries],
  );

  const heartRateSeries = useMemo(
    () => buildLabeledSeries(activeNav, 72, 5).map(p => ({ ...p, value: Math.round(p.value) })),
    [activeNav],
  );
  const heartRate = useMemo(
    () => formatSingleValue(heartRateSeries[heartRateSeries.length - 1].value, { high: 100, low: 60 }),
    [heartRateSeries],
  );

  const sleepSeries = useMemo(() => buildLabeledSeries(activeNav, 7.2, 0.6), [activeNav]);
  const sleep = useMemo(
    () => formatSingleValue(sleepSeries[sleepSeries.length - 1].value, { low: 6 }),
    [sleepSeries],
  );

  const bloodOxygenSeries = useMemo(
    () => buildLabeledSeries(activeNav, 98, 1).map(p => ({ ...p, value: Math.round(p.value) })),
    [activeNav],
  );
  const bloodOxygen = useMemo(
    () => formatSingleValue(bloodOxygenSeries[bloodOxygenSeries.length - 1].value, { low: 95 }),
    [bloodOxygenSeries],
  );

  const bodyTemperatureSeries = useMemo(() => buildLabeledSeries(activeNav, 36.5, 0.2), [activeNav]);
  const bodyTemperature = useMemo(
    () => formatSingleValue(bodyTemperatureSeries[bodyTemperatureSeries.length - 1].value, { high: 37.3, low: 36 }),
    [bodyTemperatureSeries],
  );

  const stepsSeries = useMemo(
    () => buildLabeledSeries(activeNav, 6500, 800).map(p => ({ ...p, value: Math.round(p.value) })),
    [activeNav],
  );
  const steps = useMemo(
    () => formatSingleValue(stepsSeries[stepsSeries.length - 1].value, { low: 6000 }),
    [stepsSeries],
  );

  const caloriesSeries = useMemo(
    () => buildLabeledSeries(activeNav, 1520, 120).map(p => ({ ...p, value: Math.round(p.value) })),
    [activeNav],
  );
  const caloriesValue = useMemo(
    () => String(Math.round(caloriesSeries[caloriesSeries.length - 1].value)),
    [caloriesSeries],
  );

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

      <ScrollView contentContainerStyle={styles.body}>
        <VitalCard
          label="血压"
          icon={require('@/assets/images/home/bp.png')}
          unit="mmHg"
          value={bloodPressure.value}
          status={bloodPressure.status}
          statusColor={bloodPressure.statusColor}
          chart={<BloodPressureChart data={bloodPressureSeries} labels={chartLabels} />}
        />

        <VitalCard
          label="血糖"
          icon={require('@/assets/images/home/xt.png')}
          unit="mmol/L"
          value={glucose.value}
          status={glucose.status}
          statusColor={glucose.statusColor}
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

        <VitalCard
          label="睡眠"
          icon={require('@/assets/images/home/sleep.png')}
          unit="小时"
          value={sleep.value}
          status={sleep.status}
          statusColor={sleep.statusColor}
          chart={<BloodGlucoseChart data={toHourPoints(sleepSeries)} />}
        />

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
            <Text style={styles.vValue1}>6852/10000</Text>
            <Text style={styles.vUnit}>步</Text>
            <Text style={styles.vText}>・距目标还差1148步</Text>
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
              <Text style={[styles.vValue, { fontSize: 20, lineHeight: 20 }]}>{caloriesValue}</Text>
              <Text style={styles.vUnit}>千卡</Text>
            </View>
            <Flex justify="around" style={styles.vRightBox}>
              <View>
                <Text style={styles.vText1}>静息消耗</Text>
                <Text style={styles.vText2}>1200</Text>
                <Text style={styles.vText1}>千卡</Text>
              </View>
              <View>
                <Text style={styles.vText1}>活动消耗</Text>
                <Text style={styles.vText2}>320</Text>
                <Text style={styles.vText1}>千卡</Text>
              </View>
            </Flex>
          </Flex>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
