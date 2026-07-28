import React, { useEffect, useMemo, useState } from 'react';
import {
    Text,
    View,
    ScrollView,
    Image,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, DatePicker, Picker } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import styles from '@/css/chronicDisease/add';
import { AppTheme } from '@/common/theme';
import KeyboardDoneAccessory, { KEYBOARD_DONE_ACCESSORY_ID } from '@/src/components/KeyboardDoneAccessory';
import {
    addChronicDisease,
    getChronicDiseaseInfo,
    updateChronicDisease,
    type ChronicDiseaseRecord,
} from '@/api/chronicDisease';
import { getDictDataByType, DICT_TYPES, type DictDataItem } from '@/api/dict';
import { getMyMedicationPlanList, type MedicationPlan } from '@/api/medicationPlan';
import { isResourceApiOk, apiResourceData } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'ChronicDiseaseAddPage'>;
type DiseaseTypeOption = { label: string; value: string };

async function loadDiseaseTypeOptions(): Promise<DiseaseTypeOption[]> {
    try {
        const res = await getDictDataByType(DICT_TYPES.diseaseType);
        const items = apiResourceData<DictDataItem[]>(
            res as unknown as { code?: number; data?: DictDataItem[] },
        ) ?? [];
        return items
            .filter(item => item.dictValue)
            .map(item => ({
                label: item.dictLabel?.trim() || String(item.dictValue),
                value: String(item.dictValue),
            }));
    } catch {
        return [];
    }
}

async function loadAllMedicationPlans(): Promise<MedicationPlan[]> {
    try {
        const res = await getMyMedicationPlanList();
        const data = apiResourceData<MedicationPlan[]>(
            res as unknown as { code?: number; data?: MedicationPlan[] },
        );
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function isActiveMedicationPlan(plan: MedicationPlan, refDate = moment()): boolean {
    if (plan.courseTreatment === 0) return true;
    const endDate = plan.endDate?.trim();
    if (!endDate) return true;
    const endMoment = moment(endDate, ['YYYY-MM-DD', 'YYYYMMDD'], true);
    if (!endMoment.isValid()) return true;
    return endMoment.endOf('day').isSameOrAfter(moment(refDate).startOf('day'));
}

function filterSelectableMedicationPlans(
    plans: MedicationPlan[],
    preservePlanIds: (string | number)[] = [],
): MedicationPlan[] {
    const preserveSet = new Set(preservePlanIds.map(id => String(id)));
    return plans.filter(plan => {
        const planId = plan.medicationPlanId;
        if (planId != null && preserveSet.has(String(planId))) return true;
        return isActiveMedicationPlan(plan);
    });
}

function resolveDiseaseTypeLabel(
    diseaseType: string | undefined,
    labelMap: Record<string, string>,
): string {
    if (!diseaseType) return '--';
    return labelMap[diseaseType] ?? diseaseType;
}

export default function ChronicDiseaseAddPage({ route }: Props) {
    const recordId = route.params?.id;
    const isEdit = recordId != null;
    const navigation = useNavigation<Nav>();
    const [diseaseType, setDiseaseType] = useState('');
    const [diagnosisDate, setDiagnosisDate] = useState('');
    const [mainSymptoms, setMainSymptoms] = useState('');
    const [selectedPlanIds, setSelectedPlanIds] = useState<(string | number)[]>([]);
    const [diseaseTypeOptions, setDiseaseTypeOptions] = useState<DiseaseTypeOption[]>([]);
    const [medicationPlans, setMedicationPlans] = useState<MedicationPlan[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        navigation.setOptions({ title: isEdit ? '编辑慢病' : '添加慢病' });
    }, [isEdit, navigation]);

    useEffect(() => {
        (async () => {
            try {
                const chronicPromise =
                    isEdit && recordId != null
                        ? getChronicDiseaseInfo(recordId).then(res =>
                            apiResourceData<ChronicDiseaseRecord>(
                                res as unknown as { code?: number; data?: ChronicDiseaseRecord },
                            ),
                        )
                        : Promise.resolve(null);

                const [options, allPlans, chronicData] = await Promise.all([
                    loadDiseaseTypeOptions(),
                    loadAllMedicationPlans(),
                    chronicPromise,
                ]);
                setDiseaseTypeOptions(options);

                const associationIds = (chronicData?.associationMedicationPlanIds ?? []).filter(
                    id => id != null && id !== '',
                );
                setMedicationPlans(filterSelectableMedicationPlans(allPlans, associationIds));

                if (chronicData) {
                    setDiseaseType(chronicData.diseaseType ?? '');
                    setDiagnosisDate(chronicData.diagnosisTime?.slice(0, 7) ?? '');
                    setMainSymptoms(chronicData.mainSymptoms ?? '');
                    setSelectedPlanIds(associationIds);
                }
            } catch {
                Alert.alert('错误', '加载数据失败');
            } finally {
                setInitializing(false);
            }
        })();
    }, [isEdit, recordId]);

    const diseaseTypeLabel = useMemo(
        () => resolveDiseaseTypeLabel(diseaseType, Object.fromEntries(diseaseTypeOptions.map(o => [o.value, o.label]))),
        [diseaseType, diseaseTypeOptions],
    );

    const diagnosisDisplay = useMemo(() => {
        if (!diagnosisDate) return '';
        const [year, month] = diagnosisDate.split('-');
        if (year && month) {
            return `${year}年${Number(month)}月`;
        }
        return '';
    }, [diagnosisDate]);

    const toggleMedicationPlan = (planId: string | number) => {
        setSelectedPlanIds(prev =>
            prev.some(id => id == planId)
                ? prev.filter(id => id != planId)
                : [...prev, planId],
        );
    };

    const submit = async () => {
        if (!diseaseType) {
            Alert.alert('提示', '请选择疾病类型');
            return;
        }
        if (!diagnosisDate) {
            Alert.alert('提示', '请选择确诊日期');
            return;
        }
        if (!mainSymptoms.trim()) {
            Alert.alert('提示', '请填写主要症状');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                diseaseType,
                diagnosisTime: diagnosisDate,
                mainSymptoms: mainSymptoms.trim(),
                associationMedicationPlanIds: selectedPlanIds,
            };
            const res = isEdit && recordId != null
                ? await updateChronicDisease({ ...payload, id: recordId })
                : await addChronicDisease({ ...payload, id: null });
            if (isResourceApiOk(res as { code?: number })) {
                navigation.goBack();
                return;
            }
            const r = res as { msg?: string; message?: string };
            Alert.alert('失败', r.msg ?? r.message ?? '请稍后重试');
        } catch {
            Alert.alert('错误', '网络错误，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    if (initializing) {
        return (
            <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
            <KeyboardDoneAccessory />
            <Flex align="center" style={styles.tipHeader}>
                <Image
                    style={styles.tipIcon}
                    source={require('@/assets/images/case/icon_zd.png')}
                />
                <Text style={styles.tipTitle} numberOfLines={1}>
                    添加您的慢性病，开始日常监测与健康管理
                </Text>
            </Flex>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    contentContainerStyle={styles.body}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag">
                    <View style={[styles.rowBox, { paddingBottom: 0 }]}>
                        <Text style={styles.sectionTitle}>基础信息 <Text style={{ color: "#FB4550" }}>（必填）</Text></Text>
                        {diseaseTypeOptions.length > 0 ? (
                            <Picker
                                data={diseaseTypeOptions}
                                cols={1}
                                value={[diseaseType]}
                                onOk={values => setDiseaseType(String(values[0]))}>
                                <TouchableOpacity activeOpacity={0.7} style={[styles.formRow, styles.formRowFirst]}>
                                    <Text style={styles.formRowLabel}>疾病类型 <Text style={{ color: "#FB4550" }}>*</Text></Text>
                                    <View style={styles.formRowValue}>
                                        <Text style={diseaseType ? styles.formRowValueText : styles.formRowPlaceholder}>
                                            {diseaseType ? diseaseTypeLabel : '请选择疾病类型'}
                                        </Text>
                                        <Image
                                            style={styles.formRowArrow}
                                            source={require('@/assets/images/vitals/icon_right.png')}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </Picker>
                        ) : (
                            <Flex justify="between" align="center" style={[styles.formRow, styles.formRowFirst]}>
                                <Text style={styles.formRowLabel}>疾病类型</Text>
                                <Text style={styles.formRowPlaceholder}>暂无疾病类型选项</Text>
                            </Flex>
                        )}

                        <DatePicker
                            precision="month"
                            value={diagnosisDate ? moment(`${diagnosisDate}-01`).toDate() : undefined}
                            onOk={date => setDiagnosisDate(moment(date).format('YYYY-MM'))}>
                            <TouchableOpacity activeOpacity={0.7} style={styles.formRow}>
                                <Text style={styles.formRowLabel}>确诊日期</Text>
                                <View style={styles.formRowValue}>
                                    <Text style={diagnosisDisplay ? styles.formRowValueText : styles.formRowPlaceholder}>
                                        {diagnosisDisplay || '请选择确诊日期'}
                                    </Text>
                                    <Image
                                        style={styles.formRowRl}
                                        source={require('@/assets/images/case/icon_rl.png')}
                                    />
                                </View>
                            </TouchableOpacity>
                        </DatePicker>
                    </View>

                    <View style={styles.rowBox}>
                        <Text style={styles.sectionTitle}>主要症状</Text>
                        <TextInput
                            style={styles.textareaBox}
                            placeholder="例如：头痛、耳鸣"
                            placeholderTextColor="#999999"
                            value={mainSymptoms}
                            onChangeText={setMainSymptoms}
                            multiline
                            textAlignVertical="top"
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                        />
                    </View>

                    <View style={styles.rowBox}>
                        <Text style={styles.sectionTitle}>关联用药 <Text style={{ color: "#999999" }}>（多选）</Text></Text>
                        {medicationPlans.length > 0 ? (
                            <View style={styles.chipGrid}>
                                {medicationPlans.map(plan => {
                                    const planId = plan.medicationPlanId;
                                    if (planId == null) return null;
                                    const selected = selectedPlanIds.some(id => id == planId);
                                    return (
                                        <TouchableOpacity
                                            key={String(planId)}
                                            style={[styles.chipItem, selected && styles.chipItemActive]}
                                            onPress={() => toggleMedicationPlan(planId)}>
                                            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                                                {plan.name?.trim() || '未命名药品'}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={styles.emptyHint}>暂无可关联的用药计划</Text>
                        )}
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>

            <View style={styles.bottomBar}>
                <Flex style={styles.bottomBarActions}>
                    <TouchableOpacity
                        style={[styles.bottomBarButtonCancel, submitting && { opacity: 0.6 }]}
                        activeOpacity={0.7}
                        disabled={submitting}
                        onPress={() => navigation.goBack()}>
                        <Flex style={{ flex: 1 }} justify="center" align="center">
                            <Text style={styles.bottomBarButtonTextCancel}>取消</Text>
                        </Flex>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.bottomBarButtonConfirm, submitting && { opacity: 0.6 }]}
                        activeOpacity={0.7}
                        disabled={submitting}
                        onPress={submit}>
                        <Flex style={{ flex: 1 }} justify="center" align="center">
                            {submitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.bottomBarButtonTextConfirm}>
                                    {isEdit ? '保存修改' : '确认添加'}
                                </Text>
                            )}
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            </View>
        </PageLayout>
    );
}
