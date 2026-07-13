import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Flex } from '@ant-design/react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BloodGlucoseChart from '@/src/features/profile/components/BloodGlucoseChart';
import BloodPressureChart from '@/src/features/profile/components/BloodPressureChart';
import BloodOxygenChart from '@/src/features/profile/components/BloodOxygenChart';
import BodyTemperatureChart from '@/src/features/profile/components/BodyTemperatureChart';
import HeartRateChart from '@/src/features/profile/components/HeartRateChart';
import WeightChart from '@/src/features/profile/components/WeightChart';
import UricAcidChart from '@/src/features/profile/components/UricAcidChart';
import SleepStageChart from '@/src/features/profile/components/SleepStageChart';
import StepsChart from '@/src/features/profile/components/StepsChart';
import { getChartLabels } from '@/src/features/profile/vitals/vitalsHelpers';
import styles from '@/css/assistant/assistant';
import type { RootStackParamList } from '@/route/router';
import type {
  HealthStatusChartSnapshot,
  HealthStatusVitalSlide,
} from '../utils/healthStatusSnapshot';
import type { HealthStatusVitalKey } from '../utils/healthStatusVitals';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const VITAL_ROUTE_MAP = {
  心率: 'HeartRatePage',
  消耗: 'ConsumptionPage',
  血糖: 'BloodSugarPage',
  血压: 'BloodPressurePage',
  步数: 'StepsPage',
  睡眠: 'SleepPage',
  血氧: 'BloodOxygenPage',
  体温: 'BodyTemperaturePage',
  体重: 'WeightPage',
  血脂: 'BloodLipidPage',
  尿酸: 'UricAcidPage',
} as const satisfies Record<HealthStatusVitalKey, keyof RootStackParamList>;

const CHART_LABELS = getChartLabels('today');

function renderChart(chart: HealthStatusChartSnapshot) {
  switch (chart.kind) {
    case 'heart_rate':
      return <HeartRateChart data={chart.points} />;
    case 'bar':
      return (
        <StepsChart
          data={chart.points}
          metricLabel={chart.metricLabel}
          valueUnit={chart.valueUnit}
        />
      );
    case 'glucose':
      return <BloodGlucoseChart data={chart.points} labels={CHART_LABELS} />;
    case 'blood_pressure':
      return <BloodPressureChart data={chart.points} labels={CHART_LABELS} />;
    case 'sleep':
      return <SleepStageChart data={chart.segments} />;
    case 'blood_oxygen':
      return <BloodOxygenChart data={chart.points} labels={CHART_LABELS} />;
    case 'body_temperature':
      return <BodyTemperatureChart data={chart.points} labels={CHART_LABELS} />;
    case 'weight':
      return <WeightChart data={chart.points} />;
    case 'lipid':
      return (
        <View style={styles.healthStatusLipidSummary}>
          <Text style={styles.healthStatusLipidText}>TG {chart.tg}</Text>
          <Text style={styles.healthStatusLipidText}>HDL {chart.hdl}</Text>
          <Text style={styles.healthStatusLipidText}>LDL {chart.ldl}</Text>
        </View>
      );
    case 'uric_acid':
      return <UricAcidChart data={chart.points} labels={CHART_LABELS} />;
    default:
      return null;
  }
}

function formatUpdateTime(dataTime?: string) {
  return dataTime ? `更新于${dataTime}` : '';
}

export default function HealthStatusCards({ slides }: { slides: HealthStatusVitalSlide[] }) {
  const navigation = useNavigation<Nav>();
  const [slideWidth, setSlideWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSlide = slides[activeIndex];

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth <= 0) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(Math.max(0, Math.min(nextIndex, slides.length - 1)));
  };

  if (!slides.length) {
    return null;
  }

  return (
    <View style={styles.healthStatusBox}>
      <View style={styles.healthStatusRow}>
        <Flex justify="between">
          <Text style={styles.healthStatusTitle}>健康状态</Text>
          <Text style={styles.healthStatusTime}>
            {formatUpdateTime(activeSlide?.dataTime) || activeSlide?.key}
          </Text>
        </Flex>

        <View
          style={styles.healthStatusSwiperWrap}
          onLayout={event => setSlideWidth(event.nativeEvent.layout.width)}>
          {slideWidth > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              scrollEventThrottle={16}>
              {slides.map(slide => (
                <TouchableOpacity
                  key={slide.key}
                  activeOpacity={0.85}
                  style={[styles.healthStatusSlide, { width: slideWidth }]}
                  onPress={() => navigation.navigate(VITAL_ROUTE_MAP[slide.key])}>
                  <Flex justify="between" align="center" style={styles.healthStatusContent}>
                    <View style={styles.healthStatusInfo}>
                      <Flex align="end">
                        <Text style={styles.healthValue}>{slide.value}</Text>
                        {slide.unit ? (
                          <Text style={styles.healthValueUnit}> {slide.unit}</Text>
                        ) : null}
                      </Flex>
                      <Flex style={styles.healthStatusValueWrap}>
                        <Text style={styles.healthStatusValueTitle}>{slide.key}</Text>
                        {slide.status ? (
                          <Text style={[styles.healthStatusValueTitle, { color: slide.statusColor }]}>
                            ·{slide.status}
                          </Text>
                        ) : null}
                      </Flex>
                    </View>
                    <View style={styles.healthStatusChart}>{renderChart(slide.chart)}</View>
                  </Flex>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {slides.length > 1 ? (
          <Flex justify="center" style={styles.healthStatusDots}>
            {slides.map((slide, index) => (
              <View
                key={slide.key}
                style={[
                  styles.healthStatusDot,
                  index === activeIndex && styles.healthStatusDotActive,
                ]}
              />
            ))}
          </Flex>
        ) : null}
      </View>
    </View>
  );
}
