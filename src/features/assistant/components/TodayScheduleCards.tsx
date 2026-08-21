import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';
import calendarStyles from '@/css/schedule/calendar';
import assistantStyles from '@/css/assistant/assistant';
import { MEAL_CATEGORY_BY_KEY } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import moment from 'moment';
import {
  getTodayScheduleIcon,
  TODAY_SCHEDULE_PREVIEW_LIMIT,
  type TodayScheduleItem,
  type TodaySchedulePayload,
} from '../utils/todayScheduleAction';
import { setPendingTrainingPhaseTab } from '@/src/features/exercise/utils/trainingPhaseTabSync';

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
  const isActivity = item.kind === 'activity';
  const isLive = item.kind === 'live';
  const location = item.location || (isActivity ? item.desc : '');
  const liveSubtitle =
    item.liveSubtitle
    || [item.liveAnchorName, item.livePlatform].filter(Boolean).join('、');

  let content: React.ReactNode;

  if (isActivity) {
    content = (
      <View style={assistantStyles.todayScheduleMealRow}>
        <Image
          style={[assistantStyles.todayScheduleCardIcon, assistantStyles.todayScheduleMealIcon]}
          source={getTodayScheduleIcon(item)}
        />
        <View style={assistantStyles.todayScheduleMealBody}>
          <Text style={assistantStyles.todayScheduleMealTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {location ? (
            <Text style={assistantStyles.todayScheduleMealFoods} numberOfLines={2}>
              {location}
            </Text>
          ) : null}
        </View>
        <Text style={assistantStyles.todayScheduleMealTime}>{item.time}</Text>
      </View>
    );
  } else if (isLive) {
    content = (
      <View style={assistantStyles.todayScheduleMealRow}>
        <Image
          style={[assistantStyles.todayScheduleCardIcon, assistantStyles.todayScheduleMealIcon]}
          source={getTodayScheduleIcon(item)}
        />
        <View style={assistantStyles.todayScheduleMealBody}>
          <Text style={assistantStyles.todayScheduleMealTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {liveSubtitle ? (
            <Text style={assistantStyles.todayScheduleMealFoods} numberOfLines={1}>
              {liveSubtitle}
            </Text>
          ) : null}
        </View>
        <Text style={assistantStyles.todayScheduleMealTime}>{item.time}</Text>
      </View>
    );
  } else {
    content = (
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
            <Text
              style={assistantStyles.todayScheduleMealFoods}
              numberOfLines={item.kind === 'ex' ? 1 : 2}
            >
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
  }

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
    if (item.kind === 'diet') {
      const metaKey = item.mealCard?.key?.split('-')[0] ?? '';
      const mealCategory = MEAL_CATEGORY_BY_KEY[metaKey];
      if (mealCategory != null) {
        navigation.navigate('MealRecognitionPage', { mealCategory });
        return;
      }
      requestAnimationFrame(() => {
        navigation.navigate('MealDayDetailPage', {
          customerLocalDate: moment().format('YYYY-MM-DD'),
        });
      });
      return;
    }
    if (item.kind === 'drug') {
      navigation.navigate('Medication', { tab: 'medication' });
      return;
    }
    if (item.kind === 'ex') {
      setPendingTrainingPhaseTab('main');
      navigation.navigate('ExercisePage');
      return;
    }
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

  const previewItems = payload.items.slice(0, TODAY_SCHEDULE_PREVIEW_LIMIT);
  const showViewAll = payload.items.length > TODAY_SCHEDULE_PREVIEW_LIMIT;

  return (
    <View style={assistantStyles.todayScheduleBox}>
      {previewItems.map((item, index) => {
        const canNavigate =
          item.kind === 'diet'
          || item.kind === 'drug'
          || item.kind === 'ex'
          || (item.kind === 'activity' && item.activityId)
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
      {showViewAll ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CalendarPage')}
          style={assistantStyles.todayScheduleViewAll}
        >
          <Text style={assistantStyles.todayScheduleViewAllText}>查看全部</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
