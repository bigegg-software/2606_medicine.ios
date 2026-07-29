import React, { useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { FoodIdentifyItem } from '@/api/mealRecognition';
import type { MealDetailItem } from '@/api/mealDetail';
import styles from '@/css/nutrition/mealResult';
import { toNumber } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import SleepRulerSlider from '@/src/features/profile/vitals/components/SleepRulerSlider';
import NutritionTable from './NutritionTable';
import { buildItemNutritionEntries } from '../utils/mealNutritionHelpers';
import type { ManualCorrectionSavePayload } from '@/src/features/nutrition/utils/manualCorrectionHelpers';
import { useNavigation } from '@react-navigation/native';
import {
    FOOD_UNIT,
    buildFoodUnitOptions,
    isGramUnit,
    resolveFoodUnitValue,
    type FoodUnitValue,
} from '../utils/foodUnitHelpers';
import { resolveAmountAfterUnitChange } from '@/src/features/nutrition/utils/foodServingScaleHelpers';

export {
    FOOD_UNIT_LABELS,
    FOOD_UNITS,
    buildFoodUnitOptions,
    isGramUnit,
    resolveFoodUnitValue,
    type FoodUnitValue,
} from '../utils/foodUnitHelpers';

export type FoodItemEditState = {
    expanded: boolean;
    editMode: boolean;
    amount: number;
    unitValue: FoodUnitValue;
};

export function createFoodItemState(item: FoodIdentifyItem): FoodItemEditState {
    return {
        expanded: true,
        editMode: false,
        amount: toNumber(item.amount ?? 1) || 1,
        unitValue: resolveFoodUnitValue(item.servingUnit, item.unit),
    };
}

export function createFoodItemStateFromMealDetail(item: MealDetailItem): FoodItemEditState {
    return {
        expanded: true,
        editMode: true,
        amount: toNumber(item.servingAmount ?? 1) || 1,
        unitValue: resolveFoodUnitValue(item.servingUnit, item.unit),
    };
}

function getSliderConfig(unitValue: FoodUnitValue) {
    if (isGramUnit(unitValue)) {
        return { min: 10, max: 500, step: 10, patternUnitSize: 50 };
    }
    return { min: 0.5, max: 10, step: 0.5, patternUnitSize: 1 };
}

function formatAmountLabel(amount: number, unitValue: FoodUnitValue) {
    const displayAmount = isGramUnit(unitValue) ? Math.round(amount) : amount;
    return `${displayAmount}${unitValue}`;
}

function formatServingMeta(item: FoodIdentifyItem, state: FoodItemEditState) {
    const amountText = `${state.amount}${state.unitValue}`;
    const weight = toNumber(item.weight);
    if (weight > 0 && !isGramUnit(state.unitValue)) {
        return `${amountText}·约${weight}${FOOD_UNIT.gram}`;
    }
    if (isGramUnit(state.unitValue)) {
        return `${Math.round(state.amount)}${FOOD_UNIT.gram}`;
    }
    return amountText;
}

type Props = {
    item: FoodIdentifyItem;
    itemIndex: number;
    state: FoodItemEditState;
    recordTime: string;
    onChange: (next: FoodItemEditState) => void;
    onCorrected: (payload: ManualCorrectionSavePayload) => void;
    readOnly?: boolean;
};

export default function FoodDetailCard({
    item,
    itemIndex,
    state,
    recordTime,
    onChange,
    onCorrected,
    readOnly = false,
}: Props) {
    const navigation: any = useNavigation();
    const sliderConfig = useMemo(() => getSliderConfig(state.unitValue), [state.unitValue]);
    const unitOptions = useMemo(() => buildFoodUnitOptions(item.unit), [item.unit]);
    const [sliderKey, setSliderKey] = useState(0);

    const calorie = toNumber(item.calorie);
    const protein = toNumber(item.protein);
    const fat = toNumber(item.fat);
    const carbs = toNumber(item.carbs);
    const nutritionEntries = useMemo(() => buildItemNutritionEntries(item, false), [item]);

    const macroRows = useMemo(
        () =>
            [
                { key: 'fat', label: '脂肪', icon: require('@/assets/images/medication/meal/zf.png'), value: fat },
                { key: 'protein', label: '蛋白质', icon: require('@/assets/images/medication/meal/dbz.png'), value: protein },
                { key: 'carbs', label: '碳水', icon: require('@/assets/images/medication/meal/ts.png'), value: carbs },
            ].filter(row => row.value > 0),
        [carbs, fat, protein],
    );
    const showCalorie = calorie > 0;
    const showFoodInfo = showCalorie || macroRows.length > 0;

    const handleEnterEditMode = () => {
        onChange({ ...state, editMode: true });
    };

    const handleCollapse = () => {
        onChange({ ...state, expanded: false, editMode: false });
    };

    const handleExpand = () => {
        onChange({ ...state, expanded: true, editMode: readOnly ? true : state.editMode });
    };

    const showDetailContent = readOnly || (state.expanded && state.editMode);

    const handleUnitChange = (unitValue: FoodUnitValue) => {
        const nextConfig = getSliderConfig(unitValue);
        const nextAmount = resolveAmountAfterUnitChange(
            { item, amount: state.amount, unitValue: state.unitValue },
            state.amount,
            state.unitValue,
            unitValue,
            { min: nextConfig.min, max: nextConfig.max },
        );
        setSliderKey(prev => prev + 1);
        onChange({
            ...state,
            unitValue,
            amount: nextAmount,
            editMode: true,
        });
    };

    const headerAction = readOnly ? null : !state.expanded ? (
        <TouchableOpacity activeOpacity={0.7} onPress={handleExpand}>
            <Flex align="center">
                <Text style={styles.foodExpandText}>展开</Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="rgba(23,63,125,0.66)" />
            </Flex>
        </TouchableOpacity>
    ) : state.editMode ? (
        <TouchableOpacity
            onPress={() => {
                navigation.navigate('ManualCorrectionPage', {
                    itemIndex,
                    item,
                    state,
                    recordTime,
                    onSave: onCorrected,
                });
            }}>
            <Flex align="center">
                <Text style={styles.foodManualText}>手动更正</Text>
            </Flex>
        </TouchableOpacity>

    ) : (
        <TouchableOpacity activeOpacity={0.7} onPress={handleEnterEditMode}>
            <Flex align="center">
                <Text style={styles.foodExpandText}>展开</Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="rgba(23,63,125,0.66)" />
            </Flex>
        </TouchableOpacity>
    );

    return (
        <View style={styles.medicationBox}>
            <Flex justify="between" align="center">
                <View style={styles.foodHeaderMain}>
                    <Text style={styles.foodName}>{item.mealName || '未知食物'}</Text>
                    <Text style={styles.foodMeta}>{formatServingMeta(item, state)}</Text>
                </View>
                {headerAction}
            </Flex>

            {showDetailContent ? (
                <>
                    {showFoodInfo ? (
                        <Flex style={styles.foodInfo}>
                            {showCalorie ? (
                                <View>
                                    <Text style={styles.heatText}>{calorie.toFixed(0)}</Text>
                                    <Flex>
                                        <Image style={styles.rlImg} source={require('@/assets/images/medication/meal/rl.png')} />
                                        <Text style={styles.rlText}>热量（千卡）</Text>
                                    </Flex>
                                </View>
                            ) : null}
                            {showCalorie && macroRows.length > 0 ? <View style={styles.lineBox} /> : null}
                            {macroRows.length > 0 ? (
                                <View style={styles.rightBox}>
                                    {macroRows.map((row, index) => (
                                        <Flex
                                            key={row.key}
                                            justify="between"
                                            style={[styles.rightRow, index === 0 && { marginTop: 0 }]}>
                                            <Flex>
                                                <Image style={styles.rlImg} source={row.icon} />
                                                <Text style={styles.leftText}>{row.label}</Text>
                                            </Flex>
                                            <Text style={styles.leftText}>{row.value.toFixed(1)}{FOOD_UNIT.gram}</Text>
                                        </Flex>
                                    ))}
                                </View>
                            ) : null}
                        </Flex>
                    ) : null}

                    {nutritionEntries.length > 0 ? (
                        <>
                            {showFoodInfo ? <View style={styles.btmLine} /> : null}
                            <NutritionTable entries={nutritionEntries} />
                        </>
                    ) : null}
                    {!readOnly && (showFoodInfo || nutritionEntries.length > 0) ? <View style={styles.btmLine} /> : null}

                    {!readOnly ? (
                        <>
                            <Flex style={styles.foodAmount} justify="center">
                                <Text style={styles.foodAmountText}>
                                    {formatAmountLabel(state.amount, state.unitValue)}
                                </Text>
                            </Flex>

                            <View style={styles.sliderWrap}>
                                <SleepRulerSlider
                                    key={`${state.unitValue}-${sliderKey}`}
                                    min={sliderConfig.min}
                                    max={sliderConfig.max}
                                    step={sliderConfig.step}
                                    patternUnitSize={sliderConfig.patternUnitSize}
                                    initialValue={state.amount}
                                    formatLabel={value =>
                                        isGramUnit(state.unitValue) ? String(Math.round(value)) : String(value)
                                    }
                                    onValueChange={amount => onChange({ ...state, amount })}
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
                                                <Text style={[styles.unitChipText, selected && styles.unitChipTextSelected]}>
                                                    {unit.label}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </>
                    ) : null}

                    {!readOnly ? (
                        <TouchableOpacity activeOpacity={0.7} style={styles.collapseToggle} onPress={handleCollapse}>
                            <Flex justify="center" align="center">
                                <Text style={styles.expandText}>收起</Text>
                                <MaterialIcons
                                    name="keyboard-arrow-up"
                                    size={18}
                                    color="rgba(23,63,125,0.66)"
                                />
                            </Flex>
                        </TouchableOpacity>
                    ) : null}
                </>
            ) : null}
        </View>
    );
}
