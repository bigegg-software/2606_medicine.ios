import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';
import calendarStyles from '@/css/schedule/calendar';
import assistantStyles from '@/css/assistant/assistant';
import {
  getTodayScheduleIcon,
  type TodayScheduleItem,
  type TodaySchedulePayload,
} from '../utils/todayScheduleAction';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  payload: TodaySchedulePayload;
};

function ScheduleCard({
  item,
  showGap,
  onPress,
}: {
  item: TodayScheduleItem;
  showGap?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <Flex align="start">
      <Image style={assistantStyles.todayScheduleCardIcon} source={getTodayScheduleIcon(item)} />
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
  );

  if (!onPress) {
    return (
      <View style={[assistantStyles.todayScheduleCard, showGap ? assistantStyles.todayScheduleCardGap : null]}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[assistantStyles.todayScheduleCard, showGap ? assistantStyles.todayScheduleCardGap : null]}>
      {content}
    </TouchableOpacity>
  );
}

export default function TodayScheduleCards({ payload }: Props) {
  const navigation = useNavigation<Nav>();

  const handleItemPress = useCallback((item: TodayScheduleItem) => {
    if (item.kind === 'activity' && item.activityId) {
      navigation.navigate('ActivityDetail', { id: item.activityId });
      return;
    }
    if (item.kind === 'live' && item.liveId) {
      navigation.navigate('LiveDetail', { liveId: item.liveId });
    }
  }, [navigation]);

  if (payload.isEmpty || payload.items.length === 0) {
    return null;
  }

  return (
    <View style={assistantStyles.todayScheduleBox}>
      {payload.items.map((item, index) => {
        const canNavigate = (item.kind === 'activity' && item.activityId)
          || (item.kind === 'live' && item.liveId);

        return (
          <ScheduleCard
            key={item.key}
            item={item}
            showGap={index > 0}
            onPress={canNavigate ? () => handleItemPress(item) : undefined}
          />
        );
      })}
    </View>
  );
}
