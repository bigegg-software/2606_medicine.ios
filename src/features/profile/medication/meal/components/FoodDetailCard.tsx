import React, { useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { FoodIdentifyItem } from '@/api/mealRecognition';
import styles from '@/css/medication/deal/mealResult';
import { toNumber } from '@/src/features/profile/medication/meal/mealDetailHelpers';
import SleepRulerSlider from '@/src/features/profile/vitals/components/SleepRulerSlider';
import NutritionTable from './NutritionTable';
import { buildItemNutritionEntries } from '../mealNutritionHelpers';
import type { ManualCorrectionSavePayload } from '../manualCorrectionHelpers';
import { useNavigation } from '@react-navigation/native';

export const FOOD_UNITS = [
    { label: '份', value: 1 },
    { label: '克', value: 2 },
    { label: '碗', value: 3 },
    { label: '袋', value: 4 },
    { label: '杯', value: 5 },
] as const;

export type FoodItemEditState = {
    expanded: boolean;
    editMode: boolean;
    amount: number;
    unitValue: number;
};

export function createFoodItemState(item: FoodIdentifyItem): FoodItemEditState {
    const unitValue = item.servingUnit ?? 1;
    const matchedUnit = FOOD_UNITS.find(unit => unit.value === unitValue);
    return {
        expanded: true,
        editMode: false,
        amount: toNumber(item.amount ?? 1) || 1,
        unitValue: matchedUnit?.value ?? 1,
    };
}

function getUnitLabel(unitValue: number) {
    return FOOD_UNITS.find(unit => unit.value === unitValue)?.label ?? '份';
}

function getSliderConfig(unitValue: number) {
    if (unitValue === 2) {
        return { min: 10, max: 500, step: 10, patternUnitSize: 50 };
    }
    return { min: 0.5, max: 10, step: 0.5, patternUnitSize: 1 };
}

function formatAmountLabel(amount: number, unitValue: number) {
    const unitLabel = getUnitLabel(unitValue);
    const displayAmount = unitValue === 2 ? Math.round(amount) : amount;
    return `${displayAmount}${unitLabel}`;
}

function formatServingMeta(item: FoodIdentifyItem, state: FoodItemEditState) {
    const unitLabel = getUnitLabel(state.unitValue);
    const weight = toNumber(item.weight);
    const amountText = `${state.amount}${unitLabel}`;
    if (weight > 0 && state.unitValue !== 2) {
        return `${amountText}·约${weight}克`;
    }
    if (state.unitValue === 2) {
        return `${Math.round(state.amount)}克`;
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
};

export default function FoodDetailCard({
    item,
    itemIndex,
    state,
    recordTime,
    onChange,
    onCorrected,
}: Props) {
    const navigation: any = useNavigation();
    const sliderConfig = useMemo(() => getSliderConfig(state.unitValue), [state.unitValue]);
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
        onChange({ ...state, expanded: true });
    };

    const handleUnitChange = (unitValue: number) => {
        const nextConfig = getSliderConfig(unitValue);
        const nextAmount = unitValue === 2
            ? Math.max(nextConfig.min, Math.min(Math.round(state.amount) || nextConfig.min, nextConfig.max))
            : Math.max(nextConfig.min, Math.min(state.amount || nextConfig.min, nextConfig.max));
        setSliderKey(prev => prev + 1);
        onChange({
            ...state,
            unitValue,
            amount: nextAmount,
            editMode: true,
        });
    };

    const headerAction = !state.expanded ? (
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

            {state.expanded && state.editMode ? (
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
                                            <Text style={styles.leftText}>{row.value.toFixed(1)}克</Text>
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
                    {showFoodInfo || nutritionEntries.length > 0 ? <View style={styles.btmLine} /> : null}

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
                                state.unitValue === 2 ? String(Math.round(value)) : String(value)
                            }
                            onValueChange={amount => onChange({ ...state, amount })}
                        />
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.unitRow}>
                        {FOOD_UNITS.map(unit => {
                            const selected = state.unitValue === unit.value;
                            return (
                                <TouchableOpacity
                                    key={unit.label}
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
                </>
            ) : null}
        </View>
    );
}
