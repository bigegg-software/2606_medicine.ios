import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { getMealDetailInfo, type MealDetailInfo } from '@/api/mealDetail';
import type { FoodIdentifyItem } from '@/api/mealRecognition';
import styles from '@/css/medication/deal/mealResult';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import {
    mealDetailItemToFoodItem,
    normalizeMealDetailInfo,
} from '@/src/features/profile/medication/meal/mealDetailHelpers';
import FoodDetailCard, {
    createFoodItemStateFromMealDetail,
    type FoodItemEditState,
} from './components/FoodDetailCard';

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

    const updateFoodItemState = useCallback((index: number, next: FoodItemEditState) => {
        setFoodItemStates(prev => prev.map((item, itemIndex) => (itemIndex === index ? next : item)));
    }, []);

    if (loading) {
        return (
            <PageLayout>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    if (!recordInfo || foods.length === 0) {
        return (
            <PageLayout>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#999', fontSize: 14 }}>暂无食物详情</Text>
                </View>
            </PageLayout>
        );
    }

    const recordTime = recordInfo.timeStr || recordInfo.mealDetailList[0]?.timeStr || '--';

    return (
        <PageLayout>
            <View style={styles.page}>
                <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
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

                    <Flex style={styles.medicationBox} justify="between">
                        <Text style={styles.recordTimeTitle}>记录时间</Text>
                        <Flex>
                            <Text style={styles.recordTimeValue}>{recordTime}</Text>
                            <Image
                                style={styles.recordImg}
                                source={require('@/assets/images/medication/meal/timeImg.png')}
                            />
                        </Flex>
                    </Flex>

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
                </ScrollView>
            </View>
        </PageLayout>
    );
}
