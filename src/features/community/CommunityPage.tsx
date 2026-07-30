import React, { useCallback, useState } from 'react';
import { View, Text, Image } from 'react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/community/community';
import ActivityPage from './components/activity';
import LivePage from './components/live';
import CoursePage from './components/course';
import RankingPage from './components/ranking';

const NAV_LIST = [
  { label: '排行榜', value: 'ranking' },
  { label: '直播', value: 'live' },
  { label: '课程', value: 'course' },
  { label: '活动', value: 'activity' },
] as const;

type NavValue = (typeof NAV_LIST)[number]['value'];

export default function CommunityPage() {
  const [activeNav, setActiveNav] = useState<NavValue>(NAV_LIST[0].value);
  /** 已访问过的 tab 保持挂载，避免切换时重复请求 */
  const [mountedTabs, setMountedTabs] = useState<Partial<Record<NavValue, boolean>>>({
    ranking: true,
  });

  const onPressNav = useCallback((value: NavValue) => {
    setActiveNav(value);
    setMountedTabs(prev => (prev[value] ? prev : { ...prev, [value]: true }));
  }, []);

  return (
    <TabPageLayout style={styles.container}>
      <Flex justify='center'>
        <View style={styles.topNavBox}>
          <Flex justify="around" style={styles.navBox}>
            {NAV_LIST.map((item, index) => (
              <Flex style={styles.navCol} key={index} onPress={() => onPressNav(item.value)}>
                <View style={styles.navItemWrap}>
                  <Text style={[styles.navText, activeNav === item.value && styles.activeNavText]}>{item.label}</Text>
                  {activeNav === item.value ? (
                    <View style={styles.navIndicatorWrap}>
                      <Image source={require('@/assets/images/user/btm.png')} style={styles.navIndicator} />
                    </View>
                  ) : null}
                </View>
              </Flex>
            ))}
          </Flex>
        </View>
      </Flex>
      <View style={styles.pageContent}>
        {mountedTabs.ranking ? (
          <View style={{ flex: 1, display: activeNav === 'ranking' ? 'flex' : 'none' }}>
            <RankingPage />
          </View>
        ) : null}
        {mountedTabs.live ? (
          <View style={{ flex: 1, display: activeNav === 'live' ? 'flex' : 'none' }}>
            <LivePage />
          </View>
        ) : null}
        {mountedTabs.course ? (
          <View style={{ flex: 1, display: activeNav === 'course' ? 'flex' : 'none' }}>
            <CoursePage />
          </View>
        ) : null}
        {mountedTabs.activity ? (
          <View style={{ flex: 1, display: activeNav === 'activity' ? 'flex' : 'none' }}>
            <ActivityPage />
          </View>
        ) : null}
      </View>
    </TabPageLayout>
  );
}
