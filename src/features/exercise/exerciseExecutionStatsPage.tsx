import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/nutrition/foodRecording';
import NutritionTrendChart from '@/src/features/nutrition/components/NutritionTrendChart';
import type {
  ExPatientRuleModuleCompleteRate,
  ExPatientRuleModuleDayCompleteRateItem,
} from '@/api/exPatientRule';
import {
  EXERCISE_TREND_SERIES,
  buildExerciseExecutionStatsRateCards,
  formatExerciseExecutionRateValue,
  loadExerciseModuleCompleteRate,
  loadExerciseModuleDayCompleteRateList,
  loadExerciseRuleForExecutionStats,
  mapModuleDayRateToTrendChart,
  resolveExerciseStatsDateRange,
  sliceExerciseTrendRowsByRange,
  type ExerciseExecutionRateCard,
  type ExerciseExecutionRateTone,
} from './utils/exerciseExecutionStatsHelpers';

type Route = RouteProp<RootStackParamList, 'ExerciseExecutionStatsPage'>;

const RATE_TAG_STYLE: Record<ExerciseExecutionRateTone, { box: object; text: object }> = {
  ok: { box: styles.rateTagOk, text: styles.rateTagTextOk },
  good: { box: styles.rateTagGood, text: styles.rateTagTextGood },
  warn: { box: styles.rateTagWarn, text: styles.rateTagTextWarn },
  bad: { box: styles.rateTagBad, text: styles.rateTagTextBad },
};

/** 运动处方 · 执行统计 */
export default function ExerciseExecutionStatsPage() {
  const { params } = useRoute<Route>();
  const exPatientRuleId = params?.exPatientRuleId != null
    ? String(params.exPatientRuleId).trim()
    : '';

  const [loading, setLoading] = useState(true);
  const [trendRange, setTrendRange] = useState<7 | 30>(7);
  const [moduleRate, setModuleRate] = useState<ExPatientRuleModuleCompleteRate | null>(null);
  const [dayRows, setDayRows] = useState<ExPatientRuleModuleDayCompleteRateItem[]>([]);

  const rateCards = useMemo<ExerciseExecutionRateCard[]>(
    () => buildExerciseExecutionStatsRateCards(moduleRate),
    [moduleRate],
  );

  const trendList = useMemo(
    () => mapModuleDayRateToTrendChart(sliceExerciseTrendRowsByRange(dayRows, trendRange)),
    [dayRows, trendRange],
  );

  const executionRateValue = useMemo(
    () => formatExerciseExecutionRateValue(moduleRate?.mainCompleteRate),
    [moduleRate],
  );

  const hasData = rateCards.some(card => card.valueText !== '--');

  const loadData = useCallback(async () => {
    if (!exPatientRuleId) {
      setModuleRate(null);
      setDayRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [rate, rule] = await Promise.all([
        loadExerciseModuleCompleteRate(exPatientRuleId),
        loadExerciseRuleForExecutionStats(exPatientRuleId),
      ]);
      setModuleRate(rate);

      const { startDate, endDate } = resolveExerciseStatsDateRange(rule);
      if (!startDate || !endDate) {
        setDayRows([]);
        return;
      }
      const rows = await loadExerciseModuleDayCompleteRateList({
        exPatientRuleId,
        startDate,
        endDate,
      });
      setDayRows(rows);
    } catch {
      setModuleRate(null);
      setDayRows([]);
    } finally {
      setLoading(false);
    }
  }, [exPatientRuleId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  return (
    <PageLayout
      style={styles.container}
      contentStyle={{ flex: 1 }}
      showHeaderBackground={false}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.trendEmpty}>
            <ActivityIndicator color="#6D925E" />
          </View>
        ) : (
          <>
            <ImageBackground
              source={require('@/assets/images/schedule/calendarBack.png')}
              style={styles.backImage1}
            >
              <Flex justify="between" align="center" style={{ flex: 1, paddingHorizontal: 20 }}>
                <Text style={styles.backImage1Text}>总体达标率</Text>
                <Text style={styles.executionRateText}>
                  处方执行率{' '}
                  <Text style={styles.executionRateValueText}>{executionRateValue}</Text>
                </Text>
              </Flex>
            </ImageBackground>
            <View style={styles.rateBox}>
              {rateCards.map(card => {
                const tagStyle = RATE_TAG_STYLE[card.tone];
                return (
                  <View key={card.key} style={styles.rateItem}>
                    <Flex justify="between" align="center">
                      <Text style={styles.rateItemTitle}>{card.title}</Text>
                      {hasData && card.valueText !== '--' ? (
                        <View style={[styles.rateTag, tagStyle.box]}>
                          <Text style={[styles.rateTagText, tagStyle.text]}>
                            {card.statusLabel}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.rateTag, styles.rateTagMuted]}>
                          <Text style={[styles.rateTagText, styles.rateTagTextMuted]}>--</Text>
                        </View>
                      )}
                    </Flex>
                    <Text style={styles.rateItemValue}>{card.valueText}</Text>
                  </View>
                );
              })}
            </View>

            <ImageBackground
              source={require('@/assets/images/schedule/calendarBack.png')}
              style={[styles.backImage1, { marginTop: 15 }]}
            >
              <Flex justify="between" style={{ flex: 1, paddingHorizontal: 20 }}>
                <Text style={styles.backImage1Text}>达标率趋势</Text>
                <Flex style={styles.tabBox}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setTrendRange(7)}
                    style={[styles.tabItem, trendRange === 7 && styles.tabItemActive]}
                  >
                    <Flex justify="center" style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.tabItemText,
                          trendRange === 7 && styles.tabItemTextActive,
                        ]}
                      >
                        近7天
                      </Text>
                    </Flex>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setTrendRange(30)}
                    style={[styles.tabItem, trendRange === 30 && styles.tabItemActive]}
                  >
                    <Flex justify="center" style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.tabItemText,
                          trendRange === 30 && styles.tabItemTextActive,
                        ]}
                      >
                        近30天
                      </Text>
                    </Flex>
                  </TouchableOpacity>
                </Flex>
              </Flex>
            </ImageBackground>
            <View style={styles.trendChartArea}>
              {trendList.length === 0 ? (
                <View style={styles.trendSection}>
                  <View style={styles.trendChartPlaceholder}>
                    <Text style={styles.trendEmptyText}>暂无趋势数据</Text>
                  </View>
                </View>
              ) : (
                <NutritionTrendChart trendList={trendList} series={EXERCISE_TREND_SERIES} />
              )}
              <Text style={styles.baselineHint}>虚线为达标基准线（90%）</Text>
            </View>

            <Flex style={styles.legendRow} justify="center" wrap="wrap">
              {EXERCISE_TREND_SERIES.map(item => (
                <Flex key={item.key} align="center" style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.label}</Text>
                </Flex>
              ))}
            </Flex>
          </>
        )}
      </ScrollView>
    </PageLayout>
  );
}
