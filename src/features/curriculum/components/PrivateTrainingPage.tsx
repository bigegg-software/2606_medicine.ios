import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import moment from 'moment';
import styles from '@/css/curriculum/privateTraining';
import type { RootStackParamList } from '@/route/router';
import DietDatePickerModal from '@/src/features/nutrition/components/DietDatePickerModal';
import { buildDietWeekDays } from '@/src/features/exercise/utils/dietCalendarHelpers';

const COACH_CARDS = [
  {
    key: '1',
    name: '李教练',
    tag: '处方推荐',
    desc: '康复普拉提·核心稳定·细致陪伴',
    benefitText: '私教权益 剩余 8 节',
    time: '10:15-11:15',
    topic: '下肢稳定与步态控制',
  },
  {
    key: '2',
    name: '李教练',
    tag: '处方推荐',
    desc: '康复普拉提·核心稳定·细致陪伴',
    benefitText: '私教权益 剩余 8 节',
    time: '10:15-11:15',
    topic: '下肢稳定与步态控制',
  },
];

/** 私教训练 */
export default function PrivateTrainingPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDate, setSelectedDate] = useState(() => moment().format('YYYY-MM-DD'));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);

  return (
    <View style={styles.tabPage}>
      <DietDatePickerModal
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setSelectedDate}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Flex justify="between" style={styles.calendarBox}>
          {weekDays.map(item => {
            const isActive = item.key === selectedDate;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.7}
                style={[styles.calendarCol, isActive && styles.calendarColActive]}
                onPress={() => setSelectedDate(item.key)}
              >
                <Text style={isActive ? styles.calendarTitleActive : styles.calendarTitle}>
                  {item.label}
                </Text>
                <Text style={isActive ? styles.calendarSubtitleActive : styles.calendarSubtitle}>
                  {item.day}
                </Text>
                <View style={styles.calendarDotWrap} />
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.calendarCol}
            onPress={() => setDatePickerVisible(true)}
          >
            <Text style={styles.calendarTitle}>日期</Text>
            <Image
              style={styles.calendarImage}
              source={require('@/assets/images/nutrition/time.png')}
            />
          </TouchableOpacity>
        </Flex>

        <Flex justify="between" align="center" style={styles.filterRow}>
          <Flex style={styles.filterChipRow}>
            <TouchableOpacity activeOpacity={0.7} style={styles.filterChip}>
              <Flex align="center">
                <Text style={styles.filterChipText}>全部老师</Text>
                <Image
                  style={styles.filterChipIcon}
                  source={require('@/assets/images/curriculum/arrow_down.png')}
                />
              </Flex>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.filterChip}>
              <Flex align="center">
                <Text style={styles.filterChipText}>全部时段</Text>
                <Image
                  style={styles.filterChipIcon}
                  source={require('@/assets/images/curriculum/arrow_down.png')}
                />
              </Flex>
            </TouchableOpacity>
          </Flex>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MyBookingPage')}
          >
            <Flex align="center">
              <Text style={styles.myBookingText}>我的预约</Text>
              <Image
                style={styles.myBookingIcon}
                source={require('@/assets/images/curriculum/arrow_right.png')}
              />
            </Flex>
          </TouchableOpacity>
        </Flex>



        {COACH_CARDS.map((card, index) => (
          <View
            key={card.key}
            style={[styles.coachCard, index === 0 ? styles.coachCardFirst : styles.coachCardRest]}
          >
            <Flex align="start">
              <Image
                style={styles.coachAvatar}
                source={require('@/assets/images/curriculum/ljl.png')}
              />
              <View style={styles.coachInfo}>
                <Flex align="center" style={styles.coachNameRow}>
                  <Text style={styles.coachName}>{card.name}</Text>
                  <View style={styles.coachTag}>
                    <Text style={styles.coachTagText}>{card.tag}</Text>
                  </View>
                </Flex>
                <Text style={styles.coachDesc}>{card.desc}</Text>
                <Flex align="center" style={styles.coachBenefitRow}>
                  <Image
                    style={styles.coachBenefitIcon}
                    source={require('@/assets/images/curriculum/qy.png')}
                  />
                  <Text style={styles.coachBenefitText}>{card.benefitText}</Text>
                </Flex>
              </View>
            </Flex>

            <View style={styles.coachDashWrap}>
              <View style={styles.coachDash} />
            </View>

            <Flex justify="between" align="center" style={styles.coachBottomRow}>
              <View style={styles.coachSessionInfo}>
                <Text style={styles.coachTime}>{card.time}</Text>
                <Text style={styles.coachTopic}>{card.topic}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} style={styles.coachBookBtn}>
                <Text style={styles.coachBookBtnText}>预约教练</Text>
              </TouchableOpacity>
            </Flex>
          </View>
        ))}

        <Flex justify="between" align="center" style={styles.nextTrainBox}>
          <Flex align="center" style={styles.nextTrainLeft}>
            <Image
              style={styles.nextTrainIcon}
              source={require('@/assets/images/curriculum/next_train.png')}
            />
            <View style={styles.nextTrainInfo}>
              <Text style={styles.nextTrainTitle}>你的下一次训练</Text>
              <Text style={styles.nextTrainDetail}>周六 10:30 · 李老师</Text>
            </View>
          </Flex>
          <TouchableOpacity activeOpacity={0.7}>
            <Flex align="center">
              <Text style={styles.myBookingText}>查看预约</Text>
              <Image
                style={styles.myBookingIcon}
                source={require('@/assets/images/curriculum/arrow_right.png')}
              />
            </Flex>
          </TouchableOpacity>
        </Flex>

      </ScrollView>
    </View>
  );
}
