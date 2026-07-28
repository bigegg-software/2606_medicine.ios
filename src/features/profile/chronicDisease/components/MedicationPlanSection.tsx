import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import styles from '@/css/chronicDisease/detail';
import medicationStyles from '@/css/medication/index';
import { AppTheme } from '@/common/theme';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import {
    submitMedicationCheckIn,
    type MedicationPlanItemView,
} from '@/src/features/profile/medication/medicationHelpers';
import type { AssociatedMedicationRow } from './chronicData';
import { formatChronicMedicationDoseTimeText } from './utils/medicationPlanHelpers';

type Props = {
    medications: AssociatedMedicationRow[];
};

function toPlanItemView(row: AssociatedMedicationRow): MedicationPlanItemView {
    return {
        key: row.key,
        medicationPlanId: row.medicationPlanId,
        medicationPlanTime: row.medicationPlanTime,
        name: row.name,
        doseText: row.doseText,
        planType: row.planType,
        planTypeLabel: row.planTypeLabel,
        taken: row.taken,
        canCheckIn: row.canCheckIn,
        action: row.taken ? 1 : null,
        eventBasedLabel: '',
    };
}

function ActionStatus({ taken }: { taken: boolean }) {
    return (
        <Flex align="center" style={medicationStyles.medicationActionBtn}>
            <Image
                style={medicationStyles.medicationSelectIcon}
                source={
                    taken
                        ? require('@/assets/images/medication/select.png')
                        : require('@/assets/images/medication/unselected.png')
                }
            />
            <Text style={medicationStyles.medicationActionText}>已服用</Text>
        </Flex>
    );
}

function MedicationRow({
    item,
    checkingIn,
    onCheckIn,
}: {
    item: AssociatedMedicationRow;
    checkingIn: boolean;
    onCheckIn: (item: AssociatedMedicationRow) => void;
}) {
    const statusNode = <ActionStatus taken={item.taken} />;

    return (
        <Flex justify="between" align="center" style={medicationStyles.medicationItemCard}>
            <Flex align="center" style={medicationStyles.medicationLeftBox}>
                <Image
                    style={medicationStyles.medicationItemIcon}
                    source={require('@/assets/images/medication/icon_yp.png')}
                />
                <View style={medicationStyles.medicationItemContent}>
                    <Text style={medicationStyles.medicationLeftTitle}>{item.name}</Text>
                    <Text style={medicationStyles.medicationText}>
                        {formatChronicMedicationDoseTimeText(item.doseText, item.medicationPlanTime)}
                    </Text>
                </View>
            </Flex>
            {item.canCheckIn ? (
                <TouchableOpacity activeOpacity={0.7} disabled={checkingIn} onPress={() => onCheckIn(item)}>
                    {checkingIn ? <ActivityIndicator color={AppTheme.primaryColor} /> : statusNode}
                </TouchableOpacity>
            ) : (
                statusNode
            )}
        </Flex>
    );
}

export default function MedicationPlanSection({ medications }: Props) {
    const [rows, setRows] = useState(medications);
    const [checkingInKey, setCheckingInKey] = useState<string | null>(null);

    useEffect(() => {
        setRows(medications);
    }, [medications]);

    const handleCheckIn = useCallback(async (item: AssociatedMedicationRow) => {
        if (!item.canCheckIn || checkingInKey) return;

        setCheckingInKey(item.key);
        try {
            const res = await submitMedicationCheckIn(toPlanItemView(item));
            if (!isResourceApiOk(res as { code?: number })) {
                const r = res as { msg?: string };
                Toast.show(r.msg || '打卡失败', 1.5);
                return;
            }
            Toast.success('已记录服用', 1.5);
            setRows(prev =>
                prev.map(row =>
                    row.key === item.key ? { ...row, taken: true, canCheckIn: false } : row,
                ),
            );
        } catch {
            Toast.show('打卡失败', 1.5);
        } finally {
            setCheckingInKey(null);
        }
    }, [checkingInKey]);

    return (
        <View style={styles.overviewSection}>
            <Text style={styles.overviewTitle}>今日用药</Text>
            {rows.length === 0 ? (
                <View style={styles.sectionBody}>
                    <Text style={styles.emptyText}>暂无待服</Text>
                </View>
            ) : (
                <View style={styles.sectionBody}>
                    {rows.map((item, index) => (
                        <View key={item.key} style={index > 0 ? { marginTop: 8 } : undefined}>
                            <MedicationRow
                                item={item}
                                checkingIn={checkingInKey === item.key}
                                onCheckIn={handleCheckIn}
                            />
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}
