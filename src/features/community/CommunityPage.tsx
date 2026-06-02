import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
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
type Nav = NativeStackNavigationProp<RootStackParamList>;



export default function CommunityPage() {
  const navigation: any = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();

  const [activeNav, setActiveNav] = useState('all');
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

      <Flex style={styles.navBox}>
        {navList.map((item, index) => (
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>营养处方</Text>
        <View style={styles.mapBox}>
          <Flex justify='between' style={styles.mapBoxItem}>
            <View style={styles.mapLeftBox}>
              <Text style={styles.mapBoxItemTitle}>公园太极拳活动</Text>
              <Flex style={{ marginTop: 4 }}>
                <Image style={styles.mapIcon} tintColor={"#999"} source={require('@/assets/images/home/nz.png')} />
                <Text style={styles.mapText}>明天9:00</Text>
                <Image style={styles.mapIcon} tintColor={"#999"} source={require('@/assets/images/home/dw.png')} />
                <Text style={styles.mapText}>朝阳公园正门</Text>
              </Flex>
            </View>
            <Image source={require('@/assets/images/home/head.png')} style={styles.mapBoxItemImg} />
          </Flex>
        </View>
        <Text style={styles.sectionTitle}>最新动态</Text>
        <View style={styles.newDynamicBox}>
          <Image source={require('@/assets/images/home/head.png')} style={styles.newDynamicIcon} />
          <View style={styles.newDynamicContent}>
            <Text style={styles.mapBoxItemTitle}>公园太极拳活动</Text>
            <Text style={styles.newDynamicContentText}>每周六上午在朝阳公园东门集合，由专业教练带领练习太极拳，适合各年龄段老年人参加。</Text>
            <Flex style={{ marginTop: 6 }}>
              <Image style={styles.mapIcon} tintColor={"#999"} source={require('@/assets/images/home/nz.png')} />
              <Text style={styles.mapText}>明天9:00</Text>
              <Image style={styles.mapIcon} tintColor={"#999"} source={require('@/assets/images/home/dw.png')} />
              <Text style={styles.mapText}>朝阳公园正门</Text>
            </Flex>
            <Flex justify='between' style={styles.btmBox}>
              <Flex justify='center' align='center'>
                <Flex style={styles.headBox}>
                  <Image source={require('@/assets/images/home/head.png')} style={styles.head1} />
                  <Image source={require('@/assets/images/home/head.png')} style={styles.head2} />
                  <Image source={require('@/assets/images/home/head.png')} style={styles.head3} />
                </Flex>
                <Text style={styles.btmText}>花开富贵等28人参与</Text>
              </Flex>
              <TouchableOpacity style={styles.btmBtn}>
                <Flex justify='center' style={{ flex: 1 }}>
                  <Text style={styles.btmBtnText}>立即报名</Text>
                </Flex>
              </TouchableOpacity>
            </Flex>
          </View>
        </View>
        <Text style={styles.timeText}>5月20日 10:00</Text>
        <View style={styles.newDynamicBox}>
          <View style={styles.newDynamicContent}>
            <Text style={[styles.mapBoxItemTitle, { textAlign: 'center' }]}>公园太极拳活动</Text>
            <Text style={[styles.newDynamicContentText, { marginTop: 12 }]}>每周六上午在朝阳公园东门集合，由专业教练带领练习太极拳，适合各年龄段老年人参加。</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
