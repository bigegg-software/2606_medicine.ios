import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import { AppTheme } from '@/common/theme';
import styles from '@/css/community/community';
import type { RootStackParamList } from '@/route/router';
import { LinearGradient } from 'expo-linear-gradient';
import ActivityPage from './components/activity';
import LivePage from './components/live';
import CoursePage from './components/course';
import RankingPage from './components/ranking';
type Nav = NativeStackNavigationProp<RootStackParamList>;

const NAV_LIST = [
  { label: '活动', value: 'activity', path: ActivityPage },
  { label: '直播', value: 'live', path: LivePage },
  { label: '课程', value: 'course', path: CoursePage },
  { label: '排行榜', value: 'ranking', path: RankingPage },
] as const;

function getNavBackground(index: number, total: number) {
  if (index === 0) {
    return require('@/assets/images/community/leftBack.png');
  }
  if (index === total - 1) {
    return require('@/assets/images/community/rightBack.png');
  }
  return require('@/assets/images/community/cenBack.png');
}



export default function CommunityPage() {


  const navigation: any = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();

  const [activeNav, setActiveNav] = useState<string>(NAV_LIST[0].value);

  const navList = [
    {
      label: '全部',
      value: 'all'
    },
    {
      label: '社区活动',
      value: 'communityActivity'
    },
    {
      label: '课程学习',
      value: 'courseLearning'
    },
    {
      label: '通知',
      value: 'notice'
    }
  ]
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#B4D0FF', '#F5F8FF']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Text style={styles.pageTitle}>社区服务</Text>
      <View style={styles.pageLine} />


      <Flex justify='center'>
        <View style={styles.topNavBox}>
          {NAV_LIST.map((item, index) => {
            const isActive = activeNav === item.value;
            const label = (
              <Text style={[styles.topNavItemText, isActive && styles.topNavItemTextActive]}>{item.label}</Text>
            );

            return (
              <TouchableOpacity
                style={styles.topNavItem}
                key={item.value}
                activeOpacity={0.8}
                onPress={() => setActiveNav(item.value)}>
                {isActive ? (
                  <ImageBackground
                    source={getNavBackground(index, NAV_LIST.length)}
                    style={styles.topNavItemBg}
                    resizeMode="stretch">
                    {label}
                  </ImageBackground>
                ) : (
                  label
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Flex>
      <View style={styles.pageContent}>
        {activeNav === 'ranking' ? (
          <RankingPage />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {NAV_LIST[0].value === activeNav && <ActivityPage />}
            {NAV_LIST[1].value === activeNav && <LivePage />}
            {NAV_LIST[2].value === activeNav && <CoursePage />}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
