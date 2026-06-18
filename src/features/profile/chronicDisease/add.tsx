import React, { useEffect, useMemo, useState } from 'react';
import { Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, DatePicker, Picker } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';
import styles from '@/css/chronicDisease/add';
import { AppTheme } from '@/common/theme';
import { MaterialIcons } from '@expo/vector-icons';
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

async function loadAssociationMedicationPlans(): Promise<MedicationPlan[]> {
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
    const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([]);
    const [diseaseTypeOptions, setDiseaseTypeOptions] = useState<DiseaseTypeOption[]>([]);
    const [medicationPlans, setMedicationPlans] = useState<MedicationPlan[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        navigation.setOptions({ title: isEdit ? '编辑慢病' : '新增慢病' });
    }, [isEdit, navigation]);

    useEffect(() => {
        (async () => {
            try {
                const [options, plans] = await Promise.all([
                    loadDiseaseTypeOptions(),
                    loadAssociationMedicationPlans(),
                ]);
                setDiseaseTypeOptions(options);
                setMedicationPlans(plans);

                if (isEdit && recordId != null) {
                    const res = await getChronicDiseaseInfo(recordId);
                    const data = apiResourceData<ChronicDiseaseRecord>(
                        res as { code?: number; data?: ChronicDiseaseRecord },
                    );
                    if (data) {
                        setDiseaseType(data.diseaseType ?? '');
                        setDiagnosisDate(data.diagnosisTime?.slice(0, 7) ?? '');
                        setMainSymptoms(data.mainSymptoms ?? '');
                        setSelectedPlanIds(
                            (data.associationMedicationPlanIds ?? [])
                                .map(id => Number(id))
                                .filter(id => !Number.isNaN(id)),
                        );
                    }
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
        if (!diagnosisDate) return '--年--月';
        const [year, month] = diagnosisDate.split('-');
        if (year && month) {
            return `${year}年${Number(month)}月`;
        }
        return '--年--月';
    }, [diagnosisDate]);

    const toggleMedicationPlan = (planId: number) => {
        setSelectedPlanIds(prev =>
            prev.includes(planId) ? prev.filter(id => id !== planId) : [...prev, planId],
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
                associationMedicationPlanIds: selectedPlanIds.map(String),
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
            <PageLayout style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container}>
            <KeyboardDoneAccessory />
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionTitle}>基础信息</Text>
                <View style={styles.infoBox}>
                    <Text style={[styles.rowTitle, { marginTop: 0 }]}>疾病类型</Text>
                    {diseaseTypeOptions.length > 0 ? (
                        <Picker
                            data={diseaseTypeOptions}
                            cols={1}
                            value={[diseaseType]}
                            onOk={values => setDiseaseType(String(values[0]))}>
                            <Flex style={styles.inpitBox}>
                                <Text style={[styles.placeholderText, diseaseType ? styles.valueText : null]}>
                                    {diseaseType ? diseaseTypeLabel : '请选择疾病类型'}
                                </Text>
                                <MaterialIcons name="keyboard-arrow-down" size={24} color={AppTheme.primaryColor} />
                            </Flex>
                        </Picker>
                    ) : (
                        <Flex style={styles.inpitBox}>
                            <Text style={styles.placeholderText}>暂无疾病类型选项</Text>
                        </Flex>
                    )}

                    <Text style={styles.rowTitle}>确诊日期</Text>
                    <DatePicker
                        precision="month"
                        value={diagnosisDate ? moment(`${diagnosisDate}-01`).toDate() : undefined}
                        onOk={date => setDiagnosisDate(moment(date).format('YYYY-MM'))}>
                        <Flex style={styles.inpitBox}>
                            <Text style={[styles.placeholderText, diagnosisDate ? styles.valueText : null]}>{diagnosisDisplay}</Text>
                            <MaterialIcons name="keyboard-arrow-down" size={24} color={AppTheme.primaryColor} />
                        </Flex>
                    </DatePicker>
                </View>

                <Text style={styles.sectionTitle}>医学信息</Text>
                <View style={styles.infoBox}>
                    <Text style={[styles.rowTitle, { marginTop: 0 }]}>主要症状</Text>
                    <Flex style={[styles.inpitBox, styles.symptomInputBox]}>
                        <TextInput
                            style={styles.symptomInput}
                            placeholder="例如：头痛、耳鸣"
                            placeholderTextColor="#999999"
                            value={mainSymptoms}
                            onChangeText={setMainSymptoms}
                            inputAccessoryViewID={KEYBOARD_DONE_ACCESSORY_ID}
                        />
                    </Flex>
                </View>

                <Text style={styles.sectionTitle}>关联资源(可选)</Text>
                <View style={styles.infoBox}>
                    <Text style={[styles.rowTitle, { marginTop: 0 }]}>关联用药</Text>
                    {medicationPlans.length > 0 ? (
                        <View style={styles.chipGrid}>
                            {medicationPlans.map(plan => {
                                const planId = plan.medicationPlanId;
                                if (planId == null) return null;
                                const selected = selectedPlanIds.includes(planId);
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
                        <Flex style={styles.inpitBox}>
                            <Text style={styles.placeholderText}>暂无可关联的用药计划</Text>
                        </Flex>
                    )}
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.addBtn} onPress={submit} disabled={submitting}>
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.addText}>{isEdit ? '保存修改' : '确认添加'}</Text>
                    )}
                </Flex>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => navigation.goBack()}
                disabled={submitting}>
                <Flex justify="center" align="center" style={{ flex: 1 }}>
                    <Text style={styles.cancelText}>取消</Text>
                </Flex>
            </TouchableOpacity>
        </PageLayout>
    );
}
