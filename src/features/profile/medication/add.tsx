import React, { useEffect, useMemo, useState } from 'react';
import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex, DatePicker, Picker, Switch, Toast } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { addMedicationPlan } from '@/api/medicationPlan';
import styles from '@/css/medication/add';
import indexStyles from '@/css/medication/index';
import { AppTheme } from '@/common/theme';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';
import {
    WEEKDAY_LABELS,
    buildMedicationPlanPayload,
    loadMedicationDictMaps,
    type MedicationDictMaps,
} from './medicationHelpers';

const DRUG_TYPE_LIST = [
    { label: '片剂', value: '片剂' },
    { label: '胶囊', value: '胶囊' },
    { label: '液体', value: '液体' },
    { label: '滴剂', value: '滴剂' },
    { label: '注射剂', value: '注射剂' },
    { label: '喷雾', value: '喷雾' },
    { label: '膏剂', value: '膏剂' },
    { label: '吸入剂', value: '吸入剂' },
    { label: '贴剂', value: '贴剂' },
    { label: '其他', value: '其他' },
];

const MEAL_RELATION_FALLBACK = [
    { label: '无', value: '无' },
    { label: '饭前', value: '饭前' },
    { label: '饭后', value: '饭后' },
    { label: '随餐', value: '随餐' },
    { label: '睡前', value: '睡前' },
    { label: '晨起空腹', value: '晨起空腹' },
];

const DOSE_UNIT_FALLBACK = [
    { label: '片', value: '片' },
    { label: '粒', value: '粒' },
    { label: '毫升', value: '毫升' },
    { label: '毫克', value: '毫克' },
];

const DEFAULT_TAKE_TIMES = ['08:00', '12:00', '18:00', '20:00'];

const WEEKDAY_LIST = [...WEEKDAY_LABELS];

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

function formatTimeDisplay(time: string) {
    const m = moment(time, 'HH:mm', true);
    return m.isValid() ? m.format('H:mm') : time;
}

function getTakeTimeCount(frequency: number) {
    return Math.max(1, frequency || 1);
}

function parseTimeValue(time: string): [number, number] {
    const m = moment(time, 'HH:mm', true);
    return m.isValid() ? [m.hour(), m.minute()] : [8, 0];
}

function getDefaultTakeTime(index: number, count: number) {
    if (count === 1) {
        return moment().format('HH:mm');
    }
    if (index < DEFAULT_TAKE_TIMES.length) {
        return DEFAULT_TAKE_TIMES[index];
    }
    return moment().format('HH:mm');
}

function syncTakeTimes(prev: string[], count: number) {
    return Array.from({ length: count }, (_, index) => {
        return prev[index] ?? getDefaultTakeTime(index, count);
    });
}

function DoseUnitPicker({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (unit: string) => void;
    options: { label: string; value: string }[];
}) {
    return (
        <Picker
            data={options}
            cols={1}
            value={[value]}
            onOk={values => onChange(String(values[0]))}>
            <TouchableOpacity activeOpacity={0.7} style={styles.doseUnitPicker}>
                <Text style={styles.doseUnitText} numberOfLines={1}>
                    {options.find(item => item.value === value)?.label ?? value}
                </Text>
                <View style={styles.doseUnitArrowWrap}>
                    <View style={styles.doseUnitArrow} />
                </View>
            </TouchableOpacity>
        </Picker>
    );
}

export default function MedicationAddPage() {
    const navigation = useNavigation();
    const [drugName, setDrugName] = useState('');
    const [drugType, setDrugType] = useState('片剂');
    const [dosageSpec, setDosageSpec] = useState('');
    const [mealRelation, setMealRelation] = useState('');
    const [doseAmount, setDoseAmount] = useState('1');
    const [doseUnit, setDoseUnit] = useState('');
    const [dailyFrequency, setDailyFrequency] = useState(1);
    const [takeTimes, setTakeTimes] = useState(() => syncTakeTimes([], 1));
    const [weekDays, setWeekDays] = useState<string[]>(['一', '二', '三', '四', '五']);
    const [cycleStartDate, setCycleStartDate] = useState(moment().format('YYYY-MM-DD'));
    const [continuousMedication, setContinuousMedication] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dictMaps, setDictMaps] = useState<MedicationDictMaps | null>(null);

    const mealRelationList = useMemo(
        () => (dictMaps?.eventBasedOptions.length ? dictMaps.eventBasedOptions : MEAL_RELATION_FALLBACK),
        [dictMaps?.eventBasedOptions],
    );
    const doseUnitList = useMemo(
        () => (dictMaps?.amountUnitOptions.length ? dictMaps.amountUnitOptions : DOSE_UNIT_FALLBACK),
        [dictMaps?.amountUnitOptions],
    );

    useEffect(() => {
        loadMedicationDictMaps()
            .then(maps => {
                setDictMaps(maps);
                setDoseUnit(prev => prev || maps.amountUnitOptions[0]?.value || DOSE_UNIT_FALLBACK[0].value);
                setMealRelation(prev => prev || maps.eventBasedOptions[0]?.value || MEAL_RELATION_FALLBACK[0].value);
            })
            .catch(() => {
                setDictMaps(null);
                setDoseUnit(prev => prev || DOSE_UNIT_FALLBACK[0].value);
                setMealRelation(prev => prev || MEAL_RELATION_FALLBACK[0].value);
            });
    }, []);

    const takeTimeCount = getTakeTimeCount(dailyFrequency);
    const visibleTakeTimes = takeTimes.slice(0, takeTimeCount);

    const setDailyFrequencyCount = (count: number) => {
        const next = getTakeTimeCount(count);
        setDailyFrequency(next);
        setTakeTimes(prev => {
            if (next === 1) {
                return syncTakeTimes([], 1);
            }
            if (next >= 2 && dailyFrequency === 1) {
                return syncTakeTimes([], next);
            }
            return syncTakeTimes(prev, next);
        });
    };

    const updateTakeTime = (index: number, hour: number, minute: number) => {
        setTakeTimes(prev =>
            prev.map((time, i) =>
                i === index ? moment(time, 'HH:mm').hour(hour).minute(minute).format('HH:mm') : time,
            ),
        );
    };

    const onDoseAmountChange = (value: string) => {
        setDoseAmount(value);
    };

    const toggleWeekDay = (day: string) => {
        setWeekDays(prev =>
            prev.includes(day) ? prev.filter(item => item !== day) : [...prev, day],
        );
    };

    const submit = async () => {
        if (!drugName.trim()) {
            Toast.fail('请输入药品名称', 1.5);
            return;
        }
        if (!doseAmount.trim()) {
            Toast.fail('请输入每次服用剂量', 1.5);
            return;
        }
        if (!doseUnit) {
            Toast.fail('请选择剂量单位', 1.5);
            return;
        }
        if (!mealRelation) {
            Toast.fail('请选择与进餐关系', 1.5);
            return;
        }
        if (weekDays.length === 0) {
            Toast.fail('请选择每周用药时间', 1.5);
            return;
        }

        setSubmitting(true);
        try {
            const payload = buildMedicationPlanPayload({
                name: drugName,
                drugType,
                remark: dosageSpec,
                eventBased: mealRelation,
                amount: doseAmount,
                amountUnit: doseUnit,
                medicationFrequency: dailyFrequency,
                timeList: visibleTakeTimes,
                weekDays,
                startDate: cycleStartDate,
                continuousMedication,
                reminderEnabled: true,
            });
            const res = await addMedicationPlan(payload);
            if (!isResourceApiOk(res as any)) {
                Toast.fail((res as any)?.msg || '添加失败', 1.5);
                return;
            }
            Toast.success('添加成功', 1.5);
            navigation.goBack();
        } catch {
            Toast.fail('添加失败', 1.5);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <KeyboardDoneAccessory />
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionTitle}>基础信息</Text>
                <View style={styles.rowBox}>
                    <View>
                        <Text style={styles.rowTitle}>药品名称</Text>
                        <TextInput
                            style={styles.inputBox}
                            placeholder="请输入药品名称"
                            placeholderTextColor={AppTheme.textSecondary}
                            value={drugName}
                            onChangeText={setDrugName}
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                        />
                    </View>
                    <View style={styles.rowLine} />

                    <View>
                        <Text style={styles.rowTitle}>药品类型</Text>
                        <Flex wrap="wrap" style={{ marginBottom: 12, gap: 8 }}>
                            {DRUG_TYPE_LIST.map(item => (
                                <TouchableOpacity
                                    style={[styles.typeItem, drugType === item.value && styles.typeItemActive]}
                                    key={item.value}
                                    onPress={() => setDrugType(item.value)}>
                                    <Flex style={{ flex: 1 }}>
                                        <Text style={[styles.typeItemText, drugType === item.value && styles.typeItemTextActive]}>
                                            {item.label}
                                        </Text>
                                    </Flex>
                                </TouchableOpacity>
                            ))}
                        </Flex>
                    </View>
                    <View style={styles.rowLine} />

                    <View>
                        <Text style={styles.rowTitle}>剂量规格</Text>
                        <TextInput
                            style={styles.inputBox}
                            placeholder="如：500mg/1片/10ml"
                            placeholderTextColor={AppTheme.textSecondary}
                            value={dosageSpec}
                            onChangeText={setDosageSpec}
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                        />
                    </View>
                    <View style={[styles.rowLine, { marginBottom: 20 }]} />
                </View>

                <Text style={styles.sectionTitle}>用药时机</Text>
                <View style={styles.rowBox}>
                    <View>
                        <Text style={styles.rowTitle}>与进餐关系</Text>
                        <Flex wrap="wrap" style={{ marginBottom: 12, gap: 8 }}>
                            {mealRelationList.map(item => (
                                <TouchableOpacity
                                    style={[styles.typeItem, mealRelation === item.value && styles.typeItemActive]}
                                    key={item.value}
                                    onPress={() => setMealRelation(item.value)}>
                                    <Flex style={{ flex: 1 }}>
                                        <Text style={[styles.typeItemText, mealRelation === item.value && styles.typeItemTextActive]}>
                                            {item.label}
                                        </Text>
                                    </Flex>
                                </TouchableOpacity>
                            ))}
                        </Flex>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>用药规则</Text>
                <View style={styles.rowBox}>
                    <Flex justify="between" align="center" style={{ marginBottom: 12 }}>
                        <Text style={styles.rowTitle}>每次服用剂量</Text>
                        <Flex align="center">
                            <TextInput
                                style={styles.numberInput}
                                value={doseAmount}
                                onChangeText={onDoseAmountChange}
                                keyboardType="number-pad"
                                inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                            />
                            <DoseUnitPicker value={doseUnit} onChange={setDoseUnit} options={doseUnitList} />
                        </Flex>
                    </Flex>
                    <View style={styles.rowLine} />

                    <Flex justify="between" align="center">
                        <Text style={styles.rowTitle}>每日服用频次</Text>
                        <Flex align="center">
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={styles.stepperBtn}
                                onPress={() => setDailyFrequencyCount(dailyFrequency - 1)}>
                                <Image source={require('@/assets/images/user/jian.png')} style={styles.stepperIcon} />
                            </TouchableOpacity>
                            <Text style={styles.stepperValue}>{dailyFrequency}</Text>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={styles.stepperBtn}
                                onPress={() => setDailyFrequencyCount(dailyFrequency + 1)}>
                                <Image source={require('@/assets/images/user/jia.png')} style={styles.stepperIcon} />
                            </TouchableOpacity>
                            <Text style={styles.inlineSuffix}>次/天</Text>
                        </Flex>
                    </Flex>
                    <View style={styles.rowLine} />

                    <View>
                        <Text style={styles.rowTitle}>具体服用时间</Text>
                        <Flex wrap="wrap" style={{ marginBottom: 12, gap: 8 }}>
                            {visibleTakeTimes.map((time, index) => {
                                const [hour, minute] = parseTimeValue(time);
                                return <Picker
                                    key={`take-time-${index}`}
                                    data={TIME_PICKER_DATA}
                                    cols={2}
                                    cascade={false}
                                    value={[hour, minute]}
                                    onOk={values => updateTakeTime(index, Number(values[0]), Number(values[1]))}>
                                    <TouchableOpacity activeOpacity={0.7} style={indexStyles.typeItem}>
                                        <Flex style={{ flex: 1 }}>
                                            <Text style={indexStyles.typeItemText}>{formatTimeDisplay(time)}</Text>
                                        </Flex>
                                    </TouchableOpacity>
                                </Picker>
                            })}
                        </Flex>
                    </View>
                    <View style={styles.rowLine} />
                    <View>
                        <Text style={styles.rowTitle}>每周用药时间</Text>
                        <Flex justify='between' style={{ marginBottom: 12, gap: 8 }}>
                            {WEEKDAY_LIST.map(day => (
                                <TouchableOpacity
                                    key={day}
                                    activeOpacity={0.7}
                                    style={[styles.weekdayItem, weekDays.includes(day) && styles.weekdayItemActive]}
                                    onPress={() => toggleWeekDay(day)}>
                                    <Text style={[styles.weekdayItemText, weekDays.includes(day) && styles.weekdayItemTextActive]}>
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </Flex>
                    </View>

                    <View style={styles.rowLine} />

                    <Flex justify="between" align="center">
                        <Text style={styles.rowTitle}>持续用药</Text>
                        <Switch
                            style={styles.switch}
                            checked={continuousMedication}
                            onChange={setContinuousMedication}
                            color={AppTheme.primaryColor}
                        />
                    </Flex>

                    {!continuousMedication ? (
                        <>
                            <View style={styles.rowLine} />
                            <DatePicker
                                precision="day"
                                value={moment(cycleStartDate, 'YYYY-MM-DD').toDate()}
                                onOk={date => setCycleStartDate(moment(date).format('YYYY-MM-DD'))}>
                                <TouchableOpacity activeOpacity={0.7}>
                                    <Flex justify="between" align="center">
                                        <Text style={styles.rowTitle}>用药周期</Text>
                                        <Flex align="center">
                                            <Text style={styles.dateValue}>
                                                {moment(cycleStartDate).format('YYYY年M月D日')}
                                            </Text>
                                            <Image source={require('@/assets/images/user/icon-rl.png')} style={styles.calendarIcon} />
                                        </Flex>
                                    </Flex>
                                </TouchableOpacity>
                            </DatePicker>
                        </>
                    ) : null}
                </View>
            </ScrollView>
            <TouchableOpacity style={styles.addBtn} onPress={submit} disabled={submitting}>
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.addText}>添加用药</Text>
                    )}
                </Flex>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
