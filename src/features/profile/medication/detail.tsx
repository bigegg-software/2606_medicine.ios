import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Flex } from '@ant-design/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
    getDrugPatientRuleInfo,
    type DrugPatientRuleInfo,
    type MedicationPlan,
} from '@/api/medicationPlan';
import {
    loadMedicationDictMaps,
    formatMedicationDoseText,
    getDrugPatientRuleStatusLabel,
    type MedicationDictMaps,
} from './medicationHelpers';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import styles from '@/css/medication/detail';
import { AppTheme } from '@/common/theme';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationDetailPage'>;

function formatCourseTreatment(v?: number): string {
    if (v == null || v === 0) return '长期';
    return `${v}天`;
}

function formatFrequency(v?: number): string {
    if (v == null) return '--';
    return `每日${v}次`;
}

export default function MedicationDetailPage({ route }: Props) {
    const drugPatientRuleId = route.params?.drugPatientRuleId;
    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState<DrugPatientRuleInfo | null>(null);
    const [dictMaps, setDictMaps] = useState<MedicationDictMaps | null>(null);

    const load = useCallback(async () => {
        if (drugPatientRuleId == null) return;
        setLoading(true);
        try {
            const [res, maps] = await Promise.all([
                getDrugPatientRuleInfo(drugPatientRuleId),
                loadMedicationDictMaps(),
            ]);
            setDictMaps(maps);
            if (isResourceApiOk(res) && (res as any).data) {
                setInfo((res as any).data);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [drugPatientRuleId]);

    useEffect(() => {
        void load();
    }, [load]);

    if (loading) {
        return (
            <PageLayout style={styles.container} contentStyle={styles.pageBody}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    if (!info) {
        return (
            <PageLayout style={styles.container} contentStyle={styles.pageBody}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#999', fontSize: 14 }}>暂无数据</Text>
                </View>
            </PageLayout>
        );
    }

    const drugList = info.drugRuleList ?? [];
    const dict = dictMaps ?? { amountUnit: {}, eventBased: {}, amountUnitOptions: [], eventBasedOptions: [] };
    const isPaused = info.status === 1;
    const isEnded = info.status === 2;
    const showStatusBadge = isPaused || isEnded;
    const statusLabel = getDrugPatientRuleStatusLabel(info.status);
    const stopReason = info.stopReason?.trim();

    return (
        <PageLayout style={styles.container} contentStyle={styles.pageBody}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                {/* Header card */}
                <View style={styles.medicationBox}>
                    <Flex justify="between" align="start">
                        <Flex style={styles.detailHeaderMain}>
                            <Flex justify='center' style={styles.detailImageBox}>
                                <Image style={styles.detailImage} source={require('@/assets/images/medication/yp.png')} />
                            </Flex>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailTitle}>{info.prescriptionName || '--'}</Text>
                                {info.diagnosis ? <Text style={styles.detailSubtitle}>{info.diagnosis}</Text> : null}
                            </View>
                        </Flex>
                        {showStatusBadge ? (
                            <Flex style={isPaused ? styles.statusPausedBadge : styles.statusEndedBadge}>
                                <Text style={isPaused ? styles.statusPausedText : styles.statusEndedText}>
                                    {statusLabel}
                                </Text>
                            </Flex>
                        ) : null}
                    </Flex>
                    {info.createByName ? (
                        <Flex style={[styles.timeBox, { marginTop: 21 }]}>
                            <Image style={styles.iconImg} tintColor="#333333" source={require("@/assets/images/medication/yisheng.png")} />
                            <Text style={styles.timeText}>医生：{info.createByName}</Text>
                        </Flex>
                    ) : null}
                    <Flex style={styles.timeBox}>
                        <Image style={styles.iconImg} tintColor="#333333" source={require("@/assets/images/medication/time.png")} />
                        <Flex justify='between' style={{ flex: 1 }}>
                            <Text style={styles.timeText}>开始：{info.startDate ?? '--'}</Text>
                            <Text style={styles.timeText}>结束：{info.endDate ?? '--'}</Text>
                        </Flex>
                    </Flex>
                    {isPaused ? (
                        <Text style={styles.stopReasonText}>暂停原因：{stopReason || '--'}</Text>
                    ) : null}
                </View>

                {/* Drug list */}
                <Text style={styles.pageTitle}>用药清单（{drugList.length}种）</Text>
                <View style={styles.medicationBox}>
                    {drugList.map((item: MedicationPlan, index: number) => {
                        return (
                            <View key={item.medicationPlanId ?? index}>
                                {index > 0 && <View style={styles.rowLine} />}
                                <Text style={[styles.mapTitle, index === 0 ? { marginTop: 0 } : undefined]}>
                                    {item.name?.trim() || '--'}
                                </Text>
                                <Flex justify='between' style={styles.medicationContent}>
                                    <View>
                                        <Text style={styles.medicationTitle}>剂量</Text>
                                        <Text style={styles.medicationText}>
                                            {formatMedicationDoseText(
                                                { amount: item.amount, amountUnit: item.amountUnit },
                                                dict,
                                            )}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.medicationTitle}>频率</Text>
                                        <Text style={styles.medicationText}>{formatFrequency(item.medicationFrequency)}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.medicationTitle}>疗程</Text>
                                        <Text style={styles.medicationText}>{formatCourseTreatment(item.courseTreatment)}</Text>
                                    </View>
                                </Flex>
                                <Flex justify='between' style={styles.medicationRow}>
                                    <Text style={styles.leftTitle}>备注</Text>
                                    <Text style={styles.rightText}>{item.remark || "无"}</Text>
                                </Flex>
                                {item.timeList && item.timeList.length > 0 ? (
                                    <>
                                        <Flex justify='between' style={styles.medicationRow}>
                                            <Text style={styles.leftTitle}>
                                                提醒时间（每日{item.medicationFrequency ?? 1}次）
                                            </Text>
                                        </Flex>
                                        <Flex style={styles.medicationRow}>
                                            {item.timeList.map((t, i) => (
                                                <View key={i} style={[styles.colTimeBox, i > 0 ? { marginLeft: 8 } : undefined]}>
                                                    <Text style={styles.colTime}>{t}</Text>
                                                </View>
                                            ))}
                                        </Flex>
                                    </>
                                ) : null}
                            </View>
                        );
                    })}
                </View>

                {/* Precautions */}
                <Text style={styles.pageTitle}>注意事项</Text>
                <View style={styles.medicationBox}>
                    <Text style={styles.zyText}>{info.precautions || "无"}</Text>
                </View>
            </ScrollView>
        </PageLayout>
    );
}
