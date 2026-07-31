import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Flex, DatePicker, Picker, Switch, Toast } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import { addMedicationPlan, updateMedicationPlan } from '@/api/medicationPlan';
import styles from '@/css/medication/add';
import { AppTheme } from '@/common/theme';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';
import {
    WEEKDAY_LABELS,
    buildMedicationPlanPayload,
    loadMedicationDictMaps,
    loadMedicationPlanForEdit,
    mapMedicationPlanToFormValues,
    type MedicationDictMaps,
} from './medicationHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'MedicationAddPage'>;

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
                <Image
                    source={require('@/assets/images/medication/icon_right.png')}
                    style={styles.doseUnitArrow}
                />
            </TouchableOpacity>
        </Picker>
    );
}

export default function MedicationAddPage({ route }: Props) {
    const medicationPlanId = route.params?.medicationPlanId;
    const isEdit = medicationPlanId != null;
    const navigation = useNavigation<Nav>();
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
    const [cycleEndDate, setCycleEndDate] = useState(() => moment().add(7, 'day').format('YYYY-MM-DD'));
    const [continuousMedication, setContinuousMedication] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [dictMaps, setDictMaps] = useState<MedicationDictMaps | null>(null);
    const [basicExpanded, setBasicExpanded] = useState(true);
    const [timingExpanded, setTimingExpanded] = useState(true);
    const [rulesExpanded, setRulesExpanded] = useState(true);

    const mealRelationList = dictMaps?.eventBasedOptions ?? [];
    const doseUnitList = dictMaps?.amountUnitOptions ?? [];

    useEffect(() => {
        navigation.setOptions({ title: isEdit ? '编辑用药' : '添加用药记录' });
    }, [isEdit, navigation]);

    useEffect(() => {
        (async () => {
            try {
                const maps = await loadMedicationDictMaps();
                setDictMaps(maps);

                if (isEdit && medicationPlanId != null) {
                    const plan = await loadMedicationPlanForEdit(medicationPlanId);
                    if (!plan) {
                        Toast.show('加载用药计划失败', 1.5);
                        navigation.goBack();
                        return;
                    }
                    const form = mapMedicationPlanToFormValues(plan);
                    setDrugName(form.drugName);
                    setDrugType(form.drugType);
                    setDosageSpec(form.dosageSpec);
                    setMealRelation(form.mealRelation);
                    setDoseAmount(form.doseAmount);
                    setDoseUnit(form.doseUnit);
                    setDailyFrequency(form.dailyFrequency);
                    setTakeTimes(form.takeTimes);
                    setWeekDays(form.weekDays);
                    setCycleStartDate(form.cycleStartDate);
                    setCycleEndDate(form.cycleEndDate);
                    setContinuousMedication(form.continuousMedication);
                } else {
                    setDoseUnit(maps.amountUnitOptions[0]?.value ?? '');
                    setMealRelation(maps.eventBasedOptions[0]?.value ?? '');
                }
            } catch {
                Toast.show('加载数据失败', 1.5);
                if (isEdit) {
                    navigation.goBack();
                }
            } finally {
                setInitializing(false);
            }
        })();
    }, [isEdit, medicationPlanId, navigation]);

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

    const changeDoseAmount = (delta: number) => {
        const current = Number(doseAmount);
        const base = Number.isFinite(current) && current > 0 ? current : 1;
        const next = Math.max(1, Math.round((base + delta) * 10) / 10);
        setDoseAmount(Number.isInteger(next) ? String(next) : next.toFixed(1));
    };

    const toggleWeekDay = (day: string) => {
        setWeekDays(prev =>
            prev.includes(day) ? prev.filter(item => item !== day) : [...prev, day],
        );
    };

    const takeTimeStacked = visibleTakeTimes.length > 3;
    const takeTimeChips = visibleTakeTimes.map((time, index) => {
        const [hour, minute] = parseTimeValue(time);
        return (
            <Picker
                key={`take-time-${index}`}
                data={TIME_PICKER_DATA}
                cols={2}
                cascade={false}
                value={[hour, minute]}
                onOk={values => updateTakeTime(index, Number(values[0]), Number(values[1]))}>
                <TouchableOpacity activeOpacity={0.7} style={styles.timeChip}>
                    <Text style={styles.timeChipText}>{formatTimeDisplay(time)}</Text>
                    <Image
                        source={require('@/assets/images/medication/icon_right.png')}
                        style={styles.timeChipArrow}
                    />
                </TouchableOpacity>
            </Picker>
        );
    });

    const submit = async () => {
        if (!drugName.trim()) {
            Toast.show('请输入药品名称', 1.5);
            return;
        }
        if (!doseAmount.trim()) {
            Toast.show('请输入每次服用剂量', 1.5);
            return;
        }
        if (!doseUnit) {
            Toast.show('请选择剂量单位', 1.5);
            return;
        }
        if (!mealRelation) {
            Toast.show('请选择与进餐关系', 1.5);
            return;
        }
        if (weekDays.length === 0) {
            Toast.show('请选择每周用药时间', 1.5);
            return;
        }
        if (!continuousMedication) {
            if (!cycleEndDate) {
                Toast.show('请选择结束时间', 1.5);
                return;
            }
            if (moment(cycleEndDate).isBefore(moment(cycleStartDate), 'day')) {
                Toast.show('结束时间不能早于开始时间', 1.5);
                return;
            }
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
                endDate: cycleEndDate,
                continuousMedication,
                reminderEnabled: true,
            });
            const res = isEdit
                ? await updateMedicationPlan({ ...payload, medicationPlanId: medicationPlanId! })
                : await addMedicationPlan(payload);
            if (!isResourceApiOk(res as any)) {
                Toast.show((res as any)?.msg || (isEdit ? '保存失败' : '添加失败'), 1.5);
                return;
            }
            Toast.success(isEdit ? '保存成功' : '添加成功', 1.5);
            navigation.goBack();
        } catch {
            Toast.show(isEdit ? '保存失败' : '添加失败', 1.5);
        } finally {
            setSubmitting(false);
        }
    };

    if (initializing) {
        return (
            <PageLayout
                style={styles.container}
                edges={[]}
                showHeaderBackground={false}
                contentStyle={styles.loadingWrap}>
                <ActivityIndicator color={AppTheme.primaryColor} />
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container} edges={[]} showHeaderBackground={false}>
            <KeyboardDoneAccessory />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}>
                <View style={styles.rowBox}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.sectionHeader}
                        onPress={() => setBasicExpanded(prev => !prev)}>
                        <Text style={styles.sectionTitle}>基础信息</Text>
                        <View style={styles.sectionToggleBtn}>
                            <Image
                                style={styles.sectionToggleIcon}
                                source={
                                    basicExpanded
                                        ? require('@/assets/images/medication/icon_sq.png')
                                        : require('@/assets/images/medication/icon_zk.png')
                                }
                            />
                        </View>
                    </TouchableOpacity>

                    {basicExpanded ? (
                        <>
                            <View style={styles.formRow}>
                                <Text style={styles.formRowLabel} numberOfLines={1}>
                                    药品名称<Text style={styles.requiredMark}> *</Text>
                                </Text>
                                <TextInput
                                    style={styles.formRowInput}
                                    placeholder="请输入药品名称"
                                    placeholderTextColor="#999999"
                                    value={drugName}
                                    onChangeText={setDrugName}
                                    returnKeyType="done"
                                    blurOnSubmit
                                    inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                                />
                            </View>

                            <View>
                                <View style={styles.typeLabelRow}>
                                    <Text style={styles.typeSectionTitle}>药品类型</Text>
                                </View>
                                <Flex wrap="wrap" style={styles.typeList}>
                                    {DRUG_TYPE_LIST.map(item => (
                                        <TouchableOpacity
                                            style={[styles.typeItem, drugType === item.value && styles.typeItemActive]}
                                            key={item.value}
                                            onPress={() => setDrugType(item.value)}>
                                            <Text style={[styles.typeItemText, drugType === item.value && styles.typeItemTextActive]}>
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </Flex>
                            </View>
                        </>
                    ) : null}
                </View>

                <View style={styles.rowBox}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.sectionHeader}
                        onPress={() => setTimingExpanded(prev => !prev)}>
                        <Text style={styles.sectionTitle}>用药时机</Text>
                        <View style={styles.sectionToggleBtn}>
                            <Image
                                style={styles.sectionToggleIcon}
                                source={
                                    timingExpanded
                                        ? require('@/assets/images/medication/icon_sq.png')
                                        : require('@/assets/images/medication/icon_zk.png')
                                }
                            />
                        </View>
                    </TouchableOpacity>

                    {timingExpanded ? (
                        <View>
                            <View style={styles.typeLabelRow}>
                                <Text style={styles.typeSectionTitle}>
                                    与进餐关系<Text style={styles.requiredMark}> *</Text>
                                </Text>
                            </View>
                            <Flex wrap="wrap" style={styles.typeList}>
                                {mealRelationList.map(item => (
                                    <TouchableOpacity
                                        style={[styles.typeItem, mealRelation === item.value && styles.typeItemActive]}
                                        key={item.value}
                                        onPress={() => setMealRelation(item.value)}>
                                        <Text style={[styles.typeItemText, mealRelation === item.value && styles.typeItemTextActive]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </Flex>
                        </View>
                    ) : null}
                </View>

                <View style={[styles.rowBox, rulesExpanded && styles.rowBoxRulesExpanded]}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.sectionHeader}
                        onPress={() => setRulesExpanded(prev => !prev)}>
                        <Text style={styles.sectionTitle}>用药规则</Text>
                        <View style={styles.sectionToggleBtn}>
                            <Image
                                style={styles.sectionToggleIcon}
                                source={
                                    rulesExpanded
                                        ? require('@/assets/images/medication/icon_sq.png')
                                        : require('@/assets/images/medication/icon_zk.png')
                                }
                            />
                        </View>
                    </TouchableOpacity>

                    {rulesExpanded ? (
                        <>
                            <View style={styles.formRow}>
                                <Text style={styles.formRowLabel} numberOfLines={1}>
                                    每次服用剂量<Text style={styles.requiredMark}> *</Text>
                                </Text>
                                <Flex align="center" style={styles.formRowValue}>
                                    <View style={styles.doseStepper}>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            style={styles.doseStepperBtn}
                                            onPress={() => changeDoseAmount(-1)}>
                                            <View style={styles.doseStepperIconWrap}>
                                                <View style={styles.doseStepperMinus} />
                                            </View>
                                        </TouchableOpacity>
                                        <View style={styles.doseStepperValueBox}>
                                            <Text style={styles.doseStepperValueText}>{doseAmount || '1'}</Text>
                                        </View>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            style={styles.doseStepperBtn}
                                            onPress={() => changeDoseAmount(1)}>
                                            <View style={styles.doseStepperIconWrap}>
                                                <View style={styles.doseStepperPlusH} />
                                                <View style={styles.doseStepperPlusV} />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    <DoseUnitPicker value={doseUnit} onChange={setDoseUnit} options={doseUnitList} />
                                </Flex>
                            </View>

                            <View style={styles.formRow}>
                                <Text style={styles.formRowLabel} numberOfLines={1}>
                                    每日服用频次<Text style={styles.requiredMark}> *</Text>
                                </Text>
                                <Flex align="center" style={styles.formRowValue}>
                                    <View style={styles.doseStepper}>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            style={styles.doseStepperBtn}
                                            onPress={() => setDailyFrequencyCount(dailyFrequency - 1)}>
                                            <View style={styles.doseStepperIconWrap}>
                                                <View style={styles.doseStepperMinus} />
                                            </View>
                                        </TouchableOpacity>
                                        <View style={styles.doseStepperValueBox}>
                                            <Text style={styles.doseStepperValueText}>{dailyFrequency}</Text>
                                        </View>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            style={styles.doseStepperBtn}
                                            onPress={() => setDailyFrequencyCount(dailyFrequency + 1)}>
                                            <View style={styles.doseStepperIconWrap}>
                                                <View style={styles.doseStepperPlusH} />
                                                <View style={styles.doseStepperPlusV} />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.inlineSuffix}>次/天</Text>
                                </Flex>
                            </View>

                            <View style={[styles.formSection, !takeTimeStacked && styles.formSectionInline]}>
                                <View style={styles.sectionFieldTitleRow}>
                                    <Text style={styles.sectionFieldTitle}>
                                        具体服用时间<Text style={styles.requiredMark}> *</Text>
                                    </Text>
                                    {!takeTimeStacked ? (
                                        <View style={styles.takeTimeChipsInline}>{takeTimeChips}</View>
                                    ) : null}
                                </View>
                                {takeTimeStacked ? (
                                    <View style={styles.takeTimeChipsBlock}>{takeTimeChips}</View>
                                ) : null}
                            </View>

                            <View style={styles.formSection}>
                                <View style={styles.sectionFieldTitleRow}>
                                    <Text style={styles.sectionFieldTitle}>每周用药时间</Text>
                                </View>
                                <Flex wrap="wrap" style={styles.typeList}>
                                    {WEEKDAY_LIST.map(day => (
                                        <TouchableOpacity
                                            key={day}
                                            activeOpacity={0.7}
                                            style={[styles.typeItem, weekDays.includes(day) && styles.typeItemActive]}
                                            onPress={() => toggleWeekDay(day)}>
                                            <Text style={[styles.typeItemText, weekDays.includes(day) && styles.typeItemTextActive]}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </Flex>
                            </View>

                            <DatePicker
                                precision="day"
                                value={moment(cycleStartDate, 'YYYY-MM-DD').toDate()}
                                onOk={date => {
                                    const nextStart = moment(date).format('YYYY-MM-DD');
                                    setCycleStartDate(nextStart);
                                    if (moment(cycleEndDate).isBefore(nextStart, 'day')) {
                                        setCycleEndDate(nextStart);
                                    }
                                }}>
                                <TouchableOpacity activeOpacity={0.7} style={styles.formRow}>
                                    <Text style={styles.formRowLabel}>开始时间</Text>
                                    <View style={styles.formRowValue}>
                                        <Text style={styles.dateValue}>
                                            {moment(cycleStartDate).format('YYYY年M月D日')}
                                        </Text>
                                        <Image
                                            source={require('@/assets/images/case/icon_rl.png')}
                                            style={styles.dateIcon}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </DatePicker>

                            <View style={[styles.formRow, continuousMedication && styles.formRowLast]}>
                                <Text style={styles.formRowLabel}>持续用药</Text>
                                <Switch
                                    style={styles.switch}
                                    checked={continuousMedication}
                                    onChange={setContinuousMedication}
                                    color={AppTheme.primaryColor}
                                />
                            </View>

                            {!continuousMedication ? (
                                <DatePicker
                                    precision="day"
                                    minDate={moment(cycleStartDate, 'YYYY-MM-DD').toDate()}
                                    value={moment(cycleEndDate, 'YYYY-MM-DD').toDate()}
                                    onOk={date => setCycleEndDate(moment(date).format('YYYY-MM-DD'))}>
                                    <TouchableOpacity activeOpacity={0.7} style={[styles.formRow, styles.formRowLast]}>
                                        <Text style={styles.formRowLabel}>结束时间</Text>
                                        <View style={styles.formRowValue}>
                                            <Text style={styles.dateValue}>
                                                {moment(cycleEndDate).format('YYYY年M月D日')}
                                            </Text>
                                            <Image
                                                source={require('@/assets/images/case/icon_rl.png')}
                                                style={styles.dateIcon}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </DatePicker>
                            ) : null}
                        </>
                    ) : null}
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.bottomBarButtonLeft, submitting && { opacity: 0.6 }]}
                    activeOpacity={0.7}
                    disabled={submitting}
                    onPress={submit}>
                    <Flex style={{ flex: 1 }}>
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Image
                                    style={styles.bottomBarButtonImg}
                                    source={require('@/assets/images/schedule/save.png')}
                                />
                                <Text style={styles.bottomBarButtonTextLeft}>保存</Text>
                            </>
                        )}
                    </Flex>
                </TouchableOpacity>
            </View>
        </PageLayout>
    );
}
