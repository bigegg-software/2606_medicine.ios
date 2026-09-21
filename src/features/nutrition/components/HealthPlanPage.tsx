import React from 'react';
import { View, ScrollView, Text, Image, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/nutrition';
import { Flex } from '@ant-design/react-native';

/** 专享健康计划：页面内容待定 */
export default function HealthPlanPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const planItemStyle = [styles.planItem, { width: width - 24 }];
  const openCoachBooking = () => navigation.navigate('CoachBookingPage');
  return <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.dayTitle}>从医学评估到每周做得到的健康改变</Text>
      <Text style={styles.daySubtitle}>卓外医院健康管理中心医学评估·LM长期处方执行陪伴</Text>



      <View style={planItemStyle}>
        <Flex align="start" style={styles.planItemRow}>
          <Image style={styles.planItemIcon} source={require('@/assets/images/exercise/dtls.png')} />
          <View style={styles.planItemContent}>
            <Flex style={styles.planItemBtn} >
              <Image style={styles.planItemBtnIcon} source={require('@/assets/images/exercise/hs.png')}></Image>
              <Text style={styles.planItemBtnText}>适合你</Text>
            </Flex>
            <Text style={styles.planItemTitle} numberOfLines={1}>血压健康执行计划</Text>
            <Text style={styles.planItemSubtitle} numberOfLines={1} ellipsizeMode="tail">低钠饮食·规律活动·睡眠节律·压力管理</Text>
          </View>
        </Flex>
        <View style={styles.planItemDashWrap}>
          <View style={styles.planItemDash} />
        </View>
        <Flex justify="between" align="center">
          <Flex align="center">
            <Image style={styles.planItemBrandIcon} source={require('@/assets/images/exercise/fw.png')} />
            <Text style={styles.planItemBrandText}>阜外 My Health 方案</Text>
          </Flex>
          <Flex style={styles.planItemCoachBtn} onPress={openCoachBooking}>
            <Text style={styles.planItemCoachBtnText}>预约教练</Text>
          </Flex>
        </Flex>
      </View>
      <View style={planItemStyle}>
        <Flex align="start" style={styles.planItemRow}>
          <Image style={styles.planItemIcon} source={require('@/assets/images/exercise/dtls.png')} />
          <View style={styles.planItemContent}>
            <Flex style={styles.planItemBtn} >
              <Image style={styles.planItemBtnIcon} source={require('@/assets/images/exercise/hs.png')}></Image>
              <Text style={styles.planItemBtnText}>适合你</Text>
            </Flex>
            <Text style={styles.planItemTitle} numberOfLines={1}>血脂与体重管理计划</Text>
            <Text style={styles.planItemSubtitle} numberOfLines={1} ellipsizeMode="tail">优脂饮食·体成分·渐进运动·膳食纤维</Text>
          </View>
        </Flex>
        <View style={styles.planItemDashWrap}>
          <View style={styles.planItemDash} />
        </View>
        <Flex justify="between" align="center">
          <Flex align="center">
            <Image style={styles.planItemBrandIcon} source={require('@/assets/images/exercise/fw.png')} />
            <Text style={styles.planItemBrandText}>阜外 My Health 方案</Text>
          </Flex>
          <Flex style={styles.planItemCoachBtn} onPress={openCoachBooking}>
            <Text style={styles.planItemCoachBtnText}>查看详情</Text>
          </Flex>
        </Flex>
      </View>
      <Flex justify="center" align="center" style={styles.planListFooter}>
        <View style={styles.planListFooterLine} />
        <Text style={styles.planListFooterText}>寻得同行者，开启健康路</Text>
        <View style={styles.planListFooterLine} />
      </Flex>
    </ScrollView>
  </View>
}
