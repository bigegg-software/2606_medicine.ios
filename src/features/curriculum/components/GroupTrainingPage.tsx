import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ImageBackground } from 'react-native';
import { Flex } from '@ant-design/react-native';
import moment from 'moment';
import styles from '@/css/curriculum/groupTraining';
import DietDatePickerModal from '@/src/features/nutrition/components/DietDatePickerModal';
import { buildDietWeekDays } from '@/src/features/exercise/utils/dietCalendarHelpers';

/** 集体训练 */
export default function GroupTrainingPage() {
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
                <Text style={styles.filterChipText}>我的课程</Text>
                <Image
                  style={styles.filterChipIcon}
                  source={require('@/assets/images/curriculum/arrow_down.png')}
                />
              </Flex>
            </TouchableOpacity>
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
          <TouchableOpacity activeOpacity={0.7}>
            <Flex align="center">
              <Text style={styles.myBookingText}>我的预约</Text>
              <Image
                style={styles.myBookingIcon}
                source={require('@/assets/images/curriculum/arrow_right.png')}
              />
            </Flex>
          </TouchableOpacity>
        </Flex>

        <ImageBackground
          source={require('@/assets/images/curriculum/jt.png')}
          style={styles.imgBackground}
          imageStyle={styles.imgBackgroundImage}
        >
          <Text style={styles.groupBannerTitle}>为持续巩固而练</Text>
          <Text style={styles.groupBannerDesc}>
            {'在康复老师带领下\n以更轻松的节奏保持力量\n平衡与身体控制。'}
          </Text>
        </ImageBackground>

        <View style={styles.classCard}>
          <Image
            source={require('@/assets/images/curriculum/xb1.png')}
            style={styles.classCover}
            resizeMode="cover"
          />
          <View style={styles.classBody}>
            <Flex justify="between" align="center" style={styles.classTitleRow}>
              <Text style={styles.classTitle} numberOfLines={1}>
                下肢稳定与平衡巩固小班
              </Text>
              <Flex style={styles.classTag}>
                <Image
                  style={styles.classTagIcon}
                  source={require('@/assets/images/exercise/hs.png')}
                />
                <Text style={styles.classTagText}>适合你</Text>
              </Flex>
            </Flex>

            <Flex justify="between" align="center" style={styles.classMetaRow}>
              <Text style={styles.classMetaLeft} numberOfLines={1}>
                李教练·4-6人小班
              </Text>
              <View style={styles.classMetaRight}>
                <Image
                  style={styles.classMetaIcon}
                  source={require('@/assets/images/curriculum/bm.png')}
                />
                <Text style={styles.classMetaRightText}>已报名3人·还可预约3人</Text>
              </View>
            </Flex>

            <View style={styles.classDashWrap}>
              <View style={styles.classDash} />
            </View>

            <Flex justify="between" align="center" style={styles.classBottomRow}>
              <View style={styles.classBottomLeft}>
                <Text style={styles.classTime}>10:30-11:30</Text>
                <View style={styles.classBenefitRow}>
                  <Image
                    style={styles.classBenefitIcon}
                    source={require('@/assets/images/curriculum/qy.png')}
                  />
                  <Text style={styles.classBenefitText}>使用小班训练权益 1 节</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.7} style={styles.classBookBtn}>
                <Text style={styles.classBookBtnText}>预约参加</Text>
              </TouchableOpacity>
            </Flex>
          </View>
        </View>



        
        <Flex justify="center" align="center" style={styles.planListFooter}>
          <View style={styles.planListFooterLine} />
          <Text style={styles.planListFooterText}>和熟悉的老师一起，把训练变成生活的一部分</Text>
          <View style={styles.planListFooterLine} />
        </Flex>
      </ScrollView>
    </View>
  );
}
