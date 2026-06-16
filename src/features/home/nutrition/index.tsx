import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import { AppTheme } from '@/common/theme';
import styles from '@/css/home/nutrition';
import type { RootStackParamList } from '@/route/router';



export default function CommunityPage() {
  const navigation: any = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const [activeNav, setActiveNav] = useState('diet');
  const navList = [
    {
      label: '饮食',
      value: 'diet'
    },
    {
      label: '运动',
      value: 'exercise'
    }
  ]
  return (
    <PageLayout style={styles.container}>
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
        <View style={styles.dietBox}>
          <Flex justify="between">
            <Text style={styles.dietTitle}>今日饮食</Text>
            <TouchableOpacity>
              <Text style={styles.addText}>添加</Text>
            </TouchableOpacity>
          </Flex>
          <View style={styles.dietInfo}>
            <Flex justify="between" style={styles.dietInfoItem}>
              <Flex style={{ flex: 1 }}>
                <Flex style={styles.dietImgBox} justify='center'>
                  <Image style={styles.dietImg} source={require('@/assets/images/home/rc.png')} />
                </Flex>
                <View style={styles.dietInfoTitle}>
                  <Flex>
                    <Text style={styles.dietTitleText}>早餐</Text>
                    <Text style={[styles.dietTitleText, { marginLeft: 12 }]}>500千卡</Text>
                  </Flex>
                  <Text style={styles.dietText}>牛奶、鸡蛋、全麦面包</Text>
                </View>
              </Flex>
              <Text style={styles.dietTimeText}>7:30</Text>
            </Flex>
            <View style={styles.rowLine} />
            <Flex justify="between" style={styles.dietInfoItem}>
              <Flex style={{ flex: 1 }}>
                <Flex style={styles.dietImgBox} justify='center'>
                  <Image style={styles.dietImg} source={require('@/assets/images/home/sun.png')} />
                </Flex>
                <View style={styles.dietInfoTitle}>
                  <Flex>
                    <Text style={styles.dietTitleText}>午餐</Text>
                    <Text style={[styles.dietTitleText, { marginLeft: 12 }]}>500千卡</Text>
                  </Flex>
                  <Text style={styles.dietText}>牛奶、鸡蛋、全麦面包</Text>
                </View>
              </Flex>
              <Text style={styles.dietTimeText}>7:30</Text>
            </Flex>
            <View style={styles.rowLine} />
            <Flex justify="between" style={styles.dietInfoItem}>
              <Flex style={{ flex: 1 }}>
                <Flex style={styles.dietImgBox} justify='center'>
                  <Image style={styles.dietImg} source={require('@/assets/images/home/yl.png')} />
                </Flex>
                <View style={styles.dietInfoTitle}>
                  <Flex>
                    <Text style={styles.dietTitleText}>晚餐</Text>
                    <Text style={[styles.dietTitleText, { marginLeft: 12 }]}>500千卡</Text>
                  </Flex>
                  <Text style={styles.dietText}>小米粥、素炒三丝</Text>
                </View>
              </Flex>
              <Text style={styles.dietTimeText}>7:30</Text>
            </Flex>

          </View>
        </View>

      </ScrollView>
    </PageLayout>
  );
}
