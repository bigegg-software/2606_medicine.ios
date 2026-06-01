import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, type ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flex, Carousel } from '@ant-design/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList } from '@/src/features/home/MainTabs';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { getLatestMetrics } from '@/api/health';
import { getSchedules } from '@/api/schedule';
import { getActivities } from '@/api/community';
import { getUserBaseInfo } from '@/api/patient';
import styles from '@/css/home/home';
import BloodPressureChart from './components/BloodPressureChart';
import { parseHealthMetrics, type HealthMetricModel, type ScheduleItem, type ActivityItem } from '@/common/models';
import { AppTheme } from '@/common/theme';
import { isApiOk, isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const AI_TIP = '今天天气晴朗，适合外出散步15分钟，记得带上水杯补充水分哦！';

type SportPrescription = {
  icon: ImageSourcePropType;
  title: string;
  color: string;
  progress: number;
  desc: string;
};

const SPORT_PRESCRIPTIONS: SportPrescription[] = [
  { icon: require('@/assets/images/home/img1.png'), title: '有氧心肺', color: '#FF2056', progress: 0.2, desc: '快走30分钟' },
  { icon: require('@/assets/images/home/img2.png'), title: '抗阻增肌', color: '#00A6F4', progress: 0.2, desc: '弹力带训练' },
  { icon: require('@/assets/images/home/img3.png'), title: '柔韧拉伸', color: '#FD9A00', progress: 0.2, desc: '瑜伽拉伸' },
  { icon: require('@/assets/images/home/img4.png'), title: '平衡控制', color: '#00C950', progress: 0.2, desc: '单脚站立' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return '早上好';
  if (h >= 12 && h < 18) return '下午好';
  return '晚上好';
}

function metricByType(metrics: HealthMetricModel[], ...keys: string[]): HealthMetricModel | undefined {
  const lower = keys.map(k => k.toLowerCase());
  const found = metrics.filter(m => {
    const t = m.type.toLowerCase();
    return lower.some(k => t === k || t.includes(k));
  });
  if (!found.length) return undefined;
  return found.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
}

function formatMetric(m: HealthMetricModel | undefined, suffix: string, loading: boolean): string {
  if (loading && !m) return '加载中';
  const raw = m?.value?.trim() ?? '';
  if (!raw) return `--${suffix}`;
  const n = parseFloat(raw);
  return `${Number.isFinite(n) ? Math.round(n) : raw}${suffix}`;
}

export default function HomeTab() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<HealthMetricModel[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown>>({});

  const load = useCallback(async () => {
    const [mRes, sRes, aRes, pRes] = await Promise.all([
      getLatestMetrics().catch(() => ({})),
      getSchedules(moment().format('YYYY-MM-DD')).catch(() => ({})),
      getActivities({ limit: 5 }).catch(() => ({})),
      getUserBaseInfo().catch(() => ({})),
    ]);
    if (isApiOk(mRes as { code?: number })) {
      setMetrics(parseHealthMetrics((mRes as { data?: unknown }).data ?? mRes));
    }
    if (isApiOk(sRes as { code?: number })) {
      const d = (sRes as { data?: unknown }).data;
      setSchedules(Array.isArray(d) ? (d as ScheduleItem[]) : []);
    }
    if (isApiOk(aRes as { code?: number })) {
      let raw = (aRes as { data?: unknown }).data;
      if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'content' in (raw as object)) {
        raw = (raw as { content: unknown }).content;
      }
      setActivities(Array.isArray(raw) ? (raw as ActivityItem[]) : []);
    }
    if (isResourceApiOk(pRes as { code?: number })) {
      const d = (pRes as { data?: Record<string, unknown> }).data;
      if (d && typeof d === 'object') setProfile(d);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const userName = String(profile.nickname ?? profile.name ?? '张爷爷');
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][moment().day()];
  const timeStr = moment().format('HH:mm');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppTheme.primaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#B4D0FF', '#F5F8FF']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Image source={require('@/assets/images/home/homeLogo.png')} style={styles.miniLogo} />
          </View>
          <TouchableOpacity style={styles.topRight}>
            <Image source={require('@/assets/images/home/tip.png')} style={styles.rightImg} />
            <View style={styles.redDot}></View>
          </TouchableOpacity>
        </View>

        <View style={styles.nameBox}>
          <View style={styles.glassBox}>
            <Flex>
              <View style={styles.headBox}>
                <Image source={require('@/assets/images/home/head.png')} style={styles.headImg} />
              </View>
              <Text style={styles.greeting}>{greeting()},{userName}</Text>
            </Flex>

            <Text style={styles.greetingTime}>{weekday} {timeStr}</Text>
          </View>
          <Text style={styles.glassText}>
            今日状态良好！但血糖略高，请注意晚饭主食摄入，坚持散步可以有效增强心肺功能哦！
          </Text>
        </View>


        <View style={styles.healthBox}>
          <Flex justify='between'>
            <Flex>
              <Image source={require('@/assets/images/home/icon-xin.png')} style={styles.healthIcon} />
              <View style={styles.healthTitleBox}>
                <Text style={styles.healthTitle}>健康状态</Text>
                <Text style={styles.healthTime}>更新于15.56</Text>
              </View>
            </Flex>
            <Text style={styles.healthStatus}>一切良好</Text>
          </Flex>
          <View style={styles.healthLine} />

          <Carousel
            style={styles.healthSwiper}
            // autoplay
            infinite
            autoplayInterval={4000}
            dotStyle={styles.swiperDot}
            dotActiveStyle={styles.swiperDotActive}>
            <Flex style={styles.healthSlide} justify="between" align="center">
              <View>
                <Flex>
                  <Image source={require('@/assets/images/home/bp.png')} style={styles.swiperIcon} />
                  <Text style={styles.healthSlideLabel}>血压</Text>
                </Flex>
                <Text style={styles.healthSlideValue}>142/92</Text>
                <Text style={styles.healthSlideUnit}>mmHg</Text>
                <Text style={styles.healthSlideStatus}>・偏高</Text>
              </View>
              <BloodPressureChart />
            </Flex>
            <Flex style={styles.healthSlide}>
            </Flex>
            <Flex style={styles.healthSlide}>
            </Flex>
          </Carousel>
        </View>

        <Text style={styles.sectionTitle}>营养处方</Text>
        <Flex style={styles.nutritionBox} justify="between">
          <Flex style={styles.nutritionCard}>
            <Image style={styles.nutritionIcon} source={require('@/assets/images/home/jn.png')} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.nutritionTitle} numberOfLines={1}>服用降压药</Text>
              <Text style={styles.nutritionSub} numberOfLines={1}>8:00 5mg/次</Text>
            </View>
            <Image style={styles.nutritionRadio} source={require('@/assets/images/home/radio.png')} />
          </Flex>

          <Flex style={styles.nutritionCard}>
            <Image style={styles.nutritionIcon} source={require('@/assets/images/home/jn.png')} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.nutritionTitle} numberOfLines={1}>早餐处方</Text>
              <Text style={styles.nutritionSub} numberOfLines={1}>7:30 饮用牛奶 1 杯</Text>
            </View>
            <Image style={styles.nutritionRadio} source={require('@/assets/images/home/selectRadio.png')} />
          </Flex>
        </Flex>

        <Flex justify='between'>
          <Text style={styles.sectionTitle}>运动处方</Text>
          <TouchableOpacity>
            <Flex style={{ marginTop: 16 }}>
              <Text style={styles.more}>查看全部</Text>
              <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
            </Flex>
          </TouchableOpacity>
        </Flex>

        <Flex wrap="wrap" style={styles.sportBox}>
          {SPORT_PRESCRIPTIONS.map(item => (
            <SportPrescriptionRow key={item.title} {...item} />
          ))}
        </Flex>

        <Flex justify='between'>
          <Text style={styles.sectionTitle}>社区活动</Text>
          <TouchableOpacity>
            <Flex style={{ marginTop: 16 }}>
              <Text style={styles.more}>查看全部</Text>
              <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
            </Flex>
          </TouchableOpacity>
        </Flex>

        <View style={styles.mapBox}>
          <Flex justify='between' style={styles.mapBoxItem}>
            <View style={styles.mapLeftBox}>
              <Text style={styles.mapBoxItemTitle}>公园太极拳活动</Text>
              <Flex>
                <Image style={styles.mapIcon} source={require('@/assets/images/home/nz.png')} />
                <Text style={styles.mapText}>明天9:00</Text>
                <Image style={styles.mapIcon} source={require('@/assets/images/home/dw.png')} />
                <Text style={styles.mapText}>朝阳公园正门</Text>
              </Flex>
            </View>
            <Image source={require('@/assets/images/home/head.png')} style={styles.mapBoxItemImg} />
          </Flex>
        </View>







        {/* <LinearGradient colors={['#1A3A4A', '#2D5A5A']} style={styles.hero} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}>
          <View style={styles.heroTop}>
            <Text style={styles.heroTime}>{weekday} {timeStr}</Text>
            <View style={styles.healthPill}>
              <View style={styles.greenDot} />
              <Text style={styles.healthPillText}>健康良好</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>健康，从预防开始</Text>
          <View style={styles.heroStats}>
            <HeroStat icon="directions-walk" label={formatMetric(steps, '步', false)} />
            <HeroStat icon="favorite-border" label={formatMetric(heart, '/分', false)} />
            <HeroStat icon="local-fire-department" label={formatMetric(calories, '卡', false)} />
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>康复训练</Text>
        <View style={styles.trainingRow}>
          <TrainingCard
            title="肌少症"
            sub="抗阻力训练"
            color="#E0F2FE"
            iconColor="#0EA5E9"
            onPress={() => navigation.navigate('Training', { catalogId: 'sarcopenia' })}
          />
          <TrainingCard
            title="心血管"
            sub="有氧运动"
            color="#FFE4E6"
            iconColor="#FB7185"
            onPress={() => navigation.navigate('Training', { catalogId: 'cardio' })}
          />
        </View>

        <TouchableOpacity style={styles.statusCard} onPress={() => navigation.navigate('Health')}>
          <MaterialIcons name="check-circle" size={28} color="#22C55E" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.statusTitle}>今日健康状态</Text>
            <Text style={styles.statusSub}>一切良好，继续保持</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
        </TouchableOpacity>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>今日安排</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.more}>查看全部</Text>
          </TouchableOpacity>
        </View>
        {schedules.length === 0 ? (
          <Text style={styles.emptyLine}>今日暂无安排</Text>
        ) : (
          schedules.slice(0, 3).map((s, i) => (
            <View key={String(s.id ?? i)} style={styles.scheduleRow}>
              <Text style={styles.scheduleTime}>{s.scheduledTime?.slice(11, 16) ?? '--:--'}</Text>
              <Text style={styles.scheduleTitle}>{s.title ?? '安排事项'}</Text>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>核心功能</Text>
        <View style={styles.grid}>
          <FeatureCell label="健康管理" enabled onPress={() => navigation.navigate('Health')} />
          <FeatureCell label="康复训练" enabled onPress={() => navigation.navigate('Training')} />
          <FeatureCell label="用药提醒" enabled onPress={() => navigation.navigate('Medication')} />
          <FeatureCell label="紧急求助" enabled={false} />
        </View>

        <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.aiTip} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <MaterialIcons name="lightbulb" size={24} color="#EA580C" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.aiTipTitle}>AI 健康小贴士</Text>
            <Text style={styles.aiTipBody}>{AI_TIP}</Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>社区动态</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Community')}>
            <Text style={styles.more}>更多</Text>
          </TouchableOpacity>
        </View>
        {activities.slice(0, 1).map(a => (
          <TouchableOpacity
            key={String(a.id)}
            style={styles.activityCard}
            onPress={() => navigation.navigate('ActivityDetail', { id: a.id! })}>
            <Text style={styles.activityTitle}>{a.title ?? '社区活动'}</Text>
            <Text style={styles.activitySub}>{a.location ?? ''} · {a.startTime?.slice(0, 10) ?? ''}</Text>
          </TouchableOpacity>
        ))}
        {activities.length === 0 ? <Text style={styles.emptyLine}>暂无社区活动</Text> : null} */}
      </ScrollView>
    </SafeAreaView>
  );
}

function SportPrescriptionRow({ icon, title, color, progress, desc }: SportPrescription) {
  return (
    <View style={styles.sportRow}>
      <Flex>
        <Image style={styles.sportIcon} source={icon} />
        <Text style={styles.sportTitle}>{title}</Text>
      </Flex>
      <View style={styles.sportLineBox}>
        <View style={[styles.sportProgressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.sportText}>{desc}</Text>
    </View>
  );
}