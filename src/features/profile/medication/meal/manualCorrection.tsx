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
import styles from '@/css/medication/deal/manualCorrection';
import PageLayout from '@/src/components/PageLayout';
import KeyboardDoneAccessory from '@/src/components/KeyboardDoneAccessory';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import {
    ADDABLE_NUTRIENT_OPTIONS,
    adjustServingAmount,
    buildManualCorrectionForm,
    formToFoodIdentifyItem,
    validateNutrientValue,
    type ManualCorrectionForm,
} from './manualCorrectionHelpers';
import { NUTRITION_UNITS } from './mealNutritionHelpers';

const MANUAL_CORRECTION_KEYBOARD_ACCESSORY_ID = 'manualCorrectionKeyboardDone';

const MAIN_NUTRIENTS = [
    { key: 'calorie', label: '热量', unit: '千卡', icon: require('@/assets/images/medication/meal/rl.png') },
    { key: 'carbs', label: '碳水', unit: 'g', icon: require('@/assets/images/medication/meal/ts.png') },
    { key: 'protein', label: '蛋白质', unit: 'g', icon: require('@/assets/images/medication/meal/dbz.png') },
    { key: 'fat', label: '脂肪', unit: 'g', icon: require('@/assets/images/medication/meal/zf.png') },
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

    const unitLabel = form.servingUnit;

    const availableNutrients = useMemo(
        () => ADDABLE_NUTRIENT_OPTIONS.filter(option => !form.visibleNutrients.includes(option.key)),
        [form.visibleNutrients],
    );

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
            Toast.fail('请输入食物名称');
            return;
        }

        const hasMacro =
            form.protein !== '' || form.fat !== '' || form.carbs !== '' || form.calorie !== '';
        if (!hasMacro) {
            Toast.fail('请至少填写一项营养成分');
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
            Toast.fail('请填写自定义营养成分名称');
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

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={handleConfirm} style={{ marginRight: 16 }}>
                    <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>保存</Text>
                </TouchableOpacity>
            ),
        });
    }, [handleConfirm, navigation]);

    return (
        <PageLayout
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
                        <View style={styles.medicationBox}>
                            <Flex align="center" justify="between">
                                <Text style={styles.fieldLabel}>食物名称</Text>
                                <TextInput
                                    style={styles.nameInput}
                                    value={form.mealName}
                                    onChangeText={mealName => setForm(prev => ({ ...prev, mealName }))}
                                    placeholder="请输入食物名称"
                                    placeholderTextColor="#999999"
                                    inputAccessoryViewID={MANUAL_CORRECTION_KEYBOARD_ACCESSORY_ID}
                                />
                            </Flex>
                            <View style={styles.btmLine} />
                            <Flex justify="between" align="center" style={styles.inputBox}>
                                <Text style={styles.fieldLabel}>分量</Text>
                                <Flex align="center">
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() =>
                                            setForm(prev => ({
                                                ...prev,
                                                servingAmount: adjustServingAmount(
                                                    prev.servingAmount,
                                                    prev.servingUnit,
                                                    -1,
                                                ),
                                            }))
                                        }>
                                        <Image style={styles.btnSize} source={require('@/assets/images/medication/meal/jian1.png')} />
                                    </TouchableOpacity>
                                    <Text style={styles.btnText}>{form.servingAmount}</Text>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() =>
                                            setForm(prev => ({
                                                ...prev,
                                                servingAmount: adjustServingAmount(
                                                    prev.servingAmount,
                                                    prev.servingUnit,
                                                    1,
                                                ),
                                            }))
                                        }>
                                        <Image style={styles.btnSize} source={require('@/assets/images/medication/meal/jia1.png')} />
                                    </TouchableOpacity>
                                    <Text style={styles.btnUnit}>{unitLabel}</Text>
                                </Flex>
                            </Flex>
                        </View>

                        <View style={styles.medicationBox}>
                            <Text style={styles.mainTitle}>主要营养成分</Text>
                            {MAIN_NUTRIENTS.map(nutrient => (
                                <Flex key={nutrient.key} justify="between" align="center" style={styles.mainContent}>
                                    <Flex align="center">
                                        <Image style={styles.mainIcon} source={nutrient.icon} />
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
                            ))}
                        </View>

                        <View style={styles.medicationBox}>
                            <Flex justify="between" align="center">
                                <Text style={styles.mainTitle}>其他营养成分</Text>
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
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                        style={styles.addButton}>
                                        <Text style={styles.addText}>添加</Text>
                                    </TouchableOpacity>
                                </Picker>
                            </Flex>
                            {form.visibleNutrients.map(key => {
                                const label =
                                    ADDABLE_NUTRIENT_OPTIONS.find(option => option.key === key)?.label ?? key;
                                const unit = NUTRITION_UNITS[key] ?? '克';
                                return (
                                    <Flex key={key} justify="between" align="center" style={styles.mainContent}>
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
                                                    source={require('@/assets/images/medication/meal/del.png')}
                                                />
                                            </TouchableOpacity>
                                        </Flex>
                                    </Flex>
                                );
                            })}
                            {form.customNutrients.map(nutrient => (
                                <View key={nutrient.id}>
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
                                                    source={require('@/assets/images/medication/meal/del.png')}
                                                />
                                            </TouchableOpacity>
                                        </Flex>
                                    </Flex>
                                    {nutrient.error ? (
                                        <Text style={styles.errorText}>请输入营养成分名称</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>

                        <Text style={styles.noteText}>更正后的数值将用于本次记录的热量与营养计算。</Text>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </PageLayout>
    );
}
