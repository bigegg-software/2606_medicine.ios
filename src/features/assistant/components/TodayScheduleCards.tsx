import React from 'react';
import { View, Text, Image } from 'react-native';
import { Flex } from '@ant-design/react-native';
import calendarStyles from '@/css/schedule/calendar';
import assistantStyles from '@/css/assistant/assistant';
import {
  getTodayScheduleIcon,
  type TodayScheduleItem,
  type TodaySchedulePayload,
} from '../utils/todayScheduleAction';

type Props = {
  payload: TodaySchedulePayload;
};

function ScheduleCard({ item, showGap }: { item: TodayScheduleItem; showGap?: boolean }) {
  return (
    <View style={[assistantStyles.todayScheduleCard, showGap ? assistantStyles.todayScheduleCardGap : null]}>
      <Flex align="start">
        <Image style={assistantStyles.todayScheduleCardIcon} source={getTodayScheduleIcon(item.kind)} />
        <View style={assistantStyles.todayScheduleCardBody}>
          <Flex align="center" justify="between">
            <Flex align="center" style={{ flex: 1, flexWrap: 'wrap' }}>
              <Text style={assistantStyles.todayScheduleCardTime}>{item.time}</Text>
              <Text style={assistantStyles.todayScheduleCardTitle}>{item.title}</Text>
              {item.kind === 'drug' && item.eventBasedLabel ? (
                <Text style={calendarStyles.taskCardMedicationType}>{item.eventBasedLabel}</Text>
              ) : null}
            </Flex>
            {item.kind === 'drug' ? (
              <Text
                style={[
                  assistantStyles.todayScheduleCardStatus,
                  item.taken ? assistantStyles.todayScheduleCardStatusTaken : null,
                ]}>
                {item.taken ? '已服用' : item.canCheckIn ? '待服用' : '未服用'}
              </Text>
            ) : null}
            {item.kind === 'ex' && item.progress != null ? (
              <Text style={assistantStyles.todayScheduleCardProgress}>{item.progress}%</Text>
            ) : null}
          </Flex>
          {item.desc ? (
            <Text style={assistantStyles.todayScheduleCardDesc}>{item.desc}</Text>
          ) : null}
        </View>
      </Flex>
    </View>
  );
}

export default function TodayScheduleCards({ payload }: Props) {
  if (payload.isEmpty || payload.items.length === 0) {
    return null;
  }

  return (
    <View style={assistantStyles.todayScheduleBox}>
      {payload.items.map((item, index) => (
        <ScheduleCard key={item.key} item={item} showGap={index > 0} />
      ))}
    </View>
  );
}
