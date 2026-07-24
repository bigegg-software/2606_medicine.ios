import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import { Flex, Picker, Toast } from '@ant-design/react-native';
import moment from 'moment';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { addMealDetailList } from '@/api/mealDetail';
import {
    fillOthersNutrition,
    type FoodIdentifyData,
    type FoodIdentifyItem,
} from '@/api/mealRecognition';
import styles from '@/css/nutrition/mealResult';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import { apiResourceData, isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import { toNumber } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import FoodDetailCard, {
    createFoodItemState,
    type FoodItemEditState,
} from '@/src/features/profile/medication/meal/components/FoodDetailCard';
import {
    buildAggregatedNutritionEntries,
    PREVIEW_NUTRITION_KEYS,
} from '@/src/features/profile/medication/meal/utils/mealNutritionHelpers';
import type { ManualCorrectionSavePayload } from './utils/manualCorrectionHelpers';
import { markMealInputForReset } from '@/src/features/profile/medication/meal/utils/mealInputReset';
import {
    buildFillOthersPayload,
    buildMealDetailItems,
    getMealCategoryByTime,
    MEAL_PERIOD_OPTIONS,
    parseTimeValue,
    TIME_PICKER_DATA,
} from './utils/mealResultHelpers';

export default function MealResultPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'MealResultPage'>>();
    const result = (route.params ?? {}) as FoodIdentifyData & { hasFood?: boolean; mealCategory?: number };
    const initialAnalysisResult = result.analysisResult ?? [];
    const [foods, setFoods] = useState<FoodIdentifyItem[]>(initialAnalysisResult);
    const [recordTime, setRecordTime] = useState(() => moment().format('HH:mm'));
    const [nutritionExpanded, setNutritionExpanded] = useState(false);
    const [foodItemStates, setFoodItemStates] = useState<FoodItemEditState[]>(() =>
        initialAnalysisResult.map(createFoodItemState),
    );
    const [mealCategory, setMealCategory] = useState(() => {
        const fromRoute = result.mealCategory;
        if (fromRoute === 1 || fromRoute === 2 || fromRoute === 3) return fromRoute;
        return getMealCategoryByTime();
    });
    const [saving, setSaving] = useState(false);
    const [othersLoading, setOthersLoading] = useState(false);

    const isError = !result.hasFood || foods.length === 0;
    const isPhotoInput = Boolean(result.ossUrl?.trim());
    const retryActionText = isPhotoInput ? '重新拍摄' : '重新录入';

    const applyCorrection = useCallback((correction: ManualCorrectionSavePayload) => {
        setFoods(prev => prev.map((food, index) => (index === correction.index ? correction.item : food)));
        setFoodItemStates(prev =>
            prev.map((foodState, index) => (index === correction.index ? correction.state : foodState)),
        );
        setRecordTime(correction.recordTime);
    }, []);

    const deleteFood = useCallback((itemIndex: number) => {
        setFoods(prev => prev.filter((_, index) => index !== itemIndex));
        setFoodItemStates(prev => prev.filter((_, index) => index !== itemIndex));
    }, []);

    useEffect(() => {
        navigation.setOptions({
            gestureEnabled: false,
            headerTitle: () => (
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
                    <TouchableOpacity activeOpacity={0.7} style={styles.headerTimeBtn}>
                        <Flex>
                            <Text style={styles.headerTimeText}>添加记录:{recordTime}</Text>
                            <Image style={styles.headerTimeIcon} source={require('@/assets/images/vitals/icon_sj.png')} />
                        </Flex>
                    </TouchableOpacity>
                </Picker>
            ),
        });
    }, [navigation, recordTime]);

    // 图片识别：补充其他营养元素；文字识别不请求
    useEffect(() => {
        if (!isPhotoInput || isError || initialAnalysisResult.length === 0) return;

        let cancelled = false;
        const loadOthers = async () => {
            setOthersLoading(true);
            try {
                const res = (await fillOthersNutrition(
                    buildFillOthersPayload(initialAnalysisResult, result.ossId, result.ossUrl),
                )) as unknown as ApiResult<FoodIdentifyData>;
                if (cancelled) return;
                if (!isResourceApiOk(res)) return;
                const data = apiResourceData(res);
                const nextFoods = data?.analysisResult;
                if (Array.isArray(nextFoods) && nextFoods.length > 0) {
                    setFoods(nextFoods);
                    setFoodItemStates(nextFoods.map(createFoodItemState));
                }
            } catch {
                // 补充失败不影响主流程，保留基础识别结果
            } finally {
                if (!cancelled) setOthersLoading(false);
            }
        };

        void loadOthers();
        return () => {
            cancelled = true;
        };
        // 仅进入页时按初始识别结果请求一次
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPhotoInput, isError]);

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
                mealDetailList: buildMealDetailItems(foods, foodItemStates, timeStr, mealCategory),
                ossId: result.ossId,
                foodIdentifyId: result.foodIdentifyId,
                timeStr,
            })) as { code?: number; msg?: string; message?: string };
            if (isResourceApiOk(res)) {
                Toast.success('记录成功');
                markMealInputForReset();
                navigation.goBack();
                return;
            }
            Toast.show(res?.msg || res?.message || '保存失败');
        } catch {
            Toast.show('保存失败');
        } finally {
            setSaving(false);
        }
    }, [foods, foodItemStates, recordTime, mealCategory, result.foodIdentifyId, result.ossId, navigation, saving]);

    const updateFoodItemState = useCallback((index: number, next: FoodItemEditState) => {
        setFoodItemStates(prev => prev.map((item, itemIndex) => (itemIndex === index ? next : item)));
    }, []);

    return (
        <PageLayout edges={[]}>
            <View style={styles.page}>
                <ScrollView
                    style={styles.scrollNew}
                    contentContainerStyle={styles.bodyContent}
                    showsVerticalScrollIndicator={false}>
                    {isError ? (
                        <View style={styles.errorState}>
                            <Text style={styles.errorTitle}>未识别到食物</Text>
                            <Text style={styles.errorIntro}>请重新拍摄，或稍后再试。</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.mH12}>
                                <Flex justify='between' style={styles.commonWrap}>
                                    <Flex>
                                        <View style={styles.imageBox}>
                                            {result.ossUrl ? (
                                                <Image source={{ uri: result.ossUrl }} style={styles.image} />
                                            ) : (
                                                <Image
                                                    source={require('@/assets/images/medication/default2.png')}
                                                    style={styles.image}
                                                />
                                            )}
                                        </View>
                                        <View style={{ marginLeft: 20 }}>
                                            <Flex>
                                                <Image style={styles.iconImage} source={require('@/assets/images/medication/icon_xj.png')} />
                                                <Text style={styles.iconText}>识别结果</Text>
                                            </Flex>
                                            <Text style={styles.iconTextFood}>识别到{foods.length}种食物</Text>
                                        </View>
                                    </Flex>
                                    <Image style={styles.iconImageBack} source={require('@/assets/images/medication/icon_image.png')} />
                                </Flex>

                                <View style={[styles.commonWrap, styles.summarySplitRow]}>
                                    <View style={styles.rlBox}>
                                        <Text style={styles.rlValue}>{totals.calorie.toFixed(0)}</Text>
                                        <Flex justify="center" style={styles.kllWrap}>
                                            <Image style={styles.rlImg} source={require('@/assets/images/medication/icon_rl.png')} />
                                            <Text style={styles.kllText}>总热量 (千卡)</Text>
                                        </Flex>
                                    </View>
                                    <View style={styles.lineBox} />
                                    <View style={styles.macroList}>
                                        {[
                                            { label: '碳水', value: totals.carbs, color: '#72A1C5' },
                                            { label: '蛋白质', value: totals.protein, color: '#0951AE' },
                                            { label: '脂肪', value: totals.fat, color: '#FB4550' },
                                        ].map(item => (
                                            <Flex key={item.label} align="center" style={styles.macroRow}>
                                                <View style={[styles.macroDot, { backgroundColor: item.color }]} />
                                                <Text style={styles.macroLabel}>{item.label}</Text>
                                                <Text style={styles.macroValue}>{item.value.toFixed(1)}g</Text>
                                            </Flex>
                                        ))}
                                    </View>
                                </View>

                                {isPhotoInput ? (
                                    othersLoading ? (
                                        <View style={styles.nutrientLoading}>
                                            <ActivityIndicator color={AppTheme.primaryColor} />
                                            <Text style={styles.nutrientLoadingText}>正在补充营养成分...</Text>
                                        </View>
                                    ) : allNutrition.length > 0 ? (
                                        <View style={styles.nutrientGrid}>
                                            {allNutrition.map(entry => {
                                                const valueText =
                                                    entry.value % 1 === 0
                                                        ? String(entry.value)
                                                        : entry.value.toFixed(1);
                                                return (
                                                    <View key={entry.key} style={styles.nutrientCard}>
                                                        <Text style={styles.nutrientTitle}>{entry.label}</Text>
                                                        <Flex justify="center" align="end" style={styles.nutrientValueRow}>
                                                            <Text style={styles.nutrientValue}>{valueText}</Text>
                                                            <Text style={styles.nutrientUnit}>{entry.unit}</Text>
                                                        </Flex>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ) : null
                                ) : null}
                            </View>



                            <ImageBackground source={require('@/assets/images/schedule/calendarBack.png')} style={styles.backImage1}>
                                <Flex justify="between" style={{ flex: 1, paddingHorizontal: 27 }}>
                                    <Text style={styles.backImage1Text}>食物明细</Text>
                                </Flex>
                            </ImageBackground>

                            <View style={styles.mH12}>
                                {foods.map((item, index) => {
                                    const state = foodItemStates[index] ?? createFoodItemState(item);
                                    const weight = toNumber(item.weight);
                                    const isGram = String(state.unitValue).includes('克');
                                    const metaText = isGram
                                        ? `${Math.round(state.amount)}克`
                                        : weight > 0
                                            ? `${state.amount}${state.unitValue}·约${weight}克`
                                            : `${state.amount}${state.unitValue}`;
                                    return (
                                        <TouchableOpacity
                                            key={`${item.mealName}-${index}`}
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                navigation.navigate('FoodDetailPage', {
                                                    itemIndex: index,
                                                    item,
                                                    state,
                                                    recordTime,
                                                    onSave: applyCorrection,
                                                    onDelete: deleteFood,
                                                });
                                            }}>
                                            <Flex
                                                justify="between"
                                                align="center"
                                                style={styles.foodItemRow}>
                                                <View>
                                                    <Text style={styles.foodItemName}>{item.mealName || '未知食物'}</Text>
                                                    <Text style={styles.foodItemMeta}>{metaText}</Text>
                                                </View>
                                                <Flex>
                                                    <Text style={styles.foodItemKcal}>{toNumber(item.calorie).toFixed(0)}Kcal</Text>
                                                    <Image style={styles.foodItemRightIcon} source={require('@/assets/images/medication/icon_right.png')} />
                                                </Flex>
                                            </Flex>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {/* {isError ? (
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
                                    <Text style={styles.cfIconText}>识别结果</Text>
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
                    )} */}
                </ScrollView>

                <View style={styles.bottomBar}>
                    {!isError ? (
                        <Flex align="center" style={styles.mealPeriodRow}>
                            <Text style={styles.timeText}>选择时间段：</Text>
                            {MEAL_PERIOD_OPTIONS.map(option => {
                                const selected = mealCategory === option.category;
                                return (
                                    <TouchableOpacity
                                        key={option.category}
                                        activeOpacity={0.7}
                                        style={[
                                            styles.mealPeriodChip,
                                            selected && styles.mealPeriodChipActive,
                                        ]}
                                        onPress={() => setMealCategory(option.category)}>
                                        <Flex align="center" justify="center">
                                            <Image style={styles.csImg} source={option.icon} />
                                            <Text style={styles.csText}>{option.label}</Text>
                                        </Flex>
                                    </TouchableOpacity>
                                );
                            })}
                        </Flex>
                    ) : null}

                    {isError ? (
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.primaryBtnText}>{retryActionText}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
                            disabled={saving}
                            onPress={handleSave}>
                            <Flex style={{ flex: 1 }}>
                                <Image style={styles.primaryBtnIcon} source={require('@/assets/images/schedule/save.png')}></Image>
                                <Text style={styles.primaryBtnText}>{saving ? '保存中...' : '保存'}</Text>
                            </Flex>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </PageLayout >
    );
}
