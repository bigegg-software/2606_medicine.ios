import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { getMealDetailInfo, type MealDetailInfo, type MealDetailItem } from '@/api/mealDetail';
import styles from '@/css/nutrition/mealResult';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import {
  normalizeMealDetailInfo,
  toNumber,
} from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import { buildMealDetailNutritionEntries } from '@/src/features/profile/medication/meal/utils/mealNutritionHelpers';
import {
  buildMealRecordFoodMeta,
  pickMealRecordDetailItem,
  resolveMealRecordFoodImageUrl,
} from './utils/mealRecordDetailHelpers';

export default function MealRecordDetailPage() {
  const route = useRoute<RouteProp<RootStackParamList, 'MealRecordDetailPage'>>();
  const { mealDetailId } = route.params;

  const [loading, setLoading] = useState(true);
  const [detailItem, setDetailItem] = useState<MealDetailItem | null>(null);
  const [foodImageUrl, setFoodImageUrl] = useState<string | undefined>();

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMealDetailInfo(mealDetailId);
      const normalized = normalizeMealDetailInfo(
        apiResourceData(res as unknown as ApiResult<MealDetailInfo | MealDetailItem>) ?? null,
      );
      const item = pickMealRecordDetailItem(normalized, mealDetailId);
      setDetailItem(item);
      setFoodImageUrl(resolveMealRecordFoodImageUrl(normalized, item));
    } catch {
      setDetailItem(null);
      setFoodImageUrl(undefined);
    } finally {
      setLoading(false);
    }
  }, [mealDetailId]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const metaText = useMemo(
    () => (detailItem ? buildMealRecordFoodMeta(detailItem) : ''),
    [detailItem],
  );

  const nutritionEntries = useMemo(
    () => (detailItem ? buildMealDetailNutritionEntries(detailItem, false) : []),
    [detailItem],
  );

  if (loading) {
    return (
      <PageLayout>
        <View style={styles.emptyState}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  if (!detailItem) {
    return (
      <PageLayout>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>暂无食物详情</Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout edges={[]}>
      <View style={styles.page}>
        <ScrollView
          style={styles.scrollNew}
          contentContainerStyle={[styles.bodyContent, styles.mH12, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.commonWrap, { paddingTop: 20 }]}>
            <Flex align="center">
              <View style={styles.imageBox}>
                {foodImageUrl ? (
                  <Image source={{ uri: foodImageUrl }} style={styles.image} />
                ) : (
                  <Image
                    source={require('@/assets/images/medication/default2.png')}
                    style={styles.image}
                  />
                )}
              </View>
              <View style={[styles.recordHeaderTextWrap, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.foodItemName}>{detailItem.mealName || '未知食物'}</Text>
                <Text style={styles.foodItemMeta}>{metaText}</Text>
              </View>
            </Flex>

            <View style={styles.foodDetailDivider} />

            <View style={styles.summarySplitRow}>
              <View style={styles.rlBox}>
                <Text style={styles.rlValue}>{toNumber(detailItem.calorie).toFixed(0)}</Text>
                <Flex justify="center" style={styles.kllWrap}>
                  <Image
                    style={styles.rlImg}
                    source={require('@/assets/images/medication/icon_rl.png')}
                  />
                  <Text style={styles.kllText}>热量 (千卡)</Text>
                </Flex>
              </View>
              <View style={styles.lineBox} />
              <View style={styles.macroList}>
                {[
                  { label: '碳水', value: toNumber(detailItem.carbs), color: '#72A1C5' },
                  { label: '蛋白质', value: toNumber(detailItem.protein), color: '#0951AE' },
                  { label: '脂肪', value: toNumber(detailItem.fat), color: '#FB4550' },
                ].map(row => (
                  <Flex key={row.label} align="center" style={styles.macroRow}>
                    <View style={[styles.macroDot, { backgroundColor: row.color }]} />
                    <Text style={styles.macroLabel}>{row.label}</Text>
                    <Text style={styles.macroValue}>{row.value.toFixed(1)}g</Text>
                  </Flex>
                ))}
              </View>
            </View>

            {nutritionEntries.length > 0 ? (
              <>
                <View style={styles.foodDetailDivider} />
                <View style={[styles.nutrientGrid, styles.foodDetailNutrientGrid]}>
                  {nutritionEntries.map((entry, entryIndex) => {
                    const valueText =
                      entry.value % 1 === 0 ? String(entry.value) : entry.value.toFixed(1);
                    const isRowLast = entryIndex % 3 === 2;
                    return (
                      <View
                        key={entry.key}
                        style={[
                          styles.nutrientCard,
                          styles.foodDetailNutrientCard,
                          isRowLast && styles.foodDetailNutrientCardLast,
                        ]}
                      >
                        <Text style={styles.nutrientTitle}>{entry.label}</Text>
                        <Flex justify="center" align="end" style={styles.nutrientValueRow}>
                          <Text style={styles.nutrientValue}>{valueText}</Text>
                          <Text style={styles.nutrientUnit}>{entry.unit}</Text>
                        </Flex>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </PageLayout>
  );
}
