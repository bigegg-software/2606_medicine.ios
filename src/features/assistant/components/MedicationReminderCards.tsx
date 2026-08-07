import React, { useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import calendarStyles from '@/css/schedule/calendar';
import assistantStyles from '@/css/assistant/assistant';
import { mapTodayMedicationGroupsToTimelineItems } from '@/src/features/schedule/calendarHelpers';
import type { MedicationPlanGroupView } from '@/src/features/profile/medication/medicationHelpers';

const DRUG_ICON = require('@/assets/images/schedule/yw.png');

type Props = {
  groups: MedicationPlanGroupView[];
};

function MedicationStatusBadge({
  taken,
  canCheckIn,
}: {
  taken: boolean;
  canCheckIn?: boolean;
}) {
  const isTaken = Boolean(taken);
  const label = isTaken ? '已服用' : canCheckIn ? '待服用' : '未服用';

  return (
    <View
      style={
        isTaken
          ? assistantStyles.medicationStatusBadgeTaken
          : assistantStyles.medicationStatusBadgePending
      }>
      <Text
        style={
          isTaken
            ? assistantStyles.medicationStatusBadgeTakenText
            : assistantStyles.medicationStatusBadgePendingText
        }>
        {label}
      </Text>
    </View>
  );
}

export default function MedicationReminderCards({ groups }: Props) {
  const items = useMemo(() => mapTodayMedicationGroupsToTimelineItems(groups), [groups]);

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={assistantStyles.todayScheduleBox}>
      {items.map((item, index) => {
        const eventLabel = item.eventBasedLabel?.trim();
        return (
          <View
            key={item.key}
            style={[
              assistantStyles.todayScheduleCard,
              index > 0 ? assistantStyles.todayScheduleCardGap : null,
            ]}>
            <View style={assistantStyles.todayScheduleMealRow}>
              <Image
                style={[
                  assistantStyles.todayScheduleCardIcon,
                  assistantStyles.todayScheduleMealIcon,
                ]}
                source={DRUG_ICON}
              />
              <View style={assistantStyles.todayScheduleMealBody}>
                <View style={assistantStyles.todayScheduleMealTitleRow}>
                  <Text style={assistantStyles.todayScheduleMealTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <MedicationStatusBadge taken={Boolean(item.taken)} canCheckIn={item.canCheckIn} />
                  {eventLabel ? (
                    <Text style={calendarStyles.taskCardMedicationType}>{eventLabel}</Text>
                  ) : null}
                </View>
                {item.desc ? (
                  <Text style={assistantStyles.todayScheduleMealFoods} numberOfLines={2}>
                    {item.desc}
                  </Text>
                ) : null}
              </View>
              <Text style={assistantStyles.todayScheduleMealTime}>{item.time || '--'}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
