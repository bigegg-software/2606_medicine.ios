import React from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import styles from '@/css/curriculum/onlineCourseDetail';
import type { RootStackParamList } from '@/route/router';

const DEFAULT_AVATAR = getDefaultAvatarByGender();

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  coachName: string;
  coachUserId?: string;
  avatarUri?: string;
};

/** 课程详情：教练入口卡片 */
export default function CoachEntryCard({ coachName, coachUserId, avatarUri }: Props) {
  const navigation = useNavigation<Nav>();
  const id = coachUserId?.trim() || '';
  const name = coachName?.trim() || '教练';
  const uri = avatarUri?.trim() || '';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.coachEntryCard}
      disabled={!id}
      onPress={() => {
        if (!id) return;
        navigation.navigate('CoachDetail', { coachUserId: id });
      }}
    >
      <Flex align="center">
        <Image
          style={styles.coachEntryAvatar}
          source={uri ? { uri } : DEFAULT_AVATAR}
        />
        <Text style={styles.coachEntryName} numberOfLines={1}>
          {name}
        </Text>
        {id ? (
          <Image
            style={styles.coachEntryArrow}
            source={require('@/assets/images/curriculum/icon_right.png')}
          />
        ) : null}
      </Flex>
    </TouchableOpacity>
  );
}
