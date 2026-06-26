import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Flex, Picker, Toast } from '@ant-design/react-native';
import moment from 'moment';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { addMealDetailList } from '@/api/mealDetail';
import type { FoodIdentifyData, FoodIdentifyItem } from '@/api/mealRecognition';
import styles from '@/css/medication/deal/mealResult';
import PageLayout from '@/src/components/PageLayout';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import { toNumber } from '@/src/features/profile/medication/meal/mealDetailHelpers';
import type { RootStackParamList } from '@/route/router';
import { AppTheme } from '@/common/theme';
import FoodDetailCard, {
    createFoodItemState,
    isGramUnit,
    type FoodItemEditState,
} from './components/FoodDetailCard';
import NutritionTable from './components/NutritionTable';
import {
    buildAggregatedNutritionEntries,
    PREVIEW_NUTRITION_KEYS,
} from './mealNutritionHelpers';
import type { ManualCorrectionSavePayload } from './manualCorrectionHelpers';

function getMealCategoryByTime() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) return 1;
    if (hour >= 11 && hour < 14) return 2;
    if (hour >= 17 && hour < 20) return 3;
    return 4;
}

function buildMealDetailItems(
    items: FoodIdentifyItem[],
    states: FoodItemEditState[],
    timeStr: string,
) {
    return items.map((item, index) => {
        const state = states[index] ?? createFoodItemState(item);
        return {
            mealName: item.mealName || '未知食物',
            servingAmount: state.amount,
            servingUnit: state.unitValue,
            unit: state.unitValue,
            weight: isGramUnit(state.unitValue) ? state.amount : toNumber(item.weight),
            mealCategory: item.mealCategory ?? getMealCategoryByTime(),
            calorie: toNumber(item.calorie),
            protein: toNumber(item.protein),
            fat: toNumber(item.fat),
            carbs: toNumber(item.carbs),
            fiber: toNumber(item.fiber),
            salt: 0,
            waterIntake: 0,
            isWater: 0,
            othersNutrition: (item.othersNutrition ?? {}) as Record<string, never>,
            timeStr,
        };
    });
}

const TIME_PICKER_DATA = [
    Array.from({ length: 24 }, (_, hour) => ({
        label: String(hour).padStart(2, '0'),
        value: hour,
    })),
    Array.from({ length: 60 }, (_, minute) => ({
        label: String(minute).padStart(2, '0'),
        value: minute,
    })),
];

function parseTimeValue(time: string): [number, number] {
    const parsed = moment(time, 'HH:mm', true);
    return parsed.isValid() ? [parsed.hour(), parsed.minute()] : [moment().hour(), moment().minute()];
}

export default function MealResultPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'MealResultPage'>>();
    const result = (route.params ?? {}) as FoodIdentifyData & { hasFood?: boolean };
    const initialAnalysisResult = result.analysisResult ?? [];
    const [foods, setFoods] = useState<FoodIdentifyItem[]>(initialAnalysisResult);
    const [recordTime, setRecordTime] = useState(() => moment().format('HH:mm'));
    const [nutritionExpanded, setNutritionExpanded] = useState(false);
    const [foodItemStates, setFoodItemStates] = useState<FoodItemEditState[]>(() =>
        initialAnalysisResult.map(createFoodItemState),
    );
    const [saving, setSaving] = useState(false);

    const isError = !result.hasFood || foods.length === 0;

    const applyCorrection = useCallback((correction: ManualCorrectionSavePayload) => {
        setFoods(prev => prev.map((food, index) => (index === correction.index ? correction.item : food)));
        setFoodItemStates(prev =>
            prev.map((foodState, index) => (index === correction.index ? correction.state : foodState)),
        );
        setRecordTime(correction.recordTime);
    }, []);

    useEffect(() => {
        navigation.setOptions({ gestureEnabled: false });
    }, [navigation]);

    const totals = useMemo(() => {
        return foods.reduce<{ calorie: number; protein: number; fat: number; carbs: number }>(
            (acc, item) => ({
                calorie: acc.calorie + toNumber(item.calorie),
                protein: acc.protein + toNumber(item.protein),
                fat: acc.fat + toNumber(item.fat),
                carbs: acc.carbs + toNumber(item.carbs),
            }),
            { calorie: 0, protein: 0, fat: 0, carbs: 0 },
        );
    }, [foods]);

    const allNutrition = useMemo(
        () => buildAggregatedNutritionEntries(foods, false),
        [foods],
    );
    const previewNutrition = useMemo(
        () =>
            allNutrition.filter(entry =>
                (PREVIEW_NUTRITION_KEYS as readonly string[]).includes(entry.key),
            ),
        [allNutrition],
    );
    const visibleNutrition = nutritionExpanded ? allNutrition : previewNutrition;
    const showExpandToggle = allNutrition.length > previewNutrition.length;

    const handleSave = useCallback(async () => {
        if (saving || foods.length === 0) return;

        const timeStr = recordTime;
        setSaving(true);
        try {
            const res = (await addMealDetailList({
                mealDetailList: buildMealDetailItems(foods, foodItemStates, timeStr),
                ossId: result.ossId,
                foodIdentifyId: result.foodIdentifyId,
                timeStr,
            })) as { code?: number; msg?: string; message?: string };
            if (isResourceApiOk(res)) {
                Toast.success('记录成功');
                navigation.navigate('Medication', { tab: 'meal', resetMealInput: true });
                return;
            }
            Toast.fail(res?.msg || res?.message || '保存失败');
        } catch (error) {
            Toast.fail('保存失败');
        } finally {
            setSaving(false);
        }
    }, [foods, foodItemStates, recordTime, result.foodIdentifyId, result.ossId, navigation, saving]);

    const updateFoodItemState = useCallback((index: number, next: FoodItemEditState) => {
        setFoodItemStates(prev => prev.map((item, itemIndex) => (itemIndex === index ? next : item)));
    }, []);

 
    return (
        <PageLayout>
            <View style={styles.page}>
                <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                    {result.ossUrl ? (
                        <View style={styles.imageBox}>
                            <Image source={{ uri: result.ossUrl }} style={styles.image} />
                        </View>
                    ) : null}

                    {isError ? (
                        <>
                            <Text style={styles.errorTitle}>未识别到食物</Text>
                            <Text style={styles.errorIntro}>请重新拍摄，或稍后再试。</Text>
                        </>
                    ) : (
                        <>
                            <Flex style={styles.medicationBox} justify="between">
                                <Text style={styles.recordTimeTitle}>记录时间</Text>
                                <Picker
                                    data={TIME_PICKER_DATA}
                                    cols={2}
                                    cascade={false}
                                    value={parseTimeValue(recordTime)}
                                    onOk={values => {
                                        const hour = String(Number(values[0])).padStart(2, '0');
                                        const minute = String(Number(values[1])).padStart(2, '0');
                                        setRecordTime(`${hour}:${minute}`);
                                    }}>
                                    <TouchableOpacity activeOpacity={0.7}>
                                        <Flex>
                                            <Text style={styles.recordTimeValue}>{recordTime}</Text>
                                            <Image
                                                style={styles.recordImg}
                                                source={require('@/assets/images/medication/meal/timeImg.png')}
                                            />
                                        </Flex>
                                    </TouchableOpacity>
                                </Picker>
                            </Flex>
                            <View style={styles.medicationBox}>
                                <Flex>
                                    <Image source={require('@/assets/images/medication/icon.png')} style={styles.cfIcon} />
                                    <Text style={styles.cfIconText}>Life Medicine</Text>
                                </Flex>
                                <Flex style={styles.foodBox}>
                                    <Text style={styles.foodText}>识别到{foods.length}种食物</Text>
                                </Flex>
                                <Flex style={styles.foodInfo}>
                                    <View>
                                        <Text style={styles.heatText}>{totals.calorie.toFixed(0)}</Text>
                                        <Flex>
                                            <Image style={styles.rlImg} source={require('@/assets/images/medication/meal/rl.png')} />
                                            <Text style={styles.rlText}>总热量（千卡）</Text>
                                        </Flex>
                                    </View>
                                    <View style={styles.lineBox} />
                                    <View style={styles.rightBox}>
                                        <Flex justify="between" style={[styles.rightRow, { marginTop: 0 }]}>
                                            <Flex>
                                                <Image style={styles.rlImg} source={require('@/assets/images/medication/meal/zf.png')} />
                                                <Text style={styles.leftText}>脂肪</Text>
                                            </Flex>
                                            <Text style={styles.leftText}>{totals.fat.toFixed(1)}克</Text>
                                        </Flex>
                                        <Flex justify="between" style={styles.rightRow}>
                                            <Flex>
                                                <Image style={styles.rlImg} source={require('@/assets/images/medication/meal/dbz.png')} />
                                                <Text style={styles.leftText}>蛋白质</Text>
                                            </Flex>
                                            <Text style={styles.leftText}>{totals.protein.toFixed(1)}克</Text>
                                        </Flex>
                                        <Flex justify="between" style={styles.rightRow}>
                                            <Flex>
                                                <Image style={styles.rlImg} source={require('@/assets/images/medication/meal/ts.png')} />
                                                <Text style={styles.leftText}>碳水</Text>
                                            </Flex>
                                            <Text style={styles.leftText}>{totals.carbs.toFixed(1)}克</Text>
                                        </Flex>
                                    </View>
                                </Flex>
                                {visibleNutrition.length > 0 ? (
                                    <>
                                        <View style={styles.btmLine} />
                                        <NutritionTable entries={visibleNutrition} />
                                    </>
                                ) : null}

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

                            <Text style={styles.foodDetailTitle}>食物明细</Text>
                            {foods.map((item, index) => (
                                <FoodDetailCard
                                    key={`${item.mealName}-${index}`}
                                    item={item}
                                    itemIndex={index}
                                    recordTime={recordTime}
                                    state={foodItemStates[index] ?? createFoodItemState(item)}
                                    onChange={next => updateFoodItemState(index, next)}
                                    onCorrected={applyCorrection}
                                />
                            ))}


                        </>



                    )}
                </ScrollView>

                <View style={styles.bottomBar}>
                    {isError ? (
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.primaryBtnText}>重新拍摄</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
                            disabled={saving}
                            onPress={handleSave}>
                            <Text style={styles.primaryBtnText}>{saving ? '保存中...' : '保存到今日摄入'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </PageLayout>
    );
}
