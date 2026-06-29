import React, { useCallback, useMemo, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getInUseDietPatientRuleInfo, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import { getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import MiniProgressRing from '@/src/features/home/components/MiniProgressRing';
import {
    calcNutritionProgress,
    getDietRuleSummary,
    NUTRITION_RING_THEME,
} from '@/src/features/profile/medication/meal/dietRuleHelpers';
import {
    formatNutritionInteger,
    sumCalories,
    sumProtein,
    sumWaterIntake,
} from '@/src/features/profile/medication/meal/mealDetailHelpers';
import { AppTheme } from '@/common/theme';
import styles from '@/css/chronicDisease/detail';

export default function TodayMealSection() {
    const [loading, setLoading] = useState(true);
    const [dietRule, setDietRule] = useState<DietPatientRuleInfo | null>(null);
    const [todayMealList, setTodayMealList] = useState<MealDetailItem[]>([]);

    const loadMealData = useCallback(async () => {
        try {
            const [ruleRes, todayRes] = await Promise.all([
                getInUseDietPatientRuleInfo(),
                getTodayMealDetailList(),
            ]);
            setDietRule(
                apiResourceData<DietPatientRuleInfo>(ruleRes as unknown as ApiResult<DietPatientRuleInfo>) ?? null,
            );
            setTodayMealList(
                apiResourceData<MealDetailItem[]>(todayRes as unknown as ApiResult<MealDetailItem[]>) ?? [],
            );
        } catch {
            setDietRule(null);
            setTodayMealList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadMealData();
        }, [loadMealData]),
    );

    const dietSummary = useMemo(() => getDietRuleSummary(dietRule), [dietRule]);
    const todayWaterMl = useMemo(() => sumWaterIntake(todayMealList), [todayMealList]);
    const todayCalories = useMemo(() => sumCalories(todayMealList), [todayMealList]);
    const todayProtein = useMemo(() => sumProtein(todayMealList), [todayMealList]);

    const calorieProgress = calcNutritionProgress(todayCalories, dietSummary.targetCalories);
    const proteinProgress = calcNutritionProgress(todayProtein, dietSummary.targetProtein);
    const waterProgress = calcNutritionProgress(todayWaterMl, dietSummary.targetWater);

    return (
        <>
            <Flex justify="between" style={{ marginTop: 18 }}>
                <Text style={styles.sectionTitle}>今日用餐</Text>
            </Flex>
            <View style={styles.infoBox}>
                {loading ? (
                    <ActivityIndicator color={AppTheme.primaryColor} />
                ) : (
                    <Flex justify="between" style={styles.yyContent}>
                        <View style={styles.yyItem}>
                            <Flex justify="center" align="center">
                                <Text style={styles.yyTitle}>热量</Text>
                                <MiniProgressRing
                                    progress={calorieProgress}
                                    trackColor={NUTRITION_RING_THEME.calorie.trackColor}
                                    progressColors={NUTRITION_RING_THEME.calorie.progressColors}
                                />
                            </Flex>
                            <Flex justify="center" style={{ marginTop: 6 }}>
                                <Text style={styles.yyValue}>{formatNutritionInteger(todayCalories)}</Text>
                                <Text style={styles.yyUnit}> /{dietSummary.targetCalories ?? '--'}千卡</Text>
                            </Flex>
                        </View>
                        <View style={styles.yyItem}>
                            <Flex justify="center" align="center">
                                <Text style={styles.yyTitle}>蛋白</Text>
                                <MiniProgressRing
                                    progress={proteinProgress}
                                    trackColor={NUTRITION_RING_THEME.protein.trackColor}
                                    progressColors={NUTRITION_RING_THEME.protein.progressColors}
                                />
                            </Flex>
                            <Flex justify="center" style={{ marginTop: 6 }}>
                                <Text style={styles.yyValue}>{formatNutritionInteger(todayProtein)}</Text>
                                <Text style={styles.yyUnit}> /{dietSummary.targetProtein ?? '--'}克</Text>
                            </Flex>
                        </View>
                        <View style={styles.yyItem}>
                            <Flex justify="center" align="center">
                                <Text style={styles.yyTitle}>饮水</Text>
                                <MiniProgressRing
                                    progress={waterProgress}
                                    trackColor={NUTRITION_RING_THEME.water.trackColor}
                                    progressColors={NUTRITION_RING_THEME.water.progressColors}
                                />
                            </Flex>
                            <Flex justify="center" style={{ marginTop: 6 }}>
                                <Text style={styles.yyValue}>{formatNutritionInteger(todayWaterMl)}</Text>
                                <Text style={styles.yyUnit}> /{dietSummary.targetWater ?? '--'}毫升</Text>
                            </Flex>
                        </View>
                    </Flex>
                )}
            </View>
        </>
    );
}
