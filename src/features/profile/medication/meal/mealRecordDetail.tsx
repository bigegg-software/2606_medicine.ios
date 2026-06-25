import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import moment from 'moment';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { getMealDetailInfo, type MealDetailItem } from '@/api/mealDetail';
import styles from '@/css/medication/deal/mealResult';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import {
    formatMealServingText,
    formatNutritionNumber,
    toNumber,
} from '@/src/features/profile/medication/meal/mealDetailHelpers';
import NutritionTable from './components/NutritionTable';
import {
    buildMealDetailNutritionEntries,
    PREVIEW_NUTRITION_KEYS,
} from './mealNutritionHelpers';

const MEAL_CATEGORY_LABELS: Record<number, string> = {
    1: '早餐',
    2: '午餐',
    3: '晚餐',
    4: '加餐',
};

function formatRecordDate(item: MealDetailItem) {
    if (item.customerLocalDate) {
        const parsed = moment(item.customerLocalDate);
        return parsed.isValid() ? parsed.format('YYYY-MM-DD') : item.customerLocalDate;
    }
    return '--';
}

export default function MealRecordDetailPage() {
    const route = useRoute<RouteProp<RootStackParamList, 'MealRecordDetailPage'>>();
    const { mealDetailId } = route.params;

    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<MealDetailItem | null>(null);
    const [nutritionExpanded, setNutritionExpanded] = useState(false);

    const loadDetail = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMealDetailInfo(mealDetailId);
            setDetail(apiResourceData<MealDetailItem>(res as unknown as ApiResult<MealDetailItem>) ?? null);
        } catch {
            setDetail(null);
        } finally {
            setLoading(false);
        }
    }, [mealDetailId]);

    useFocusEffect(
        useCallback(() => {
            void loadDetail();
        }, [loadDetail]),
    );

    const totals = useMemo(
        () => ({
            calorie: toNumber(detail?.calorie),
            protein: toNumber(detail?.protein),
            fat: toNumber(detail?.fat),
            carbs: toNumber(detail?.carbs),
        }),
        [detail],
    );

    const allNutrition = useMemo(
        () => (detail ? buildMealDetailNutritionEntries(detail) : []),
        [detail],
    );
    const previewNutrition = useMemo(
        () => allNutrition.filter(entry => (PREVIEW_NUTRITION_KEYS as readonly string[]).includes(entry.key)),
        [allNutrition],
    );
    const showExpandToggle = allNutrition.length > previewNutrition.length;

    if (loading) {
        return (
            <PageLayout>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    if (!detail) {
        return (
            <PageLayout>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#999', fontSize: 14 }}>暂无食物详情</Text>
                </View>
            </PageLayout>
        );
    }

    const mealCategoryLabel = MEAL_CATEGORY_LABELS[detail.mealCategory ?? 0] ?? '用餐记录';
    const recordTime = detail.timeStr || '--';
    const recordDate = formatRecordDate(detail);

    return (
        <PageLayout>
            <View style={styles.page}>
                <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                    {detail.ossUrl ? (
                        <View style={styles.imageBox}>
                            <Image source={{ uri: detail.ossUrl }} style={styles.image} />
                        </View>
                    ) : null}

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

                    <View style={styles.medicationBox}>
                        <Flex>
                            <Image source={require('@/assets/images/medication/icon.png')} style={styles.cfIcon} />
                            <Text style={styles.cfIconText}>{mealCategoryLabel}</Text>
                        </Flex>
                        <Flex style={styles.foodBox}>
                            <Text style={styles.foodText}>
                                {detail.mealName || '--'} · {recordDate}
                            </Text>
                        </Flex>
                        <Text style={[styles.foodMeta, { marginBottom: 12 }]}>{formatMealServingText(detail)}</Text>
                        <Flex style={styles.foodInfo}>
                            <View>
                                <Text style={styles.heatText}>{formatNutritionNumber(totals.calorie)}</Text>
                                <Flex>
                                    <Image style={styles.rlImg} source={require('@/assets/images/medication/meal/rl.png')} />
                                    <Text style={styles.rlText}>热量（千卡）</Text>
                                </Flex>
                            </View>
                            <View style={styles.lineBox} />
                            <View style={styles.rightBox}>
                                <Flex justify="between" style={[styles.rightRow, { marginTop: 0 }]}>
                                    <Flex>
                                        <Image style={styles.rlImg} source={require('@/assets/images/medication/meal/zf.png')} />
                                        <Text style={styles.leftText}>脂肪</Text>
                                    </Flex>
                                    <Text style={styles.leftText}>{formatNutritionNumber(totals.fat)}克</Text>
                                </Flex>
                                <Flex justify="between" style={styles.rightRow}>
                                    <Flex>
                                        <Image style={styles.rlImg} source={require('@/assets/images/medication/meal/dbz.png')} />
                                        <Text style={styles.leftText}>蛋白质</Text>
                                    </Flex>
                                    <Text style={styles.leftText}>{formatNutritionNumber(totals.protein)}克</Text>
                                </Flex>
                                <Flex justify="between" style={styles.rightRow}>
                                    <Flex>
                                        <Image style={styles.rlImg} source={require('@/assets/images/medication/meal/ts.png')} />
                                        <Text style={styles.leftText}>碳水</Text>
                                    </Flex>
                                    <Text style={styles.leftText}>{formatNutritionNumber(totals.carbs)}克</Text>
                                </Flex>
                            </View>
                        </Flex>
                        <View style={styles.btmLine} />
                        <NutritionTable entries={nutritionExpanded ? allNutrition : previewNutrition} />

                        {showExpandToggle ? (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={styles.expandToggle}
                                onPress={() => setNutritionExpanded(prev => !prev)}>
                                <Flex justify="center" align="center">
                                    <Text style={styles.expandText}>
                                        {nutritionExpanded ? '收起' : '展开查看更多'}
                                    </Text>
                                    <MaterialIcons
                                        name={nutritionExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                                        size={18}
                                        color="rgba(23,63,125,0.66)"
                                    />
                                </Flex>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </ScrollView>
            </View>
        </PageLayout>
    );
}
