import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/assistant/assistant';
import type {
  MedicationPlanGroupView,
  MedicationPlanItemView,
} from '@/src/features/profile/medication/medicationHelpers';

function PlanTypeBadge({ label, isPrescription }: { label: string; isPrescription: boolean }) {
  return (
    <View style={isPrescription ? styles.medicationBadgeCF : styles.medicationBadgeGR}>
      <Text style={isPrescription ? styles.medicationBadgeCFText : styles.medicationBadgeGRText}>
        {label}
      </Text>
    </View>
  );
}

function DoseStatus({ taken }: { taken: boolean }) {
  return (
    <Text style={taken ? styles.medicationReminderStatusTaken : styles.medicationReminderStatusPending}>
      {taken ? '已服用' : '待服用'}
    </Text>
  );
}

function formatDoseLabel(doseText: string) {
  const dose = doseText.split('，')[0]?.trim();
  return dose || doseText || '--';
}

function flattenMedicationRows(groups: MedicationPlanGroupView[]): MedicationPlanItemView[] {
  return groups.flatMap(group =>
    group.items.map(item => ({
      ...item,
      medicationPlanTime: item.medicationPlanTime || group.timeLabel || group.time,
    })),
  );
}

type Props = {
  groups: MedicationPlanGroupView[];
};

export default function MedicationReminderCards({ groups }: Props) {
  const rows = useMemo(() => flattenMedicationRows(groups), [groups]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.medicationReminderBox}>
      {rows.map((item, index) => (
        <Flex
          key={item.key}
          align="center"
          style={[styles.medicationReminderRow, index > 0 ? styles.medicationReminderRowGap : null]}>
          <Flex align="center" style={styles.medicationReminderLeftCol}>
            <Text style={styles.medicationReminderName} numberOfLines={1}>
              {item.name}
            </Text>
            <PlanTypeBadge label={item.planTypeLabel} isPrescription={item.planType === 1} />
          </Flex>
          <View style={styles.medicationReminderCenterCol}>
            <Text style={styles.medicationReminderDose}>{formatDoseLabel(item.doseText)}</Text>
          </View>
          <Flex align="center" style={styles.medicationReminderRightCol}>
            <Text style={styles.medicationReminderTime}>{item.medicationPlanTime || '--'}</Text>
            <DoseStatus taken={item.taken} />
          </Flex>
        </Flex>
      ))}
    </View>
  );
}
