import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import BloodLipidChart from '@/src/features/profile/components/BloodLipidChart';
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
        <BloodLipidChart
          data={chart.points}
          labels={CHART_LABELS}
          hideXAxis
        />
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

function formatHealthStatusHeaderTime(slide?: HealthStatusVitalSlide) {
  const updateTime = formatUpdateTime(slide?.dataTime);
  if (updateTime) return updateTime;
  const hasNoData =
    !slide
    || !slide.value
    || slide.value === '--'
    || slide.status === '暂无数据';
  return hasNoData ? '--' : (slide.key || '--');
}

function VitalSlide({
  slide,
  width,
  onPress,
}: {
  slide: HealthStatusVitalSlide;
  width: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.healthStatusSlide, { width }]}
      onPress={onPress}>
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
                {slide.status === '暂无数据' ? ' ' : '·'}
                {slide.status}
              </Text>
            ) : null}
          </Flex>
        </View>
        <View style={styles.healthStatusChart}>{renderChart(slide.chart)}</View>
      </Flex>
    </TouchableOpacity>
  );
}

export default function HealthStatusCards({ slides }: { slides: HealthStatusVitalSlide[] }) {
  const navigation = useNavigation<Nav>();
  const scrollRef = useRef<ScrollView>(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const loopEnabled = slides.length > 1;

  const loopSlides = useMemo(() => {
    if (!loopEnabled) return slides;
    return [slides[slides.length - 1], ...slides, slides[0]];
  }, [loopEnabled, slides]);

  const activeSlide = slides[activeIndex];

  const scrollToLoopIndex = useCallback((loopIndex: number, animated: boolean) => {
    if (slideWidth <= 0) return;
    scrollRef.current?.scrollTo({ x: loopIndex * slideWidth, animated });
  }, [slideWidth]);

  useEffect(() => {
    if (!loopEnabled || slideWidth <= 0) return;
    scrollToLoopIndex(1, false);
  }, [loopEnabled, scrollToLoopIndex, slideWidth, slides.length]);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth <= 0) return;
    const loopIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);

    if (!loopEnabled) {
      setActiveIndex(Math.max(0, Math.min(loopIndex, slides.length - 1)));
      return;
    }

    if (loopIndex <= 0) {
      setActiveIndex(slides.length - 1);
      scrollToLoopIndex(slides.length, false);
      return;
    }

    if (loopIndex >= slides.length + 1) {
      setActiveIndex(0);
      scrollToLoopIndex(1, false);
      return;
    }

    setActiveIndex(loopIndex - 1);
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
            {formatHealthStatusHeaderTime(activeSlide)}
          </Text>
        </Flex>

        <View
          style={styles.healthStatusSwiperWrap}
          onLayout={event => setSlideWidth(event.nativeEvent.layout.width)}>
          {slideWidth > 0 ? (
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              scrollEventThrottle={16}>
              {loopSlides.map((slide, index) => (
                <VitalSlide
                  key={`${slide.key}-${index}`}
                  slide={slide}
                  width={slideWidth}
                  onPress={() => navigation.navigate(VITAL_ROUTE_MAP[slide.key])}
                />
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
