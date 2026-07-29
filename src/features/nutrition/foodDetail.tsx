import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Flex, Picker, Toast } from '@ant-design/react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
    fillOthersNutrition,
    type FoodIdentifyData,
    type FoodIdentifyItem,
} from '@/api/mealRecognition';
import { addMealDetailList } from '@/api/mealDetail';
import styles from '@/css/nutrition/mealResult';
import PageLayout from '@/src/components/PageLayout';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import { apiResourceData, isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import { toNumber } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import {
    buildFoodUnitOptions,
    isGramUnit,
    type FoodUnitValue,
} from '@/src/features/profile/medication/meal/utils/foodUnitHelpers';
import { buildItemNutritionEntries } from '@/src/features/profile/medication/meal/utils/mealNutritionHelpers';
import {
    createFoodItemState,
    type FoodItemEditState,
} from '@/src/features/profile/medication/meal/components/FoodDetailCard';
import { markMealInputForReset } from '@/src/features/profile/medication/meal/utils/mealInputReset';
import type { ManualCorrectionSavePayload } from './utils/manualCorrectionHelpers';
import QuestionnairePercentRulerSlider from '@/src/features/profile/questionnaire/components/QuestionnairePercentRulerSlider';
import {
    buildFillOthersPayload,
    buildMealDetailItems,
    getMealCategoryByTime,
    MEAL_PERIOD_OPTIONS,
    parseTimeValue,
    TIME_PICKER_DATA,
} from './utils/mealResultHelpers';
import {
    resolveAmountAfterUnitChange,
    scaleFoodItemByServing,
    type FoodServingBaseline,
} from './utils/foodServingScaleHelpers';

function getSliderConfig(unitValue: FoodUnitValue) {
    if (isGramUnit(unitValue)) {
        return { min: 10, max: 500, step: 10, majorStep: 50 };
    }
    return { min: 0.5, max: 10, step: 0.5, majorStep: 1 };
}

export default function FoodDetailPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'FoodDetailPage'>>();
    const { itemIndex, onDelete, onSave, ossId, ossUrl, foodIdentifyId } = route.params;
    const isRecognizeSave = route.params.mode === 'recognizeSave';
    const initialItem = route.params.item;
    const isPhotoInput = Boolean(ossUrl?.trim());

    const [item, setItem] = useState<FoodIdentifyItem>(initialItem);
    const [state, setState] = useState<FoodItemEditState>(route.params.state);
    const [sliderKey, setSliderKey] = useState(0);
    const [recordTime, setRecordTime] = useState(route.params.recordTime);
    const [mealCategory, setMealCategory] = useState(() => {
        const fromRoute = route.params.mealCategory;
        if (fromRoute === 1 || fromRoute === 2 || fromRoute === 3) return fromRoute;
        return getMealCategoryByTime();
    });
    const [saving, setSaving] = useState(false);
    const [othersLoading, setOthersLoading] = useState(false);

    const baselineRef = useRef<FoodServingBaseline>({
        item: initialItem,
        amount: route.params.state.amount,
        unitValue: route.params.state.unitValue,
    });
    const stateRef = useRef(state);
    stateRef.current = state;

    const sliderConfig = useMemo(() => getSliderConfig(state.unitValue), [state.unitValue]);
    const unitOptions = useMemo(() => buildFoodUnitOptions(item.unit), [item.unit]);
    const nutritionEntries = useMemo(() => buildItemNutritionEntries(item, false), [item]);

    const resetBaseline = useCallback((nextItem: FoodIdentifyItem, nextState: FoodItemEditState) => {
        baselineRef.current = {
            item: nextItem,
            amount: nextState.amount,
            unitValue: nextState.unitValue,
        };
    }, []);

    const syncToParent = useCallback(
        (nextItem: FoodIdentifyItem, nextState: FoodItemEditState) => {
            onSave?.({
                index: itemIndex,
                item: nextItem,
                state: nextState,
                recordTime,
            });
        },
        [itemIndex, onSave, recordTime],
    );

    const applyServingChange = useCallback(
        (nextState: FoodItemEditState) => {
            const scaledItem = scaleFoodItemByServing(
                baselineRef.current,
                nextState.amount,
                nextState.unitValue,
            );
            setItem(scaledItem);
            setState(nextState);
            if (!isRecognizeSave) {
                syncToParent(scaledItem, nextState);
            }
        },
        [isRecognizeSave, syncToParent],
    );

    const handleCorrected = useCallback(
        (payload: ManualCorrectionSavePayload) => {
            setItem(payload.item);
            setState(payload.state);
            resetBaseline(payload.item, payload.state);
            // 滑块仅在挂载时读 initialValue，需强制 remount 才能同步分量
            setSliderKey(prev => prev + 1);
            if (isRecognizeSave) {
                setRecordTime(payload.recordTime);
                if (payload.mealCategory === 1 || payload.mealCategory === 2 || payload.mealCategory === 3) {
                    setMealCategory(payload.mealCategory);
                }
                return;
            }
            onSave?.(payload);
        },
        [isRecognizeSave, onSave, resetBaseline],
    );

    const handleSave = useCallback(async () => {
        if (isRecognizeSave) {
            if (saving) return;
            setSaving(true);
            try {
                const res = (await addMealDetailList({
                    mealDetailList: buildMealDetailItems([item], [state], recordTime, mealCategory),
                    ossId,
                    foodIdentifyId,
                    timeStr: recordTime,
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
            return;
        }

        syncToParent(item, state);
        navigation.goBack();
    }, [
        foodIdentifyId,
        isRecognizeSave,
        item,
        mealCategory,
        navigation,
        ossId,
        recordTime,
        saving,
        state,
        syncToParent,
    ]);

    const handleDelete = useCallback(() => {
        Alert.alert('删除食物', `确定删除「${item.mealName || '该食物'}」吗？`, [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: () => {
                    onDelete?.(itemIndex);
                    navigation.goBack();
                },
            },
        ]);
    }, [item.mealName, itemIndex, navigation, onDelete]);

    const handleUnitChange = (unitValue: FoodUnitValue) => {
        const nextConfig = getSliderConfig(unitValue);
        const nextAmount = resolveAmountAfterUnitChange(
            baselineRef.current,
            state.amount,
            state.unitValue,
            unitValue,
            { min: nextConfig.min, max: nextConfig.max },
        );
        setSliderKey(prev => prev + 1);
        applyServingChange({
            ...state,
            unitValue,
            amount: nextAmount,
            editMode: true,
        });
    };

    const metaText = useMemo(() => {
        const weight = toNumber(item.weight);
        if (isGramUnit(state.unitValue)) return `${Math.round(state.amount)}克`;
        if (weight > 0) return `${state.amount}${state.unitValue}·约${weight}克`;
        return `${state.amount}${state.unitValue}`;
    }, [item.weight, state.amount, state.unitValue]);

    useEffect(() => {
        if (isRecognizeSave) {
            navigation.setOptions({
                headerRight: () => null,
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
                                <Image
                                    style={styles.headerTimeIcon}
                                    source={require('@/assets/images/vitals/icon_sj.png')}
                                />
                            </Flex>
                        </TouchableOpacity>
                    </Picker>
                ),
            });
            return;
        }

        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity activeOpacity={0.7} onPress={handleDelete} style={styles.foodDeleteBtn}>
                    <Image
                        style={styles.foodDeleteIcon}
                        source={require('@/assets/images/nutrition/icon_del.png')}
                    />
                </TouchableOpacity>
            ),
        });
    }, [handleDelete, isRecognizeSave, navigation, recordTime]);

    // 图片识别：补充其他营养元素；文字识别不请求
    useEffect(() => {
        if (!isRecognizeSave || !isPhotoInput) return;

        let cancelled = false;
        const loadOthers = async () => {
            setOthersLoading(true);
            try {
                const res = (await fillOthersNutrition(
                    buildFillOthersPayload([initialItem], ossId, ossUrl),
                )) as unknown as ApiResult<FoodIdentifyData>;
                if (cancelled) return;
                if (!isResourceApiOk(res)) return;
                const data = apiResourceData(res);
                const nextFoods = data?.analysisResult;
                if (!Array.isArray(nextFoods) || nextFoods.length === 0) return;

                // 补充后变成多种食物时，切回结果页
                if (nextFoods.length > 1) {
                    navigation.replace('MealResultPage', {
                        analysisResult: nextFoods,
                        hasFood: true,
                        mealCategory,
                        ossId,
                        ossUrl,
                        foodIdentifyId,
                        skipFillOthers: true,
                    });
                    return;
                }

                const nextItem = nextFoods[0];
                const nextState = createFoodItemState(nextItem);
                setItem(nextItem);
                setState(nextState);
                resetBaseline(nextItem, nextState);
                setSliderKey(prev => prev + 1);
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
    }, [isRecognizeSave, isPhotoInput]);

    return (
        <PageLayout>
            <View style={styles.page}>
                <ScrollView
                    style={styles.scrollNew}
                    contentContainerStyle={[styles.bodyContent, styles.mH12, { paddingBottom: 24 }]}
                    showsVerticalScrollIndicator={false}>
                    <View style={styles.commonWrap}>
                        <Flex justify="between" align="center" style={{ flex: 1 }}>
                            <Flex align="center" style={{ flex: 1, paddingRight: 12 }}>
                                <View style={styles.foodDetailCover}>
                                    <Image
                                        style={styles.foodDetailCoverImg}
                                        source={
                                            ossUrl?.trim()
                                                ? { uri: ossUrl.trim() }
                                                : require('@/assets/images/medication/default2.png')
                                        }
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.foodItemName}>{item.mealName || '未知食物'}</Text>
                                    <Text style={styles.foodItemMeta}>{metaText}</Text>
                                </View>
                            </Flex>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={styles.foodManualBtn}
                                onPress={() => {
                                    navigation.navigate('ManualCorrectionPage', {
                                        itemIndex,
                                        item,
                                        state,
                                        recordTime,
                                        onSave: handleCorrected,
                                        ...(isRecognizeSave
                                            ? {
                                                  showMealPeriod: true,
                                                  mealCategory,
                                                  ossId,
                                                  foodIdentifyId,
                                              }
                                            : {}),
                                    });
                                }}>
                                <Flex align="center">
                                    <Image
                                        style={styles.foodManualIcon}
                                        source={require('@/assets/images/nutrition/icon_edit.png')}
                                    />
                                    <Text style={styles.foodManualText}>手动更正</Text>
                                </Flex>
                            </TouchableOpacity>
                        </Flex>
                        <View style={styles.foodDetailDivider} />
                        <View style={styles.summarySplitRow}>
                            <View style={styles.rlBox}>
                                <Text style={styles.rlValue}>{toNumber(item.calorie).toFixed(0)}</Text>
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
                                    { label: '碳水', value: toNumber(item.carbs), color: '#72A1C5' },
                                    { label: '蛋白质', value: toNumber(item.protein), color: '#0951AE' },
                                    { label: '脂肪', value: toNumber(item.fat), color: '#FB4550' },
                                ].map(row => (
                                    <Flex key={row.label} align="center" style={styles.macroRow}>
                                        <View style={[styles.macroDot, { backgroundColor: row.color }]} />
                                        <Text style={styles.macroLabel}>{row.label}</Text>
                                        <Text style={styles.macroValue}>{row.value.toFixed(1)}g</Text>
                                    </Flex>
                                ))}
                            </View>
                        </View>
                        <View style={styles.foodDetailDivider} />

                        {isRecognizeSave && isPhotoInput && othersLoading ? (
                            <View style={styles.nutrientLoading}>
                                <ActivityIndicator color={AppTheme.primaryColor} />
                                <Text style={styles.nutrientLoadingText}>正在补充营养成分...</Text>
                            </View>
                        ) : nutritionEntries.length > 0 ? (
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
                                            ]}>
                                            <Text style={styles.nutrientTitle}>{entry.label}</Text>
                                            <Flex justify="center" align="end" style={styles.nutrientValueRow}>
                                                <Text style={styles.nutrientValue}>{valueText}</Text>
                                                <Text style={styles.nutrientUnit}>{entry.unit}</Text>
                                            </Flex>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : null}
                        <View style={[styles.foodDetailDivider, { marginBottom: 0 }]} />

                        <View style={styles.sliderWrap}>
                            <QuestionnairePercentRulerSlider
                                key={`${state.unitValue}-${sliderKey}`}
                                min={sliderConfig.min}
                                max={sliderConfig.max}
                                step={sliderConfig.step}
                                majorStep={sliderConfig.majorStep}
                                tickWidth={36}
                                initialValue={state.amount}
                                unit={state.unitValue}
                                onValueChange={amount =>
                                    applyServingChange({ ...stateRef.current, amount })
                                }
                            />
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.unitRow}>
                            {unitOptions.map(unit => {
                                const selected = state.unitValue === unit.value;
                                return (
                                    <TouchableOpacity
                                        key={unit.value}
                                        activeOpacity={0.7}
                                        onPress={() => handleUnitChange(unit.value)}>
                                        <View style={[styles.unitChip, selected && styles.unitChipSelected]}>
                                            <Text
                                                style={[
                                                    styles.unitChipText,
                                                    selected && styles.unitChipTextSelected,
                                                ]}>
                                                {unit.label}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </ScrollView>

                <View style={[styles.bottomBar, { paddingBottom: 0 }]}>
                    {isRecognizeSave ? (
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

                    <TouchableOpacity
                        style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
                        disabled={saving}
                        onPress={() => {
                            void handleSave();
                        }}>
                        <Flex justify="center" align="center" style={{ flex: 1 }}>
                            <Image
                                style={styles.primaryBtnIcon}
                                source={require('@/assets/images/schedule/save.png')}
                            />
                            <Text style={styles.primaryBtnText}>保存</Text>
                        </Flex>
                    </TouchableOpacity>
                </View>
            </View>
        </PageLayout>
    );
}
