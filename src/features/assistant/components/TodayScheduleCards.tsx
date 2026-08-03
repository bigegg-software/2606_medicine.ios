import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
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
    <View style={assistantStyles.todayScheduleMealRow}>
      <Image
        style={[assistantStyles.todayScheduleCardIcon, assistantStyles.todayScheduleMealIcon]}
        source={getTodayScheduleIcon(item)}
      />
      <View style={assistantStyles.todayScheduleMealBody}>
        <View style={assistantStyles.todayScheduleMealTitleRow}>
          <Text style={assistantStyles.todayScheduleMealTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.kind === 'drug' && item.eventBasedLabel ? (
            <Text style={calendarStyles.taskCardMedicationType}>{item.eventBasedLabel}</Text>
          ) : null}
        </View>
        {item.desc ? (
          <Text style={assistantStyles.todayScheduleMealFoods} numberOfLines={2}>
            {item.desc}
          </Text>
        ) : null}
        {item.kind === 'drug' ? (
          <Text
            style={[
              assistantStyles.todayScheduleCardStatusInline,
              item.taken ? assistantStyles.todayScheduleCardStatusTaken : null,
            ]}>
            {item.taken ? '已服用' : item.canCheckIn ? '待服用' : '未服用'}
          </Text>
        ) : null}
        {item.kind === 'ex' && item.progress != null ? (
          <Text style={assistantStyles.todayScheduleCardProgressInline}>{item.progress}%</Text>
        ) : null}
      </View>
      <Text style={assistantStyles.todayScheduleMealTime}>{item.time}</Text>
    </View>
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
