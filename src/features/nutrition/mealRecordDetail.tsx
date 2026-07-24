import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { getMealDetailInfo, type MealDetailInfo } from '@/api/mealDetail';
import type { FoodIdentifyItem } from '@/api/mealRecognition';
import styles from '@/css/nutrition/mealResult';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import {
  mealDetailItemToFoodItem,
  normalizeMealDetailInfo,
} from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import FoodDetailCard, {
  createFoodItemStateFromMealDetail,
  type FoodItemEditState,
} from '@/src/features/profile/medication/meal/components/FoodDetailCard';
import {
  buildMealRecordTotals,
  getMealRecordCategoryLabel,
  getMealRecordTime,
} from './utils/mealRecordDetailHelpers';

const MACRO_ROWS = [
  { label: '碳水', key: 'carbs' as const, color: '#72A1C5' },
  { label: '蛋白质', key: 'protein' as const, color: '#0951AE' },
  { label: '脂肪', key: 'fat' as const, color: '#FB4550' },
];

export default function MealRecordDetailPage() {
  const route = useRoute<RouteProp<RootStackParamList, 'MealRecordDetailPage'>>();
  const { mealDetailId } = route.params;

  const [loading, setLoading] = useState(true);
  const [recordInfo, setRecordInfo] = useState<MealDetailInfo | null>(null);
  const [foodItemStates, setFoodItemStates] = useState<FoodItemEditState[]>([]);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMealDetailInfo(mealDetailId);
      const normalized = normalizeMealDetailInfo(
        apiResourceData(res as unknown as ApiResult<MealDetailInfo>) ?? null,
      );
      setRecordInfo(normalized);
      setFoodItemStates(
        normalized?.mealDetailList.map(item => createFoodItemStateFromMealDetail(item)) ?? [],
      );
    } catch {
      setRecordInfo(null);
      setFoodItemStates([]);
    } finally {
      setLoading(false);
    }
  }, [mealDetailId]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const foods = useMemo<FoodIdentifyItem[]>(
    () => recordInfo?.mealDetailList.map(mealDetailItemToFoodItem) ?? [],
    [recordInfo],
  );

  const totals = useMemo(() => buildMealRecordTotals(recordInfo), [recordInfo]);
  const recordTime = useMemo(() => getMealRecordTime(recordInfo), [recordInfo]);
  const categoryLabel = useMemo(
    () => getMealRecordCategoryLabel(recordInfo?.mealDetailList),
    [recordInfo],
  );

  const updateFoodItemState = useCallback((index: number, next: FoodItemEditState) => {
    setFoodItemStates(prev => prev.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }, []);

  if (loading) {
    return (
      <PageLayout style={styles.page} showHeaderBackground={false}>
        <View style={styles.emptyState}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  if (!recordInfo || foods.length === 0) {
    return (
      <PageLayout style={styles.page} showHeaderBackground={false}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>暂无食物详情</Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.page} showHeaderBackground={false} edges={[]}>
      <ScrollView
        style={styles.scrollNew}
        contentContainerStyle={styles.recordDetailContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mH12}>
          <Flex justify="between" style={styles.commonWrap}>
            <Flex align="center" style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.imageBox}>
                {recordInfo.ossUrl ? (
                  <Image source={{ uri: recordInfo.ossUrl }} style={styles.image} />
                ) : (
                  <Image
                    source={require('@/assets/images/medication/default2.png')}
                    style={styles.image}
                  />
                )}
              </View>
              <View style={styles.recordHeaderTextWrap}>
                <Flex align="center">
                  <Image
                    style={styles.iconImage}
                    source={require('@/assets/images/medication/icon_xj.png')}
                  />
                  <Text style={styles.iconText}>{categoryLabel}记录</Text>
                </Flex>
                <Text style={styles.iconTextFood}>共 {foods.length} 种食物</Text>
              </View>
            </Flex>
            <Image
              style={styles.iconImageBack}
              source={require('@/assets/images/medication/icon_image.png')}
            />
          </Flex>

          <View style={[styles.commonWrap, styles.summarySplitRow]}>
            <View style={styles.rlBox}>
              <Text style={styles.rlValue}>{totals.calorie.toFixed(0)}</Text>
              <Flex justify="center" style={styles.kllWrap}>
                <Image
                  style={styles.rlImg}
                  source={require('@/assets/images/medication/icon_rl.png')}
                />
                <Text style={styles.kllText}>总热量 (千卡)</Text>
              </Flex>
            </View>
            <View style={styles.lineBox} />
            <View style={styles.macroList}>
              {MACRO_ROWS.map(item => (
                <Flex key={item.label} align="center" style={styles.macroRow}>
                  <View style={[styles.macroDot, { backgroundColor: item.color }]} />
                  <Text style={styles.macroLabel}>{item.label}</Text>
                  <Text style={styles.macroValue}>{totals[item.key].toFixed(1)}g</Text>
                </Flex>
              ))}
            </View>
          </View>

          <Flex style={styles.commonWrap} justify="between" align="center">
            <Text style={styles.recordTimeTitle}>记录时间</Text>
            <Flex align="center">
              <Text style={styles.recordTimeValue}>{recordTime}</Text>
              <Image
                style={styles.recordImg}
                source={require('@/assets/images/medication/meal/timeImg.png')}
              />
            </Flex>
          </Flex>
        </View>

        <ImageBackground
          source={require('@/assets/images/schedule/calendarBack.png')}
          style={styles.backImage1}
        >
          <Flex align="center" style={{ flex: 1, paddingHorizontal: 27 }}>
            <Text style={styles.backImage1Text}>食物明细</Text>
          </Flex>
        </ImageBackground>

        <View style={[styles.mH12, styles.recordFoodList]}>
          {foods.map((item, index) => (
            <FoodDetailCard
              key={`${item.mealName}-${index}`}
              readOnly
              item={item}
              itemIndex={index}
              recordTime={recordTime}
              state={
                foodItemStates[index] ??
                createFoodItemStateFromMealDetail(recordInfo.mealDetailList[index])
              }
              onChange={next => updateFoodItemState(index, next)}
              onCorrected={() => {}}
            />
          ))}
        </View>
      </ScrollView>
    </PageLayout>
  );
}
