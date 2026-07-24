import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Flex, Picker, Toast } from '@ant-design/react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import styles from '@/css/nutrition/manualCorrection';
import PageLayout from '@/src/components/PageLayout';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';
import type { RootStackParamList } from '@/route/router';
import { NUTRITION_UNITS } from '@/src/features/profile/medication/meal/utils/mealNutritionHelpers';
import {
    buildFoodUnitOptions,
    isGramUnit,
    type FoodUnitValue,
} from '@/src/features/profile/medication/meal/utils/foodUnitHelpers';
import {
    ADDABLE_NUTRIENT_OPTIONS,
    buildManualCorrectionForm,
    formToFoodIdentifyItem,
    getServingLimits,
    validateNutrientValue,
    type ManualCorrectionForm,
} from './utils/manualCorrectionHelpers';
import { LinearGradient } from 'expo-linear-gradient';

const MANUAL_CORRECTION_KEYBOARD_ACCESSORY_ID = 'manualCorrectionKeyboardDone';

const MAIN_NUTRIENTS = [
    { key: 'calorie', label: '热量', unit: '千卡', color: '#6D925E' },
    { key: 'carbs', label: '碳水', unit: 'g', color: '#72A1C5' },
    { key: 'protein', label: '蛋白质', unit: 'g', color: '#0951AE' },
    { key: 'fat', label: '脂肪', unit: 'g', color: '#FB4550' },
] as const;

const CUSTOM_NUTRIENT_PICKER_VALUE = '__custom__';

export default function ManualCorrectionPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'ManualCorrectionPage'>>();
    const { itemIndex, item, state, recordTime: initialRecordTime, onSave } = route.params;

    const [form, setForm] = useState<ManualCorrectionForm>(() =>
        buildManualCorrectionForm(item, state, initialRecordTime),
    );
    const scrollRef = useRef<ScrollView>(null);
    const headerHeight = useHeaderHeight();
    const customNutrientCountRef = useRef(form.customNutrients.length);

    const scrollToFocusedInput = useCallback(() => {
        requestAnimationFrame(() => {
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 120);
        });
    }, []);

    const unitOptions = useMemo(() => buildFoodUnitOptions(item.unit), [item.unit]);
    const unitPickerData = useMemo(
        () => unitOptions.map(option => ({ label: option.label, value: option.value })),
        [unitOptions],
    );

    const availableNutrients = useMemo(
        () => ADDABLE_NUTRIENT_OPTIONS.filter(option => !form.visibleNutrients.includes(option.key)),
        [form.visibleNutrients],
    );

    const handleServingAmountChange = useCallback((value: string) => {
        const validated = validateNutrientValue(value);
        if (validated === null) return;
        setForm(prev => ({
            ...prev,
            servingAmount: validated === '' ? 0 : Number(validated),
        }));
    }, []);

    const handleServingUnitChange = useCallback((unitValue: FoodUnitValue) => {
        const { min, max } = getServingLimits(unitValue);
        setForm(prev => {
            const nextAmount = Math.max(min, Math.min(prev.servingAmount || min, max));
            return {
                ...prev,
                servingUnit: unitValue,
                servingAmount: isGramUnit(unitValue)
                    ? Math.round(nextAmount)
                    : parseFloat(nextAmount.toFixed(1)),
            };
        });
    }, []);

    const nutrientPickerData = useMemo(
        () => [
            ...availableNutrients.map(option => ({
                label: option.label,
                value: option.key,
            })),
            { label: '自定义', value: CUSTOM_NUTRIENT_PICKER_VALUE },
        ],
        [availableNutrients],
    );

    const nutrientPickerValue = useMemo(
        () => [nutrientPickerData[0]?.value ?? CUSTOM_NUTRIENT_PICKER_VALUE],
        [nutrientPickerData],
    );

    const updateMacro = useCallback((key: 'calorie' | 'protein' | 'fat' | 'carbs', value: string) => {
        if (key === 'calorie') {
            const validated = validateNutrientValue(value);
            if (validated === null) return;
            setForm(prev => ({ ...prev, calorie: validated }));
            return;
        }

        const validated = validateNutrientValue(value);
        if (validated === null) return;
        setForm(prev => {
            const next = { ...prev, [key]: validated };
            const protein = parseFloat(next.protein || '0');
            const fat = parseFloat(next.fat || '0');
            const carbs = parseFloat(next.carbs || '0');
            next.calorie = String(parseFloat((protein * 4 + carbs * 4 + fat * 9).toFixed(2)));
            return next;
        });
    }, []);

    const updateExtraNutrient = useCallback((key: string, value: string) => {
        const validated = validateNutrientValue(value);
        if (validated === null) return;
        setForm(prev => ({
            ...prev,
            extraNutrition: { ...prev.extraNutrition, [key]: validated },
        }));
    }, []);

    const handleAddNutrient = useCallback((key: string) => {
        setForm(prev => ({
            ...prev,
            visibleNutrients: [...prev.visibleNutrients, key],
            extraNutrition: { ...prev.extraNutrition, [key]: prev.extraNutrition[key] ?? '' },
        }));
    }, []);

    const handleRemoveNutrient = useCallback((key: string) => {
        setForm(prev => {
            const extraNutrition = { ...prev.extraNutrition };
            delete extraNutrition[key];
            return {
                ...prev,
                visibleNutrients: prev.visibleNutrients.filter(itemKey => itemKey !== key),
                extraNutrition,
            };
        });
    }, []);

    const handleAddCustomNutrient = useCallback(() => {
        setForm(prev => ({
            ...prev,
            customNutrients: [
                ...prev.customNutrients,
                { id: String(Date.now()), name: '', amount: '' },
            ],
        }));
        scrollToFocusedInput();
    }, [scrollToFocusedInput]);

    useEffect(() => {
        if (form.customNutrients.length > customNutrientCountRef.current) {
            scrollToFocusedInput();
        }
        customNutrientCountRef.current = form.customNutrients.length;
    }, [form.customNutrients.length, scrollToFocusedInput]);

    const updateCustomNutrient = useCallback((id: string, field: 'name' | 'amount', value: string) => {
        if (field === 'amount') {
            const validated = validateNutrientValue(value);
            if (validated === null) return;
            setForm(prev => ({
                ...prev,
                customNutrients: prev.customNutrients.map(item =>
                    item.id === id ? { ...item, amount: validated } : item,
                ),
            }));
            return;
        }

        setForm(prev => ({
            ...prev,
            customNutrients: prev.customNutrients.map(item =>
                item.id === id
                    ? { ...item, name: value, error: !value.trim() }
                    : item,
            ),
        }));
    }, []);

    const handleRemoveCustomNutrient = useCallback((id: string) => {
        setForm(prev => ({
            ...prev,
            customNutrients: prev.customNutrients.filter(item => item.id !== id),
        }));
    }, []);

    const handleConfirm = useCallback(() => {
        if (!form.mealName.trim()) {
            Toast.show('请输入食物名称');
            return;
        }

        const hasMacro =
            form.protein !== '' || form.fat !== '' || form.carbs !== '' || form.calorie !== '';
        if (!hasMacro) {
            Toast.show('请至少填写一项营养成分');
            return;
        }

        const hasEmptyCustomName = form.customNutrients.some(
            nutrient => !nutrient.name.trim(),
        );
        if (hasEmptyCustomName) {
            setForm(prev => ({
                ...prev,
                customNutrients: prev.customNutrients.map(nutrient => ({
                    ...nutrient,
                    error: !nutrient.name.trim(),
                })),
            }));
            Toast.show('请填写自定义营养成分名称');
            return;
        }

        const result = formToFoodIdentifyItem(form, item);
        onSave?.({
            index: itemIndex,
            item: result.item,
            state: result.state,
            recordTime: form.recordTime,
        });
        navigation.goBack();
    }, [form, item, itemIndex, navigation, onSave]);

    return (
        <PageLayout showHeaderBackground={false}
            keyboardAccessory={
                <KeyboardDoneAccessory nativeID={MANUAL_CORRECTION_KEYBOARD_ACCESSORY_ID} />
            }>
            <View style={styles.page}>
                <KeyboardAvoidingView
                    style={styles.page}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
                    <ScrollView
                        ref={scrollRef}
                        style={styles.body}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag">

                        <View style={styles.commonWrap}>
                            <View style={styles.sectionTitleWrap}>
                                <LinearGradient
                                    colors={['#6D925E', 'rgba(109,146,94,0)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.sectionTitleUnderline}
                                />
                                <Text style={[styles.pageTopBgText, styles.sectionTitleText]}>食物名称</Text>
                            </View>

                            <TextInput
                                style={styles.nameInput}
                                value={form.mealName}
                                onChangeText={mealName => setForm(prev => ({ ...prev, mealName }))}
                                placeholder="请输入食物名称"
                                placeholderTextColor="#999999"
                                inputAccessoryViewID={MANUAL_CORRECTION_KEYBOARD_ACCESSORY_ID}
                            />

                            <Flex align="start" style={styles.servingRow}>
                                <View style={styles.servingCol}>
                                    <View style={[styles.sectionTitleWrap, styles.servingTitleWrap]}>
                                        <LinearGradient
                                            colors={['#6D925E', 'rgba(109,146,94,0)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.sectionTitleUnderline}
                                        />
                                        <Text style={[styles.pageTopBgText, styles.sectionTitleText]}>分量</Text>
                                    </View>
                                    <TextInput
                                        style={styles.servingAmountInput}
                                        value={form.servingAmount ? String(form.servingAmount) : ''}
                                        onChangeText={handleServingAmountChange}
                                        keyboardType="decimal-pad"
                                        placeholder="请输入分量"
                                        placeholderTextColor="#999999"
                                        inputAccessoryViewID={MANUAL_CORRECTION_KEYBOARD_ACCESSORY_ID}
                                    />
                                </View>
                                <View style={styles.servingCol}>
                                    <View style={[styles.sectionTitleWrap, styles.servingTitleWrap]}>
                                        <LinearGradient
                                            colors={['#6D925E', 'rgba(109,146,94,0)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.sectionTitleUnderline}
                                        />
                                        <Text style={[styles.pageTopBgText, styles.sectionTitleText]}>单位</Text>
                                    </View>
                                    <Picker
                                        title="选择单位"
                                        data={unitPickerData}
                                        cols={1}
                                        cascade={false}
                                        value={[form.servingUnit]}
                                        onOk={values => handleServingUnitChange(String(values[0]))}>
                                        <TouchableOpacity activeOpacity={0.7} style={styles.servingUnitBtn}>
                                            <Text style={styles.servingUnitText}>{form.servingUnit}</Text>
                                        </TouchableOpacity>
                                    </Picker>
                                </View>
                            </Flex>
                        </View>


                        <View style={styles.commonWrap}>
                            <View style={styles.sectionTitleWrap}>
                                <LinearGradient
                                    colors={['#6D925E', 'rgba(109,146,94,0)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.sectionTitleUnderline}
                                />
                                <Text style={[styles.pageTopBgText, styles.sectionTitleText]}>主要营养成分</Text>
                            </View>

                            {MAIN_NUTRIENTS.map((nutrient, index) => (
                                <View key={nutrient.key} style={styles.mainRowWrap}>
                                    <Flex justify="between" align="center" style={styles.mainContent}>
                                        <Flex align="center" style={{ flex: 1 }}>
                                            <View style={[styles.mainDot, { backgroundColor: nutrient.color }]} />
                                            <Text style={styles.maiinIconText}>{nutrient.label}</Text>
                                        </Flex>
                                        <Flex align="center">
                                            <TextInput
                                                style={styles.mainValueInput}
                                                value={form[nutrient.key]}
                                                keyboardType="decimal-pad"
                                                inputAccessoryViewID={MANUAL_CORRECTION_KEYBOARD_ACCESSORY_ID}
                                                onChangeText={value =>
                                                    nutrient.key === 'calorie'
                                                        ? updateMacro('calorie', value)
                                                        : updateMacro(nutrient.key, value)
                                                }
                                            />
                                            <Text style={styles.mainUnit}>{nutrient.unit}</Text>
                                        </Flex>
                                    </Flex>
                                    {index < MAIN_NUTRIENTS.length - 1 ? (
                                        <View style={styles.mainDivider} />
                                    ) : null}
                                </View>
                            ))}
                        </View>

                        <View style={styles.commonWrap}>
                            <View style={styles.sectionTitleWrap}>
                                <LinearGradient
                                    colors={['#6D925E', 'rgba(109,146,94,0)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.sectionTitleUnderline}
                                />
                                <Text style={[styles.pageTopBgText, styles.sectionTitleText]}>其他营养成分</Text>
                            </View>


                            {/* <Picker
                                    title="添加营养成分"
                                    data={nutrientPickerData}
                                    cols={1}
                                    cascade={false}
                                    value={nutrientPickerValue}
                                    onOk={values => {
                                        const key = String(values[0]);
                                        if (key === CUSTOM_NUTRIENT_PICKER_VALUE) {
                                            handleAddCustomNutrient();
                                            return;
                                        }
                                        handleAddNutrient(key);
                                    }}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                        style={styles.addButton}>
                                        <Text style={styles.addText}>添加</Text>
                                    </TouchableOpacity>
                                </Picker>
                            </View> */}
                            {form.visibleNutrients.map((key, index) => {
                                const label =
                                    ADDABLE_NUTRIENT_OPTIONS.find(option => option.key === key)?.label ?? key;
                                const unit = NUTRITION_UNITS[key] ?? '克';
                                const isLast =
                                    index === form.visibleNutrients.length - 1 &&
                                    form.customNutrients.length === 0;
                                return (
                                    <View key={key} style={styles.mainRowWrap}>
                                        <Flex justify="between" align="center" style={styles.mainContent}>
                                            <Text style={styles.maiinIconText}>{label}</Text>
                                            <Flex align="center">
                                                <TextInput
                                                    style={styles.mainValueInput}
                                                    value={form.extraNutrition[key] ?? ''}
                                                    keyboardType="decimal-pad"
                                                    inputAccessoryViewID={MANUAL_CORRECTION_KEYBOARD_ACCESSORY_ID}
                                                    onChangeText={value => updateExtraNutrient(key, value)}
                                                />
                                                <Text style={styles.mainUnit}>{unit}</Text>
                                                <TouchableOpacity
                                                    activeOpacity={0.7}
                                                    onPress={() => handleRemoveNutrient(key)}>
                                                    <Image
                                                        style={styles.delIcon}
                                                        source={require('@/assets/images/nutrition/icon_del1.png')}
                                                    />
                                                </TouchableOpacity>
                                            </Flex>
                                        </Flex>
                                        {!isLast ? <View style={styles.mainDivider} /> : null}
                                    </View>
                                );
                            })}
                            {form.customNutrients.map((nutrient, index) => (
                                <View key={nutrient.id} style={styles.mainRowWrap}>
                                    <Flex justify="between" align="center" style={styles.mainContent}>
                                        <TextInput
                                            style={styles.customNameInput}
                                            value={nutrient.name}
                                            placeholder="营养成分名称"
                                            placeholderTextColor="#999999"
                                            inputAccessoryViewID={MANUAL_CORRECTION_KEYBOARD_ACCESSORY_ID}
                                            onFocus={scrollToFocusedInput}
                                            onChangeText={value => updateCustomNutrient(nutrient.id, 'name', value)}
                                        />
                                        <Flex align="center">
                                            <TextInput
                                                style={styles.mainValueInput}
                                                value={nutrient.amount}
                                                keyboardType="decimal-pad"
                                                inputAccessoryViewID={MANUAL_CORRECTION_KEYBOARD_ACCESSORY_ID}
                                                onFocus={scrollToFocusedInput}
                                                onChangeText={value =>
                                                    updateCustomNutrient(nutrient.id, 'amount', value)
                                                }
                                            />
                                            <Text style={styles.mainUnit}>克</Text>
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => handleRemoveCustomNutrient(nutrient.id)}>
                                                <Image
                                                    style={styles.delIcon}
                                                    source={require('@/assets/images/nutrition/icon_del1.png')}
                                                />
                                            </TouchableOpacity>
                                        </Flex>
                                    </Flex>
                                    {nutrient.error ? (
                                        <Text style={styles.errorText}>请输入营养成分名称</Text>
                                    ) : null}
                                    {index < form.customNutrients.length - 1 ? (
                                        <View style={styles.mainDivider} />
                                    ) : null}
                                </View>
                            ))}



                            <Picker
                                title="添加营养成分"
                                data={nutrientPickerData}
                                cols={1}
                                cascade={false}
                                value={nutrientPickerValue}
                                onOk={values => {
                                    const key = String(values[0]);
                                    if (key === CUSTOM_NUTRIENT_PICKER_VALUE) {
                                        handleAddCustomNutrient();
                                        return;
                                    }
                                    handleAddNutrient(key);
                                }}>
                                <TouchableOpacity activeOpacity={0.7} style={styles.addItemBtn}>
                                    <Flex align="center" justify="center">
                                        <Image
                                            style={styles.addItemIcon}
                                            source={require('@/assets/images/nutrition/icon_add.png')}
                                        />
                                        <Text style={styles.addItemText}>添加项目</Text>
                                    </Flex>
                                </TouchableOpacity>
                            </Picker>
                        </View>

                        <Text style={styles.noteText}>更正后的数值将用于本次记录的热量与营养计算。</Text>
                    </ScrollView>

                    <View style={styles.bottomBar}>
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm}>
                            <Flex justify="center" align="center" style={{ flex: 1 }}>
                                <Image
                                    style={styles.primaryBtnIcon}
                                    source={require('@/assets/images/schedule/save.png')}
                                />
                                <Text style={styles.primaryBtnText}>保存更正</Text>
                            </Flex>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </PageLayout>
    );
}
