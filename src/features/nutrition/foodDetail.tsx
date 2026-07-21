import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { FoodIdentifyItem } from '@/api/mealRecognition';
import styles from '@/css/nutrition/mealResult';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import { toNumber } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import {
    buildFoodUnitOptions,
    isGramUnit,
    type FoodUnitValue,
} from '@/src/features/profile/medication/meal/utils/foodUnitHelpers';
import { buildItemNutritionEntries } from '@/src/features/profile/medication/meal/utils/mealNutritionHelpers';
import type { FoodItemEditState } from '@/src/features/profile/medication/meal/components/FoodDetailCard';
import type { ManualCorrectionSavePayload } from './utils/manualCorrectionHelpers';
import QuestionnairePercentRulerSlider from '@/src/features/profile/questionnaire/components/QuestionnairePercentRulerSlider';

function getSliderConfig(unitValue: FoodUnitValue) {
    if (isGramUnit(unitValue)) {
        return { min: 10, max: 500, step: 10, majorStep: 50 };
    }
    return { min: 0.5, max: 10, step: 0.5, majorStep: 1 };
}

export default function FoodDetailPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'FoodDetailPage'>>();
    const { itemIndex, recordTime, onDelete, onSave } = route.params;

    const [item, setItem] = useState<FoodIdentifyItem>(route.params.item);
    const [state, setState] = useState<FoodItemEditState>(route.params.state);
    const [sliderKey, setSliderKey] = useState(0);

    const sliderConfig = useMemo(() => getSliderConfig(state.unitValue), [state.unitValue]);
    const unitOptions = useMemo(() => buildFoodUnitOptions(item.unit), [item.unit]);
    const nutritionEntries = useMemo(() => buildItemNutritionEntries(item, false), [item]);

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

    const updateState = useCallback(
        (nextState: FoodItemEditState) => {
            setState(nextState);
            syncToParent(item, nextState);
        },
        [item, syncToParent],
    );

    const handleCorrected = useCallback(
        (payload: ManualCorrectionSavePayload) => {
            setItem(payload.item);
            setState(payload.state);
            onSave?.(payload);
        },
        [onSave],
    );

    const handleSave = useCallback(() => {
        syncToParent(item, state);
        navigation.goBack();
    }, [item, navigation, state, syncToParent]);

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
        const nextAmount = isGramUnit(unitValue)
            ? Math.max(nextConfig.min, Math.min(Math.round(state.amount) || nextConfig.min, nextConfig.max))
            : Math.max(nextConfig.min, Math.min(state.amount || nextConfig.min, nextConfig.max));
        setSliderKey(prev => prev + 1);
        updateState({
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
    }, [handleDelete, navigation]);

    return (
        <PageLayout>
            <View style={styles.page}>
                <ScrollView
                    style={styles.scrollNew}
                    contentContainerStyle={[styles.bodyContent, styles.mH12, { paddingBottom: 24 }]}
                    showsVerticalScrollIndicator={false}>


                    <View style={styles.commonWrap}>
                        <Flex justify="between" align="start" style={{ flex: 1 }}>
                            <View style={{ flex: 1, paddingRight: 12 }}>
                                <Text style={styles.foodItemName}>{item.mealName || '未知食物'}</Text>
                                <Text style={styles.foodItemMeta}>{metaText}</Text>
                            </View>
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
                                    });
                                }}>
                                <Flex align="center">
                                    <Image style={styles.foodManualIcon} source={require('@/assets/images/nutrition/icon_edit.png')} />
                                    <Text style={styles.foodManualText}>手动更正</Text>
                                </Flex>
                            </TouchableOpacity>
                        </Flex>
                        <View style={styles.foodDetailDivider} />
                        <View style={styles.summarySplitRow}>
                            <View style={styles.rlBox}>
                                <Text style={styles.rlValue}>{toNumber(item.calorie).toFixed(0)}</Text>
                                <Flex justify="center" style={styles.kllWrap}>
                                    <Image style={styles.rlImg} source={require('@/assets/images/medication/icon_rl.png')} />
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


                        {/* 其他营养成分 */}
                        {nutritionEntries.length > 0 ? (
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
                                onValueChange={amount => updateState({ ...state, amount })}
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
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
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
