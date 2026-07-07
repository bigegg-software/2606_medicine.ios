import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ScrollView, Image } from 'react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import styles from '@/css/community/community';
import type { RootStackParamList } from '@/route/router';
import ActivityPage from './components/activity';
import LivePage from './components/live';
import CoursePage from './components/course';
import RankingPage from './components/ranking';
type Nav = NativeStackNavigationProp<RootStackParamList>;

const NAV_LIST = [
  { label: '排行榜', value: 'ranking', path: RankingPage },
  { label: '直播', value: 'live', path: LivePage },
  { label: '课程', value: 'course', path: CoursePage },
  { label: '福利', value: 'activity', path: ActivityPage },
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
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {NAV_LIST[3].value === activeNav && <ActivityPage />}
            {NAV_LIST[1].value === activeNav && <LivePage />}
          </ScrollView>
        )}
      </View>
    </TabPageLayout>
  );
}
