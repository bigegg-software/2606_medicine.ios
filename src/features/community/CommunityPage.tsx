import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
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

export default function CommunityPage() {
  const [activeNav, setActiveNav] = useState<string>(NAV_LIST[0].value);

  return (
    <TabPageLayout style={styles.container}>
      <Flex justify='center'>
        <View style={styles.topNavBox}>
          <Flex justify="around" style={styles.navBox}>
            {NAV_LIST.map((item, index) => (
              <TouchableOpacity style={styles.navCol} key={index} onPress={() => setActiveNav(item.value)}>
                <View style={styles.navItemWrap}>
                  <Text style={[styles.navText, activeNav === item.value && styles.activeNavText]}>{item.label}</Text>
                  {activeNav === item.value ? (
                    <View style={styles.navIndicatorWrap}>
                      <Image source={require('@/assets/images/user/btm.png')} style={styles.navIndicator} />
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </Flex>
        </View>
      </Flex>
      <View style={styles.pageContent}>
        {activeNav === 'ranking' ? (
          <RankingPage />
        ) : activeNav === 'course' ? (
          <CoursePage />
        ) : activeNav === 'activity' ? (
          <ActivityPage />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <LivePage />
          </ScrollView>
        )}
      </View>
    </TabPageLayout>
  );
}
