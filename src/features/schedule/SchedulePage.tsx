import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Flex } from '@ant-design/react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import MilestoneRings from './components/MilestoneRings';
import TaskProgressRing from './components/TaskProgressRing';
import styles from '@/css/schedule/schedule';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';
import { LinearGradient } from 'expo-linear-gradient';
import moment from "moment"



const WEEK_MAP = ['日', '一', '二', '三', '四', '五', '六'];

const getThisWeekData = () => {
  const monday = moment().startOf('isoWeek'); // ISO标准：周一是第一天

  return Array.from({ length: 7 }).map((_, index) => {
    const date = moment(monday).add(index, 'days');

    return {
      label: WEEK_MAP[date.day()],
      day: date.date(), // 30
      date: date.format('YYYY-MM-DD'), // 可选：完整日期
    };
  });
};

export default function SchedulePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [weekData, setWeekData] = useState(getThisWeekData());

  useFocusEffect(
    useCallback(() => {
      const stackNavigation = navigation.getParent()?.getParent() ?? navigation.getParent();
      stackNavigation?.setOptions({
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 18 }} onPress={() => navigation.navigate('CalendarPage')}>
            <Image style={styles.navIcon} source={require('@/assets/images/schedule/time.png')} />
          </TouchableOpacity>
        ),
      });
      return () => {
        stackNavigation?.setOptions({ headerRight: undefined });
      };
    }, [navigation]),
  );

  return (
    <TabPageLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.glassCardWrap}>
          <GlassView style={styles.glassCard} glassEffectStyle="regular" tintColor="#F8FAFF">
            <View style={styles.glassCardHighlight} pointerEvents="none" />
            <Flex justify="between" align="center">
              <Text style={styles.glassCardTitle}>防跌倒运动处方</Text>
              <Flex style={styles.statusBox}>
                <Text style={styles.statusText}>状态良好</Text>
              </Flex>
            </Flex>
            <Flex justify="between" style={{ marginTop: 20 }}>
              <View>
                <Flex style={styles.colBox}>
                  <Image style={styles.iconImg} source={require('@/assets/images/schedule/icon1.png')} />
                  <Text style={styles.colTitle}>周期：</Text>
                  <Text style={styles.colText}>30天</Text>
                </Flex>
                <Flex style={styles.colBox}>
                  <Image style={styles.iconImg} source={require('@/assets/images/schedule/icon2.png')} />
                  <Text style={styles.colTitle}>目标：</Text>
                  <Text style={styles.colText}>预防跌倒</Text>
                </Flex>
                <Flex style={styles.colBox}>
                  <Image style={styles.iconImg} source={require('@/assets/images/schedule/icon3.png')} />
                  <Text style={styles.colTitle}>完成：</Text>
                  <Text style={styles.colText}>60%</Text>
                </Flex>
              </View>
              <MilestoneRings />
            </Flex>
          </GlassView>

          <Flex style={styles.titleBox}>
            <View style={styles.borderBox}></View>
            <Text style={styles.titleText}>目标分解</Text>
          </Flex>

          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.scrollBox}>
            <View style={styles.backBox}>
              <Image style={styles.backImg} source={require('@/assets/images/schedule/back1.png')} />
              <Flex justify="between">
                <Text style={styles.backText}>增强平衡能力</Text>
                <Image style={styles.exerciseImg} source={require('@/assets/images/schedule/exercise1.png')} />
              </Flex>
              <Flex style={styles.statusColBox}>
                <Text style={styles.statusColText}>持续改善中</Text>
                <Image style={styles.statusIcon} source={require('@/assets/images/schedule/status1.png')} />
              </Flex>
              <Text style={styles.colBtmText}>单脚站立提升3秒</Text>
            </View>
            <View style={styles.backBox}>
              <Image style={styles.backImg} source={require('@/assets/images/schedule/back2.png')} />
              <Flex justify="between">
                <Text style={styles.backText}>增强下肢力量</Text>
                <Image style={styles.exerciseImg} source={require('@/assets/images/schedule/exercise2.png')} />
              </Flex>
              <Flex style={styles.statusColBox}>
                <Text style={styles.statusColText}>持续改善中</Text>
                <Image style={styles.statusIcon} source={require('@/assets/images/schedule/status1.png')} />
              </Flex>
              <Text style={styles.colBtmText}>单脚站立提升3秒</Text>
            </View>
            <View style={styles.backBox}>
              <Image style={styles.backImg} source={require('@/assets/images/schedule/back2.png')} />
              <Flex justify="between">
                <Text style={styles.backText}>增强下肢力量</Text>
                <Image style={styles.exerciseImg} source={require('@/assets/images/schedule/exercise2.png')} />
              </Flex>
              <Flex style={styles.statusColBox}>
                <Text style={styles.statusColText}>持续改善中</Text>
                <Image style={styles.statusIcon} source={require('@/assets/images/schedule/status1.png')} />
              </Flex>
              <Text style={styles.colBtmText}>单脚站立提升3秒</Text>
            </View>
            <View style={styles.backBox}>
              <Image style={styles.backImg} source={require('@/assets/images/schedule/back2.png')} />
              <Flex justify="between">
                <Text style={styles.backText}>增强下肢力量</Text>
                <Image style={styles.exerciseImg} source={require('@/assets/images/schedule/exercise2.png')} />
              </Flex>
              <Flex style={styles.statusColBox}>
                <Text style={styles.statusColText}>持续改善中</Text>
                <Image style={styles.statusIcon} source={require('@/assets/images/schedule/status1.png')} />
              </Flex>
              <Text style={styles.colBtmText}>单脚站立提升3秒</Text>
            </View>
            <View style={styles.backBox}>
              <Image style={styles.backImg} source={require('@/assets/images/schedule/back2.png')} />
              <Flex justify="between">
                <Text style={styles.backText}>增强下肢力量</Text>
                <Image style={styles.exerciseImg} source={require('@/assets/images/schedule/exercise2.png')} />
              </Flex>
              <Flex style={styles.statusColBox}>
                <Text style={styles.statusColText}>持续改善中</Text>
                <Image style={styles.statusIcon} source={require('@/assets/images/schedule/status1.png')} />
              </Flex>
              <Text style={styles.colBtmText}>单脚站立提升3秒</Text>
            </View>
          </ScrollView>

          <Flex style={styles.titleBox}>
            <View style={styles.borderBox}></View>
            <Text style={styles.titleText}>今日任务</Text>
          </Flex>
          <Flex wrap="wrap" justify='between' style={styles.tasksBox}>
            <View style={styles.tasksCol}>
              <Flex>
                <Image style={styles.exerciseImg} source={require('@/assets/images/schedule/exercise2.png')} />
                <Text style={styles.tasksTitle}>有氧心肺</Text>
              </Flex>
              <Text style={styles.tasksIntro}>快走40分钟</Text>

              <View style={styles.taskProgressWrap}>
                <TaskProgressRing progress={0} />
              </View>
            </View>
            <View style={styles.tasksCol}>
              <Flex>
                <Image style={styles.exerciseImg} source={require('@/assets/images/schedule/exercise2.png')} />
                <Text style={styles.tasksTitle}>抗阻增肌</Text>
              </Flex>
              <Text style={styles.tasksIntro}>快走40分钟</Text>
              <View style={styles.taskProgressWrap}>
                <TaskProgressRing progress={100} />
              </View>
            </View>
            <View style={styles.tasksCol}>
              <Flex>
                <Image style={styles.exerciseImg} source={require('@/assets/images/schedule/exercise2.png')} />
                <Text style={styles.tasksTitle}>柔韧拉伸</Text>
              </Flex>
              <Text style={styles.tasksIntro}>快走40分钟</Text>
              <View style={styles.taskProgressWrap}>
                <TaskProgressRing progress={100} />
              </View>
            </View>
            <View style={styles.tasksCol}>
              <Flex>
                <Image style={styles.exerciseImg} source={require('@/assets/images/schedule/exercise2.png')} />
                <Text style={styles.tasksTitle}>平衡控制</Text>
              </Flex>
              <Text style={styles.tasksIntro}>快走40分钟</Text>
              <View style={styles.taskProgressWrap}>
                <TaskProgressRing progress={100} />
              </View>
            </View>
          </Flex>



          <Flex style={styles.titleBox}>
            <View style={styles.borderBox}></View>
            <Text style={styles.titleText}>本周训练统计</Text>
          </Flex>

          <Flex justify="between" style={styles.dayBox}>
            {
              weekData.map((item, index) => (
                <Flex direction="column" justify="center" style={[styles.dayCol, index === 0 && styles.dayColAcitve]} key={item.date}>
                  <Text style={styles.dayText}>{item.label}</Text>
                  <Flex justify='center' style={styles.dayTimeBox}>
                    <Text style={[styles.dayTime, styles.dayTimeColor]}>{item.day}</Text>
                  </Flex>
                </Flex>
              ))
            }
          </Flex>

          <Flex style={styles.statRow}>
            <Flex direction='column' style={[styles.medicalBox, styles.statBox]}>
              <Text style={styles.statValue}>12 <Text style={styles.statUnit}>/15</Text></Text>
              <Text style={styles.statTitle}>训练次数</Text>
            </Flex>
            <Flex direction='column' style={[styles.medicalBox, styles.statBox]}>
              <Text style={styles.statValue}>80%</Text>
              <Text style={styles.statTitle}>完成率</Text>
            </Flex>
            <Flex direction='column' style={[styles.medicalBox, styles.statBox]}>
              <Text style={styles.statValue}>45h</Text>
              <Text style={styles.statTitle}>累计时长</Text>
            </Flex>
          </Flex>

          <Flex justify='between' style={styles.titleBox}>
            <Flex>
              <View style={styles.borderBox}></View>
              <Text style={styles.titleText}>历史计划</Text>
            </Flex>
            <TouchableOpacity>
              <Text style={styles.allBtn}>全部</Text>
            </TouchableOpacity>
          </Flex>

          <Flex justify='between' style={styles.medicalBox}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.medicalTitle, { marginTop: 0 }]}>膝关节康复运动处方</Text>
              <Text style={styles.leftText}>2025/10/01 - 2026/01/01</Text>
              <Text style={styles.statusInfo}>暂停原因：医生建议暂停</Text>
            </View>
            <Flex style={styles.yztBox}>
              <Text style={styles.yztText}>已暂停</Text>
            </Flex>
          </Flex>


          <Flex justify='between' style={styles.medicalBox}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.medicalTitle, { marginTop: 0 }]}>膝关节康复运动处方</Text>
              <Text style={styles.leftText}>2025/10/01 - 2026/01/01</Text>
              <Text style={styles.statusInfo}>暂停原因：医生建议暂停</Text>
            </View>
            <Flex style={styles.yztBox}>
              <Text style={styles.yztText}>已暂停</Text>
            </Flex>
          </Flex>


          <Flex justify='between' style={styles.medicalBox}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.medicalTitle, { marginTop: 0 }]}>膝关节康复运动处方</Text>
              <Text style={styles.leftText}>2025/10/01 - 2026/01/01</Text>
              <Text style={styles.statusInfo}>暂停原因：医生建议暂停</Text>
            </View>
            <Flex style={styles.yztBox}>
              <Text style={styles.yztText}>已暂停</Text>
            </Flex>
          </Flex>

          <Flex justify='between' style={styles.medicalBox}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.medicalTitle, { marginTop: 0 }]}>膝关节康复运动处方</Text>
              <Text style={styles.leftText}>2025/10/01 - 2026/01/01</Text>
              <Text style={styles.statusInfo}>暂停原因：医生建议暂停</Text>
            </View>
            <Flex style={styles.yztBox}>
              <Text style={styles.yztText}>已暂停</Text>
            </Flex>
          </Flex>

          <Flex justify='between' style={styles.medicalBox}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.medicalTitle, { marginTop: 0 }]}>膝关节康复运动处方</Text>
              <Text style={styles.leftText}>2025/10/01 - 2026/01/01</Text>
              <Text style={styles.statusInfo}>暂停原因：医生建议暂停</Text>
            </View>
            <Flex style={styles.yztBox}>
              <Text style={styles.yztText}>已暂停</Text>
            </Flex>
          </Flex>


        </View>
      </ScrollView>
    </TabPageLayout>
  );
}
